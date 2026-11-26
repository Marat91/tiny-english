import Anthropic from '@anthropic-ai/sdk';

/* Сервер Tiny English (Cloudflare Worker).
   - /tg          — сообщения от Telegram боту (/start, /stop, приглашение в семью)
   - /api/*       — запросы из игры: синхронизация прогресса, семья, настройки напоминаний
   - /setup       — привязывает бота к этому серверу (безопасно вызывать повторно)
   - расписание   — раз в час рассылает напоминания тем, кто сегодня не занимался, по воскресеньям — отчёт за неделю
   - /api/hear    — распознаёт короткую запись голоса (Workers AI, Whisper); нужен блок [ai] в wrangler.toml
   - /api/chat    — ответ питомца в разговоре (Claude); нужен секрет ANTHROPIC_API_KEY */

const HEAR_PER_DAY = 120, CHAT_PER_DAY = 40;          // лимиты на одного пользователя Telegram в сутки

const PETS = { dog: ['🐶', 'Бадди соскучился'], cat: ['🐱', 'Луна соскучилась'], bunny: ['🐰', 'Банни соскучился'] };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

async function hmac(key, msg){
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(msg));
}
/* Секрет для вебхука выводится из токена — отдельно хранить его не нужно */
const hookSecret = async env => hex(await crypto.subtle.digest('SHA-256', enc.encode('hook:' + env.BOT_TOKEN))).slice(0, 48);

/* Проверка подписи Telegram: запрос действительно пришёл из игры, открытой этим пользователем */
async function verify(initData, env){
  if (!initData || typeof initData !== 'string') return null;
  const p = new URLSearchParams(initData), hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const check = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const calc = hex(await hmac(await hmac('WebAppData', env.BOT_TOKEN), check));
  if (calc.length !== hash.length) return null;
  let diff = 0;
  for (let i = 0; i < calc.length; i++) diff |= calc.charCodeAt(i) ^ hash.charCodeAt(i);
  if (diff) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 7 * 86400) return null;
  try { const u = JSON.parse(p.get('user')); return u && Number.isInteger(u.id) ? u : null } catch (e) { return null }
}

async function tgApi(env, method, body){
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
}
const playButton = env => ({ inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: env.APP_URL } }]] });

const str = (v, max) => String(v == null ? '' : v).slice(0, max);
const int = (v, lo, hi, def) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def };
const isDay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

async function ensureUser(env, u){
  // фото профиля Telegram приходит только из игры (в подписанных данных); сообщения боту его не содержат
  const photo = typeof u.photo_url === 'string' && /^https:\/\/[^\s"'<>]{1,300}$/.test(u.photo_url) ? u.photo_url : null;
  await env.DB.prepare('INSERT INTO users (tg_id, name, photo) VALUES (?, ?, ?) ON CONFLICT(tg_id) DO UPDATE SET name = excluded.name, photo = COALESCE(excluded.photo, users.photo)')
    .bind(u.id, str(u.first_name, 40), photo).run();
}

/* Настоящее фото профиля. Ссылка, которую Telegram отдаёт игре, часто ведёт на заглушку с буквой,
   поэтому фото берём через бота и храним у себя (маленькое, ~160 px). Отдаём по случайному ключу /photo/<ключ>.
   Вернёт true, если фото есть. */
async function refreshPhoto(env, id){
  let img = null, type = null, why = 'error';
  try {
    const r = await tgApi(env, 'getUserProfilePhotos', { user_id: id, limit: 1 });
    const sizes = r.ok && r.data && r.data.result && r.data.result.photos && r.data.result.photos[0];
    why = !r.ok ? 'api ' + r.status + ' ' + (r.data && r.data.description || '') : !sizes ? 'no photos visible to the bot (total ' + (r.data.result && r.data.result.total_count) + ')' : 'file';
    if (sizes && sizes.length){
      const pick = sizes.find(s => s.width >= 160) || sizes[sizes.length - 1];
      const f = await tgApi(env, 'getFile', { file_id: pick.file_id });
      const path = f.ok && f.data && f.data.result && f.data.result.file_path;
      if (path){
        const res = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${path}`);
        const buf = res.ok ? await res.arrayBuffer() : null;
        if (buf && buf.byteLength > 0 && buf.byteLength <= 400000){ img = buf; type = /\.png$/i.test(path) ? 'image/png' : 'image/jpeg'; why = 'ok' }
      }
    }
  } catch (e) { console.error(e) }
  const key = hex(crypto.getRandomValues(new Uint8Array(16)));
  await env.DB.prepare(`INSERT INTO user_photos (tg_id, key, img, type, checked) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(tg_id) DO UPDATE SET img = excluded.img, type = excluded.type, checked = excluded.checked`)
    .bind(id, key, img, type, new Date().toISOString()).run();
  return { ok: !!img, why };
}
async function servePhoto(env, key){
  const r = await env.DB.prepare('SELECT img, type FROM user_photos WHERE key = ? AND img IS NOT NULL').bind(key).first()
    || await env.DB.prepare("SELECT img, 'image/jpeg' type FROM profile_photos WHERE key = ?").bind(key).first();   // или фото, загруженное в игре
  if (!r) return new Response('not found', { status: 404 });
  return new Response(r.img instanceof ArrayBuffer ? r.img : new Uint8Array(r.img), { headers: { 'content-type': r.type || 'image/jpeg', 'cache-control': 'public, max-age=21600', ...CORS } });
}

const GROUP_RE = /^[0-9a-f]{12}$/;
const invite = (env, code) => `https://t.me/${env.BOT_USERNAME}?start=grp_${code}`;

/* Настройки и список групп пользователя */
async function state(env, id){
  const me = await env.DB.prepare(`SELECT u.remind_on, u.remind_hour, u.public, u.weekly_on, CASE WHEN ph.img IS NOT NULL THEN '/photo/' || ph.key ELSE u.photo END photo
      FROM users u LEFT JOIN user_photos ph ON ph.tg_id = u.tg_id WHERE u.tg_id = ?`).bind(id).first();
  const gifts = (await env.DB.prepare('SELECT id, to_pid pid, from_name, kind, val, card FROM gifts WHERE to_tg = ? AND taken = 0 ORDER BY id LIMIT 20').bind(id).all()).results;
  const groups = (await env.DB.prepare(`SELECT g.code, g.name, g.owner, (SELECT COUNT(*) FROM members x WHERE x.code = g.code) n, (SELECT total FROM funds f WHERE f.code = g.code) fund
      FROM groups g JOIN members m ON m.code = g.code WHERE m.tg_id = ? ORDER BY g.created`).bind(id).all()).results;
  return {
    remind_on: !!me.remind_on, remind_hour: me.remind_hour, public: !!me.public, photo: me.photo || null,
    weekly_on: me.weekly_on !== 0, chat: !!env.ANTHROPIC_API_KEY, hear: !!env.AI,
    pics: Object.fromEntries((await env.DB.prepare('SELECT pid, key FROM profile_photos WHERE tg_id = ?').bind(id).all()).results.map(r => [r.pid, '/photo/' + r.key])),
    gifts: gifts.map(g => ({ id: g.id, pid: g.pid, from: g.from_name, kind: g.kind, val: g.val, card: g.card })),
    groups: groups.map(g => ({ code: g.code, name: g.name, members: g.n, mine: g.owner === id, fund: g.fund || 0, invite: invite(env, g.code) })),
  };
}

/* Рейтинг: scope = 'all' (все, кто не скрылся) или код группы */
async function board(env, id, scope){
  // фото видно в своих группах и самому себе; в общем рейтинге чужие фото не показываем
  const row = (r, rank) => ({ rank, name: r.name, avatar: r.avatar, char: r.char, stars: r.stars, streak: r.streak, mine: r.tg_id === id,
    photo: (r.avatar === 'tg' || r.avatar === 'ph') && (scope !== 'all' || r.tg_id === id) ? r.photo || null : null });
  if (scope === 'all'){
    const top = (await env.DB.prepare(`SELECT p.tg_id, p.pid, p.name, p.avatar, p.char, p.stars, p.streak, CASE WHEN p.avatar = 'ph' THEN '/photo/' || pp.key WHEN ph.img IS NOT NULL THEN '/photo/' || ph.key ELSE u.photo END photo FROM profiles p
        JOIN users u ON u.tg_id = p.tg_id LEFT JOIN user_photos ph ON ph.tg_id = p.tg_id LEFT JOIN profile_photos pp ON pp.tg_id = p.tg_id AND pp.pid = p.pid WHERE u.public = 1 OR p.tg_id = ?1
        ORDER BY p.stars DESC, p.streak DESC, p.name LIMIT 50`).bind(id).all()).results;
    const rows = top.map((r, i) => row(r, i + 1));
    const total = (await env.DB.prepare('SELECT COUNT(*) n FROM profiles p JOIN users u ON u.tg_id = p.tg_id WHERE u.public = 1 OR p.tg_id = ?1').bind(id).first()).n;
    // свои профили, не попавшие в первые 50, показываем отдельной строкой с их местом
    const mine = (await env.DB.prepare(`SELECT p.tg_id, p.pid, p.name, p.avatar, p.char, p.stars, p.streak, CASE WHEN p.avatar = 'ph' THEN '/photo/' || pp.key WHEN ph.img IS NOT NULL THEN '/photo/' || ph.key ELSE u.photo END photo FROM profiles p JOIN users u ON u.tg_id = p.tg_id
        LEFT JOIN user_photos ph ON ph.tg_id = p.tg_id LEFT JOIN profile_photos pp ON pp.tg_id = p.tg_id AND pp.pid = p.pid WHERE p.tg_id = ? ORDER BY p.stars DESC`).bind(id).all()).results;
    for (const m of mine){
      if (top.some(t => t.tg_id === m.tg_id && t.pid === m.pid)) continue;
      const above = (await env.DB.prepare('SELECT COUNT(*) n FROM profiles p JOIN users u ON u.tg_id = p.tg_id WHERE (u.public = 1 OR p.tg_id = ?1) AND p.stars > ?2').bind(id, m.stars).first()).n;
      rows.push(row(m, above + 1));
    }
    return { scope, total, rows };
  }
  if (!GROUP_RE.test(String(scope))) return null;
  const member = await env.DB.prepare('SELECT 1 x FROM members WHERE code = ? AND tg_id = ?').bind(scope, id).first();
  if (!member) return null;
  const list = (await env.DB.prepare(`SELECT p.tg_id, p.pid, p.name, p.avatar, p.char, p.stars, p.streak, CASE WHEN p.avatar = 'ph' THEN '/photo/' || pp.key WHEN ph.img IS NOT NULL THEN '/photo/' || ph.key ELSE u.photo END photo FROM profiles p
      JOIN members m ON m.tg_id = p.tg_id JOIN users u ON u.tg_id = p.tg_id LEFT JOIN user_photos ph ON ph.tg_id = p.tg_id LEFT JOIN profile_photos pp ON pp.tg_id = p.tg_id AND pp.pid = p.pid WHERE m.code = ? ORDER BY p.stars DESC, p.streak DESC, p.name LIMIT 100`).bind(scope).all()).results;
  const rows = [];
  for (let i = 0; i < list.length; i++) rows.push({ ...row(list[i], i + 1), ref: await refOf(env, list[i].tg_id, list[i].pid) });
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const asks = (await env.DB.prepare('SELECT tg_id, pid, name, n, item FROM asks WHERE code = ? AND created > ? ORDER BY created DESC LIMIT 10').bind(scope, since).all()).results;
  const askRows = [];
  for (const a of asks) askRows.push({ name: a.name, n: a.n, item: a.item, mine: a.tg_id === id, ref: await refOf(env, a.tg_id, a.pid) });
  return { scope, total: list.length, rows, fund: await fundInfo(env, scope, id), asks: askRows };
}

async function joinGroup(env, code, id){
  const g = await env.DB.prepare('SELECT code, name FROM groups WHERE code = ?').bind(code).first();
  if (!g) return null;
  const n = (await env.DB.prepare('SELECT COUNT(*) n FROM members WHERE code = ?').bind(code).first()).n;
  if (n >= 100) return { full: true, name: g.name };
  await env.DB.prepare('INSERT OR IGNORE INTO members (code, tg_id) VALUES (?, ?)').bind(code, id).run();
  return { name: g.name };
}

/* Дуэль: набор вопросов и результаты всех, кто на них ответил */
const DUEL_RE = /^[0-9a-f]{12}$/, Q_TYPES = ['listen', 'missing', 'wlisten', 'wread', 'whear'];
async function duelInfo(env, id, uid){
  const d = await env.DB.prepare('SELECT d.id, d.q, d.created, u.name owner FROM duels d LEFT JOIN users u ON u.tg_id = d.owner WHERE d.id = ?').bind(id).first();
  if (!d) return null;
  const sc = (await env.DB.prepare(`SELECT s.tg_id, s.pid, s.name, s.avatar, s.score, s.ms, CASE WHEN s.avatar = 'ph' THEN '/photo/' || pp.key WHEN ph.img IS NOT NULL THEN '/photo/' || ph.key ELSE u.photo END photo FROM duel_scores s LEFT JOIN users u ON u.tg_id = s.tg_id
      LEFT JOIN user_photos ph ON ph.tg_id = s.tg_id LEFT JOIN profile_photos pp ON pp.tg_id = s.tg_id AND pp.pid = s.pid WHERE s.id = ? ORDER BY s.score DESC, s.ms ASC`).bind(id).all()).results;
  let q = []; try { q = JSON.parse(d.q) } catch (e) {}
  return {
    id: d.id, created: d.created, owner: d.owner, q, invite: `https://t.me/${env.BOT_USERNAME}?start=duel_${id}`,
    scores: sc.map(s => ({ mine: s.tg_id === uid, pid: s.tg_id === uid ? s.pid : null, name: s.name, avatar: s.avatar, photo: s.avatar === 'tg' || s.avatar === 'ph' ? s.photo || null : null, score: s.score, ms: s.ms })),
  };
}
async function joinDuel(env, id, uid){
  const d = await env.DB.prepare('SELECT id FROM duels WHERE id = ?').bind(id).first();
  if (!d) return null;
  const n = (await env.DB.prepare('SELECT COUNT(*) n FROM duel_players WHERE id = ?').bind(id).first()).n;
  if (n >= 20) return { full: true };
  await env.DB.prepare('INSERT OR IGNORE INTO duel_players (id, tg_id) VALUES (?, ?)').bind(id, uid).run();
  return {};
}
async function duelApi(env, u, body){
  const id = String(body.id || '');
  if (body.action === 'create'){
    const q = (Array.isArray(body.q) ? body.q : []).slice(0, 12)
      .filter(x => x && typeof x.k === 'string' && /^[LW]:[A-Za-z][A-Za-z '-]{0,22}$/.test(x.k) && Q_TYPES.includes(x.t))
      .map(x => ({ k: x.k, t: x.t }));
    if (q.length < 4) return json({ error: 'q' }, 400);
    const since = new Date(Date.now() - 864e5).toISOString();
    const made = (await env.DB.prepare('SELECT COUNT(*) n FROM duels WHERE owner = ? AND created > ?').bind(u.id, since).first()).n;
    if (made >= 30) return json({ error: 'limit' }, 400);
    const fresh = hex(crypto.getRandomValues(new Uint8Array(6)));
    await env.DB.batch([
      env.DB.prepare('INSERT INTO duels (id, owner, created, q) VALUES (?, ?, ?, ?)').bind(fresh, u.id, new Date().toISOString(), JSON.stringify(q)),
      env.DB.prepare('INSERT INTO duel_players (id, tg_id) VALUES (?, ?)').bind(fresh, u.id),
    ]);
    return json({ duel: await duelInfo(env, fresh, u.id) });
  }
  if (body.action === 'list'){
    const ids = (await env.DB.prepare(`SELECT d.id FROM duels d JOIN duel_players p ON p.id = d.id WHERE p.tg_id = ?
        ORDER BY d.created DESC LIMIT 8`).bind(u.id).all()).results;
    const duels = [];
    for (const r of ids) duels.push(await duelInfo(env, r.id, u.id));
    return json({ duels: duels.filter(Boolean) });
  }
  if (body.action === 'score'){
    if (!DUEL_RE.test(id)) return json({ error: 'id' }, 400);
    const d = await env.DB.prepare('SELECT q FROM duels WHERE id = ?').bind(id).first();
    const player = await env.DB.prepare('SELECT 1 x FROM duel_players WHERE id = ? AND tg_id = ?').bind(id, u.id).first();
    if (!d || !player) return json({ error: 'duel' }, 404);
    let max = 12; try { max = JSON.parse(d.q).length } catch (e) {}
    // засчитывается только первая попытка каждого ученика
    await env.DB.prepare('INSERT OR IGNORE INTO duel_scores (id, tg_id, pid, name, avatar, score, ms) VALUES (?,?,?,?,?,?,?)')
      .bind(id, u.id, str(body.pid, 24), str(body.name, 20), str(body.avatar, 16), int(body.score, 0, max, 0), int(body.ms, 0, 3600000, 0)).run();
    return json({ duel: await duelInfo(env, id, u.id) });
  }
  return json({ error: 'action' }, 400);
}

/* ===== Подарки, гости, просьбы и общая цель группы =====
   Участника группы игра называет не номером Telegram, а коротким «ref» — отпечатком, который понимает только сервер. */
const refOf = async (env, tg, pid) => hex(await hmac(env.BOT_TOKEN, 'ref:' + tg + ':' + pid)).slice(0, 16);
const ITEM_RE = /^[a-z]{2,12}$/;
const isMember = async (env, code, id) => GROUP_RE.test(String(code)) && !!(await env.DB.prepare('SELECT 1 x FROM members WHERE code = ? AND tg_id = ?').bind(code, id).first());
/* Комната ученика, как её прислала игра: только короткие названия вещей и числа */
function roomJson(r){
  if (!r || typeof r !== 'object') return null;
  const o = (Array.isArray(r.o) ? r.o : []).filter(x => typeof x === 'string' && ITEM_RE.test(x)).slice(0, 40);
  const s = (Array.isArray(r.s) ? r.s : []).slice(0, 3).map(v => int(v, 0, 100, 50));
  while (s.length < 3) s.push(50);
  return JSON.stringify({ o, w: typeof r.w === 'string' && /^[a-z]{0,10}$/.test(r.w) ? r.w : '', s, st: int(r.st, 0, 3, 0) });
}
async function findTarget(env, code, ref){
  if (typeof ref !== 'string' || !/^[0-9a-f]{16}$/.test(ref)) return null;
  const list = (await env.DB.prepare(`SELECT p.tg_id, p.pid, p.name, p.char, p.stars, p.room FROM profiles p
      JOIN members m ON m.tg_id = p.tg_id WHERE m.code = ? LIMIT 400`).bind(code).all()).results;
  for (const r of list) if (await refOf(env, r.tg_id, r.pid) === ref) return r;
  return null;
}
async function fundInfo(env, code, id){
  const f = await env.DB.prepare('SELECT total FROM funds WHERE code = ?').bind(code).first();
  const parts = (await env.DB.prepare('SELECT tg_id, name, n FROM fund_parts WHERE code = ? ORDER BY n DESC LIMIT 8').bind(code).all()).results;
  return { total: f ? f.total : 0, parts: parts.map(p => ({ name: p.name, n: p.n, mine: p.tg_id === id })) };
}
const dayUTC = () => new Date().toISOString().slice(0, 10);

async function socialApi(env, u, path, body){
  if (path === '/api/gift' && body.action === 'take'){
    await env.DB.prepare('UPDATE gifts SET taken = 1 WHERE id = ? AND to_tg = ?').bind(int(body.id, 0, 1e12, 0), u.id).run();
    return json({ ok: true });
  }
  const code = String(body.code || '');
  if (!await isMember(env, code, u.id)) return json({ error: 'group' }, 404);

  if (path === '/api/ask'){
    const item = ITEM_RE.test(String(body.item || '')) ? body.item : '';
    await env.DB.prepare(`INSERT INTO asks (code, tg_id, pid, name, n, item, created) VALUES (?,?,?,?,?,?,?)
        ON CONFLICT(code, tg_id, pid) DO UPDATE SET name = excluded.name, n = excluded.n, item = excluded.item, created = excluded.created`)
      .bind(code, u.id, str(body.pid, 24), str(body.name, 20), int(body.n, 1, 50, 10), item, new Date().toISOString()).run();
    return json({ ok: true });
  }
  if (path === '/api/fund'){
    const n = int(body.n, 1, 50, 0), pid = str(body.pid, 24);
    if (!n || !pid) return json({ error: 'n' }, 400);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO funds (code, total) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET total = total + excluded.total').bind(code, n),
      env.DB.prepare(`INSERT INTO fund_parts (code, tg_id, pid, name, n) VALUES (?,?,?,?,?)
          ON CONFLICT(code, tg_id, pid) DO UPDATE SET n = n + excluded.n, name = excluded.name`).bind(code, u.id, pid, str(body.name, 20), n),
    ]);
    return json({ fund: await fundInfo(env, code, u.id) });
  }

  const t = await findTarget(env, code, body.ref);
  if (!t) return json({ error: 'who' }, 404);
  if (path === '/api/visit'){
    let room = null; try { room = JSON.parse(t.room) } catch (e) {}
    const treated = !!(await env.DB.prepare('SELECT 1 x FROM treats WHERE from_tg = ? AND to_tg = ? AND to_pid = ? AND day = ?').bind(u.id, t.tg_id, t.pid, dayUTC()).first());
    const f = await env.DB.prepare('SELECT total FROM funds WHERE code = ?').bind(code).first();
    return json({ name: t.name, char: t.char, stars: t.stars, room: room || { o: [], w: '', s: [50, 50, 50], st: 0 }, treated, fund: f ? f.total : 0 });
  }
  if (t.tg_id === u.id) return json({ ok: false, why: 'self' });
  const from = str(body.from, 20) || str(u.first_name, 20);
  if (path === '/api/treat'){
    const r = await env.DB.prepare('INSERT OR IGNORE INTO treats (from_tg, to_tg, to_pid, day) VALUES (?,?,?,?)').bind(u.id, t.tg_id, t.pid, dayUTC()).run();
    if (!r.meta || !r.meta.changes) return json({ ok: false, why: 'today' });
    await env.DB.prepare("INSERT INTO gifts (to_tg, to_pid, from_tg, from_name, kind, val, card, created) VALUES (?,?,?,?,'t','',0,?)")
      .bind(t.tg_id, t.pid, u.id, from, new Date().toISOString()).run();
    return json({ ok: true });
  }
  if (path === '/api/gift'){
    const kind = body.kind === 'i' ? 'i' : 'b';
    const val = kind === 'b' ? String(int(body.val, 1, 20, 5)) : ITEM_RE.test(String(body.val || '')) ? body.val : null;
    if (val === null) return json({ error: 'val' }, 400);
    const sent = (await env.DB.prepare("SELECT COUNT(*) n FROM gifts WHERE from_tg = ? AND kind <> 't' AND created > ?").bind(u.id, dayUTC()).first()).n;
    if (sent >= 5) return json({ ok: false, why: 'limit' });                    // не больше пяти подарков в день
    await env.DB.batch([
      env.DB.prepare('INSERT INTO gifts (to_tg, to_pid, from_tg, from_name, kind, val, card, created) VALUES (?,?,?,?,?,?,?,?)')
        .bind(t.tg_id, t.pid, u.id, from, kind, val, int(body.card, 0, 9, 0), new Date().toISOString()),
      env.DB.prepare('DELETE FROM asks WHERE tg_id = ? AND pid = ?').bind(t.tg_id, t.pid),               // просьба выполнена
    ]);
    try { await tgApi(env, 'sendMessage', { chat_id: t.tg_id, text: `🎁 ${from} прислал(а) подарок для ${t.name} в Tiny English! Откройте игру, чтобы посмотреть 👇`, reply_markup: playButton(env) }) } catch (e) {}
    return json({ ok: true });
  }
  return json({ error: 'not found' }, 404);
}

async function api(path, body, env){
  const u = await verify(body.initData, env);
  if (!u) return json({ error: 'auth' }, 401);
  await ensureUser(env, u);
  if (path === '/api/duel') return duelApi(env, u, body);
  if (path === '/api/hear') return hearApi(env, u, body);
  if (path === '/api/tour') return tourApi(env, u, body);
  if (path === '/api/chat') return chatApi(env, u, body);
  if (['/api/gift', '/api/visit', '/api/treat', '/api/ask', '/api/fund'].includes(path)) return socialApi(env, u, path, body);

  if (path === '/api/sync'){
    const list = Array.isArray(body.profiles) ? body.profiles.slice(0, 8) : [];
    const stmts = [env.DB.prepare('DELETE FROM profiles WHERE tg_id = ?').bind(u.id)];
    let lastActive = null;
    for (const p of list){
      const last = isDay(p.last) ? p.last : null;
      if (last && (!lastActive || last > lastActive)) lastActive = last;
      stmts.push(env.DB.prepare('INSERT OR REPLACE INTO profiles (tg_id, pid, name, avatar, char, stars, streak, last, room) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(u.id, str(p.id, 24), str(p.name, 20), str(p.avatar, 16), str(p.char, 12), int(p.stars, 0, 999, 0), int(p.streak, 0, 9999, 0), last, roomJson(p.room)));
    }
    const week = Array.isArray(body.week) ? JSON.stringify(body.week.slice(0, 8).map(k => ({
      n: str(k && k.n, 20), d: int(k && k.d, 0, 7, 0), a: int(k && k.a, 0, 99999, 0), w: int(k && k.w, 0, 9999, 0),
      s: int(k && k.s, 0, 9999, 0), t: int(k && k.t, 0, 9999, 0), h: Array.isArray(k && k.h) ? k.h.slice(0, 3).map(x => str(x, 30)) : [] }))) : null;
    stmts.push(env.DB.prepare('UPDATE users SET tz = ?, last_active = COALESCE(?, last_active), week = COALESCE(?, week) WHERE tg_id = ?')
      .bind(int(body.tz, -840, 720, -180), lastActive, week, u.id));
    await env.DB.batch(stmts);
    await env.DB.prepare('DELETE FROM profile_photos WHERE tg_id = ?1 AND pid NOT IN (SELECT pid FROM profiles WHERE tg_id = ?1)').bind(u.id).run();   // фото удалённых учеников
    // фото обновляем раз в сутки; если его пока нет (скрыто настройками Telegram) — проверяем чаще, вдруг открыли
    const seen = await env.DB.prepare('SELECT checked, img IS NOT NULL has FROM user_photos WHERE tg_id = ?').bind(u.id).first();
    if (!seen || Date.now() - Date.parse(seen.checked) > (seen.has ? 864e5 : 3e5)) await refreshPhoto(env, u.id);
  }
  else if (path === '/api/board'){
    const b = await board(env, u.id, body.scope);
    return b ? json(b) : json({ error: 'scope' }, 404);
  }
  else if (path === '/api/photo'){
    /* Фото ученика, выбранное в игре: маленький JPEG (игра сама уменьшает снимок). Пустое img — удалить. */
    const pid = str(body.pid, 24);
    if (!pid) return json({ error: 'pid' }, 400);
    if (!body.img) await env.DB.prepare('DELETE FROM profile_photos WHERE tg_id = ? AND pid = ?').bind(u.id, pid).run();
    else {
      if (typeof body.img !== 'string' || body.img.length > 80000 || !/^[A-Za-z0-9+/=]+$/.test(body.img)) return json({ error: 'img' }, 400);
      let bin; try { bin = Uint8Array.from(atob(body.img), c => c.charCodeAt(0)) } catch (e) { return json({ error: 'img' }, 400) }
      if (bin.length < 100 || bin[0] !== 0xFF || bin[1] !== 0xD8 || bin[2] !== 0xFF) return json({ error: 'img' }, 400);      // только JPEG
      const have = (await env.DB.prepare('SELECT COUNT(*) n FROM profile_photos WHERE tg_id = ? AND pid <> ?').bind(u.id, pid).first()).n;
      if (have >= 8) return json({ error: 'limit' }, 400);
      await env.DB.prepare(`INSERT INTO profile_photos (tg_id, pid, key, img) VALUES (?, ?, ?, ?)
          ON CONFLICT(tg_id, pid) DO UPDATE SET key = excluded.key, img = excluded.img`)
        .bind(u.id, pid, hex(crypto.getRandomValues(new Uint8Array(16))), bin.buffer).run();
    }
  }
  else if (path === '/api/settings'){
    await env.DB.prepare('UPDATE users SET remind_on = ?, remind_hour = ?, public = ?, weekly_on = ? WHERE tg_id = ?')
      .bind(body.remind_on ? 1 : 0, int(body.remind_hour, 0, 23, 18), body.public === false ? 0 : 1, body.weekly_on === false ? 0 : 1, u.id).run();
  }
  else if (path === '/api/group'){
    const code = String(body.code || ''), name = str(body.name, 24).trim();
    if (body.action === 'create'){
      if (!name) return json({ error: 'name' }, 400);
      const have = (await env.DB.prepare('SELECT COUNT(*) n FROM members WHERE tg_id = ?').bind(u.id).first()).n;
      if (have >= 10) return json({ error: 'limit' }, 400);
      const fresh = hex(crypto.getRandomValues(new Uint8Array(6)));
      await env.DB.batch([
        env.DB.prepare('INSERT INTO groups (code, name, owner, created) VALUES (?, ?, ?, ?)').bind(fresh, name, u.id, new Date().toISOString()),
        env.DB.prepare('INSERT INTO members (code, tg_id) VALUES (?, ?)').bind(fresh, u.id),
      ]);
      return json({ ...(await state(env, u.id)), created: fresh });
    }
    if (!GROUP_RE.test(code)) return json({ error: 'code' }, 400);
    if (body.action === 'leave'){
      await env.DB.prepare('DELETE FROM members WHERE code = ? AND tg_id = ?').bind(code, u.id).run();
      const left = (await env.DB.prepare('SELECT COUNT(*) n FROM members WHERE code = ?').bind(code).first()).n;
      if (!left) await env.DB.batch(['groups', 'funds', 'fund_parts', 'asks'].map(t => env.DB.prepare(`DELETE FROM ${t} WHERE code = ?`).bind(code)));   // пустая группа не нужна
    } else if (body.action === 'rename'){
      if (!name) return json({ error: 'name' }, 400);
      await env.DB.prepare('UPDATE groups SET name = ? WHERE code = ? AND owner = ?').bind(name, code, u.id).run();
    } else return json({ error: 'action' }, 400);
  }
  else return json({ error: 'not found' }, 404);

  return json(await state(env, u.id));
}

/* Сообщения боту */
async function webhook(req, env){
  if (req.headers.get('x-telegram-bot-api-secret-token') !== await hookSecret(env)) return new Response('forbidden', { status: 403 });
  const upd = await req.json().catch(() => null);
  const m = upd && upd.message;
  if (!m || !m.from || !m.chat || m.chat.type !== 'private') return new Response('ok');
  await ensureUser(env, m.from);
  const text = (m.text || '').trim();
  let reply;

  if (text.startsWith('/start')){
    const arg = text.split(/\s+/)[1] || '';
    reply = 'Привет! Это Tiny English — английский по 5 минут в день. Нажми «Играть» 👇';
    const inv = /^(?:grp|fam)_([0-9a-f]{12})$/.exec(arg);
    if (inv){
      const r = await joinGroup(env, inv[1], m.from.id);
      if (!r) reply = 'Это приглашение уже не действует. Попросите прислать новое. А поиграть можно и так 👇';
      else if (r.full) reply = `В группе «${r.name}» уже нет мест. А поиграть можно и так 👇`;
      else reply = `Вы в группе «${r.name}»! 🎉 Её рейтинг — на экране «Рейтинг» в игре. Нажмите «Играть» 👇`;
    }
    const du = /^duel_([0-9a-f]{12})$/.exec(arg);
    if (du){
      const r = await joinDuel(env, du[1], m.from.id);
      if (!r) reply = 'Этот вызов на дуэль уже не действует. Попросите прислать новый. А поиграть можно и так 👇';
      else if (r.full) reply = 'В этой дуэли уже слишком много участников. А поиграть можно и так 👇';
      else reply = 'Вас вызвали на дуэль! ⚔️ Нажмите «Играть», затем «Игры» → «Дуэль» — вызов ждёт внизу экрана 👇';
    }
  } else if (text.startsWith('/stop')){
    await env.DB.prepare('UPDATE users SET remind_on = 0, weekly_on = 0 WHERE tg_id = ?').bind(m.from.id).run();
    reply = 'Напоминания и отчёты за неделю выключены. Включить обратно можно в игре: «Для родителей».';
  } else {
    reply = 'Чтобы заниматься, нажми «Играть» 👇\nОтключить напоминания: /stop';
  }
  await tgApi(env, 'sendMessage', { chat_id: m.chat.id, text: reply, reply_markup: playButton(env) });
  return new Response('ok');
}

/* Напоминания: тем, у кого сейчас «их» час и кто сегодня ещё не занимался.
   За один запуск не больше 40 сообщений — ограничение бесплатного тарифа Cloudflare. */
async function remind(env, now){
  const users = (await env.DB.prepare('SELECT tg_id, tz, remind_hour, last_active, last_reminded FROM users WHERE remind_on = 1').all()).results;
  let sent = 0;
  for (const u of users){
    if (sent >= 40) break;
    const local = new Date(now - u.tz * 60000), day = local.toISOString().slice(0, 10);
    if (local.getUTCHours() !== u.remind_hour || u.last_active === day || u.last_reminded === day) continue;
    const p = await env.DB.prepare('SELECT char FROM profiles WHERE tg_id = ? ORDER BY stars DESC LIMIT 1').bind(u.tg_id).first();
    const [icon, miss] = PETS[p && p.char] || PETS.dog;
    const r = await tgApi(env, 'sendMessage', { chat_id: u.tg_id, text: `${icon} ${miss}! Заглянешь на 5 минут английского?`, reply_markup: playButton(env) });
    sent++;
    if (r.ok) await env.DB.prepare('UPDATE users SET last_reminded = ? WHERE tg_id = ?').bind(day, u.tg_id).run();
    else if (r.status === 403) await env.DB.prepare('UPDATE users SET remind_on = 0 WHERE tg_id = ?').bind(u.tg_id).run();  // бота заблокировали
  }
  return sent;
}

/* Турнир недели в группе: у всех одинаковые вопросы (их выбирает игра по коду группы и номеру недели),
   сервер хранит лучший результат каждого ученика за неделю. */
async function tourApi(env, u, body){
  const code = String(body.code || ''), week = int(body.week, 0, 1e6, 0);
  if (!GROUP_RE.test(code) || !week) return json({ error: 'bad' }, 400);
  const member = await env.DB.prepare('SELECT 1 FROM members WHERE code = ? AND tg_id = ?').bind(code, u.id).first();
  if (!member) return json({ error: 'member' }, 403);
  if (body.action === 'score'){
    const pid = str(body.pid, 24), score = int(body.score, 0, 10, 0), ms = int(body.ms, 0, 36e5, 36e5);
    if (!pid) return json({ error: 'pid' }, 400);
    await env.DB.prepare(`INSERT INTO tours (code, week, tg_id, pid, name, avatar, score, ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(code, week, tg_id, pid) DO UPDATE SET name = excluded.name, avatar = excluded.avatar,
          score = CASE WHEN excluded.score > tours.score OR (excluded.score = tours.score AND excluded.ms < tours.ms) THEN excluded.score ELSE tours.score END,
          ms    = CASE WHEN excluded.score > tours.score OR (excluded.score = tours.score AND excluded.ms < tours.ms) THEN excluded.ms ELSE tours.ms END`)
      .bind(code, week, u.id, pid, str(body.name, 20), str(body.avatar, 16), score, ms).run();
  }
  const rows = (await env.DB.prepare('SELECT tg_id, pid, name, avatar, score, ms FROM tours WHERE code = ? AND week = ? ORDER BY score DESC, ms ASC LIMIT 50').bind(code, week).all()).results;
  const last = await env.DB.prepare('SELECT name, score FROM tours WHERE code = ? AND week = ? ORDER BY score DESC, ms ASC LIMIT 1').bind(code, week - 1).first();
  return json({ rows: rows.map(r => ({ name: r.name, avatar: r.avatar, score: r.score, ms: r.ms, mine: r.tg_id === u.id })), last: last || null });
}

/* Сколько раз сегодня уже пользовались (и +1). Вернёт, сколько осталось; меньше нуля — лимит исчерпан */
async function quota(env, id, kind, max){
  const day = new Date().toISOString().slice(0, 10);
  const r = await env.DB.prepare(`INSERT INTO usage (tg_id, day, kind, n) VALUES (?, ?, ?, 1)
      ON CONFLICT(tg_id, day, kind) DO UPDATE SET n = n + 1 RETURNING n`).bind(id, day, kind).first();
  return max - r.n;
}
const norm = t => String(t || '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);

/* Что сказал ребёнок: запись (base64) → текст. expect — что должно было прозвучать; тогда ещё и сравниваем */
async function hearApi(env, u, body){
  if (!env.AI) return json({ error: 'off' });
  const b64 = typeof body.audio === 'string' ? body.audio : '';
  if (!b64 || b64.length > 560000 || !/^[A-Za-z0-9+/=]+$/.test(b64)) return json({ error: 'audio' }, 400);
  if (await quota(env, u.id, 'hear', HEAR_PER_DAY) < 0) return json({ error: 'limit' });
  let bytes; try { bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)) } catch (e) { return json({ error: 'audio' }, 400) }
  let text = '';
  try { text = String((await env.AI.run('@cf/openai/whisper', { audio: [...bytes] })).text || '').trim().slice(0, 200) }
  catch (e) { console.error(e); return json({ error: 'ai' }) }
  if (!body.expect) return json({ text });
  /* верно, если прозвучало большинство слов образца */
  const want = norm(body.expect).slice(0, 20), got = new Set(norm(text));
  const hit = want.filter(w => got.has(w)).length;
  return json({ text, ok: want.length > 0 && hit / want.length >= 0.6 });
}

/* Разговор с питомцем. Claude отвечает простым английским, с переводом и тремя подсказками для ответа */
const REPLY_SCHEMA = {
  type: 'object',
  properties: { en: { type: 'string' }, ru: { type: 'string' }, tips: { type: 'array', items: { type: 'string' } } },
  required: ['en', 'ru', 'tips'], additionalProperties: false,
};
async function chatApi(env, u, body){
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'off' });
  // история из игры: роли по очереди, начинается с ребёнка
  const messages = [];
  for (const m of (Array.isArray(body.history) ? body.history : []).slice(-12)){
    const role = m && m.role === 'assistant' ? 'assistant' : 'user', content = str(m && m.text, 200).trim();
    if (!content || (!messages.length && role === 'assistant')) continue;
    const prev = messages[messages.length - 1];
    if (prev && prev.role === role) prev.content += '\n' + content; else messages.push({ role, content });
  }
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'empty' }, 400);
  const left = await quota(env, u.id, 'chat', CHAT_PER_DAY);
  if (left < 0) return json({ error: 'limit', left: 0 });
  const pet = str(body.pet, 20) || 'Buddy', kid = str(body.kid, 20) || 'friend';
  const known = (Array.isArray(body.words) ? body.words : []).slice(0, 200).map(w => str(w, 24)).filter(w => /^[A-Za-z' -]+$/.test(w));
  const system = `You are ${pet}, a friendly pet in the English learning game Tiny English. You are chatting with ${kid}, a Russian-speaking child aged about 4 to 9 who is just starting to learn English.

How to answer:
- Very simple English: one or two short sentences, no more than 14 words in total.
- Prefer words the child already knows${known.length ? ': ' + known.join(', ') : ''}. Other words only if they are very common and easy.
- End with a short, easy question so the child can answer.
- If the child writes in Russian or makes a mistake, reply kindly in English and, if useful, show the right phrase once.
- Keep to child-friendly everyday topics: animals, food, colors, toys, family, games, weather, feelings. If the child brings up something unsafe or grown-up, gently change the subject to something fun.
- Never ask for personal details such as an address, school name, phone number or photos.

Fields: "en" is your reply; "ru" is a natural Russian translation of it; "tips" is three different short English answers the child could give next, 2 to 6 easy words each.`;
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const msg = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',                                   // если модель откажется отвечать, запрос повторит запасная
      output_config: { effort: 'low', format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      system,
      messages,
    });
    if (msg.stop_reason === 'refusal') return json({ en: "Let's talk about animals! What is your favorite animal?", ru: 'Давай поговорим о животных! Какое твоё любимое животное?', tips: ['I like cats.', 'I like dogs.', 'My favorite is a bear.'], left });
    const block = msg.content.find(b => b.type === 'text');
    const out = block ? JSON.parse(block.text) : null;
    if (!out || !out.en) return json({ error: 'ai' });
    return json({ en: str(out.en, 200), ru: str(out.ru, 300), tips: (Array.isArray(out.tips) ? out.tips : []).slice(0, 3).map(t => str(t, 60)), left });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.error('claude: rate limited');
    else if (e instanceof Anthropic.APIError) console.error('claude:', e.status, e.message);
    else console.error(e);
    return json({ error: 'ai' });
  }
}

/* Отчёт за неделю: по воскресеньям в 19:00 по местному времени, тем, кто его не выключил */
async function weekly(env, now){
  const users = (await env.DB.prepare('SELECT tg_id, tz, week, week_sent FROM users WHERE weekly_on = 1 AND week IS NOT NULL').all()).results;
  let sent = 0;
  for (const u of users){
    if (sent >= 30) break;
    const local = new Date(now - u.tz * 60000), day = local.toISOString().slice(0, 10);
    if (local.getUTCDay() !== 0 || local.getUTCHours() !== 19 || u.week_sent === day) continue;
    let list; try { list = JSON.parse(u.week) } catch (e) { continue }
    if (!Array.isArray(list) || !list.some(k => k.a > 0)) continue;           // за неделю не занимались — отчёт не шлём
    const text = '📬 Неделя в Tiny English\n\n' + list.map(k =>
      `${k.n}: занятия ${k.d} из 7 дней, ответов — ${k.a}.\nВыучено слов: ${k.w} · звёзд: ${k.t} · серия: 🔥 ${k.s}` +
      (k.h && k.h.length ? `\nПовторить: ${k.h.join(', ')}` : '')).join('\n\n') + '\n\nОтключить отчёты: /stop';
    const r = await tgApi(env, 'sendMessage', { chat_id: u.tg_id, text, reply_markup: playButton(env) });
    sent++;
    if (r.ok) await env.DB.prepare('UPDATE users SET week_sent = ? WHERE tg_id = ?').bind(day, u.tg_id).run();
    else if (r.status === 403) await env.DB.prepare('UPDATE users SET weekly_on = 0, remind_on = 0 WHERE tg_id = ?').bind(u.tg_id).run();
  }
}

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      if (!env.BOT_TOKEN) return json({ error: 'BOT_TOKEN is not set' }, 500);
      if (url.pathname === '/tg' && req.method === 'POST') return await webhook(req, env);
      if (url.pathname.startsWith('/api/') && req.method === 'POST') return await api(url.pathname, await req.json().catch(() => ({})), env);
      const ph = /^\/photo\/([0-9a-f]{32})$/.exec(url.pathname);
      if (ph && req.method === 'GET') return await servePhoto(env, ph[1]);
      if (url.pathname === '/setup'){
        const r = await tgApi(env, 'setWebhook', { url: url.origin + '/tg', secret_token: await hookSecret(env), allowed_updates: ['message'] });
        await tgApi(env, 'setMyCommands', { commands: [{ command: 'start', description: 'Открыть игру' }, { command: 'stop', description: 'Выключить напоминания и отчёты' }] });
        // заодно подтягиваем фото тем, у кого его ещё не проверяли (понемногу за раз)
        // ?recheck=1 — ещё раз проверить тех, у кого фото не нашлось
        const again = url.searchParams.get('recheck') === '1';
        const todo = (await env.DB.prepare(`SELECT u.tg_id FROM users u LEFT JOIN user_photos ph ON ph.tg_id = u.tg_id
            WHERE ph.tg_id IS NULL ${again ? 'OR ph.img IS NULL' : ''} LIMIT 5`).all()).results;
        const why = [];
        for (const t of todo) why.push((await refreshPhoto(env, t.tg_id)).why);
        return json({ webhook: r.ok, detail: r.data && r.data.description, photos: why });
      }
      if (url.pathname === '/') return json({ ok: true, service: 'tiny-english' });
      return json({ error: 'not found' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'server' }, 500);
    }
  },
  async scheduled(event, env, ctx){
    // дуэли старше 30 дней больше не нужны
    const old = new Date(event.scheduledTime - 30 * 864e5).toISOString();
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare('DELETE FROM duel_scores WHERE id IN (SELECT id FROM duels WHERE created < ?)').bind(old),
      env.DB.prepare('DELETE FROM duel_players WHERE id IN (SELECT id FROM duels WHERE created < ?)').bind(old),
      env.DB.prepare('DELETE FROM duels WHERE created < ?').bind(old),
    ]).catch(e => console.error(e)));
    // старые подарки, просьбы и отметки об угощениях
    const d3 = new Date(event.scheduledTime - 3 * 864e5).toISOString();
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare('DELETE FROM gifts WHERE created < ?').bind(old),
      env.DB.prepare('DELETE FROM asks WHERE created < ?').bind(d3),
      env.DB.prepare('DELETE FROM treats WHERE day < ?').bind(d3.slice(0, 10)),
    ]).catch(e => console.error(e)));
    ctx.waitUntil(remind(env, event.scheduledTime));
    ctx.waitUntil(weekly(env, event.scheduledTime).catch(e => console.error(e)));
    ctx.waitUntil(env.DB.prepare('DELETE FROM usage WHERE day < ?').bind(d3.slice(0, 10)).run().catch(e => console.error(e)));
    // турниры: храним только последние недели (номер недели считается с 1970 года)
    const oldWeek = Math.floor((Math.floor(event.scheduledTime / 864e5) - 4) / 7) - 8;
    ctx.waitUntil(env.DB.prepare('DELETE FROM tours WHERE week < ?').bind(oldWeek).run().catch(e => console.error(e)));
  },
};
