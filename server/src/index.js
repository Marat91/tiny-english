/* Сервер Tiny English (Cloudflare Worker).
   - /tg          — сообщения от Telegram боту (/start, /stop, приглашение в семью)
   - /api/*       — запросы из игры: синхронизация прогресса, семья, настройки напоминаний
   - /setup       — привязывает бота к этому серверу (безопасно вызывать повторно)
   - расписание   — раз в час рассылает напоминания тем, кто сегодня не занимался */

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
  await env.DB.prepare('INSERT INTO users (tg_id, name) VALUES (?, ?) ON CONFLICT(tg_id) DO UPDATE SET name = excluded.name')
    .bind(u.id, str(u.first_name, 40)).run();
}

const GROUP_RE = /^[0-9a-f]{12}$/;
const invite = (env, code) => `https://t.me/${env.BOT_USERNAME}?start=grp_${code}`;

/* Настройки и список групп пользователя */
async function state(env, id){
  const me = await env.DB.prepare('SELECT remind_on, remind_hour, public FROM users WHERE tg_id = ?').bind(id).first();
  const groups = (await env.DB.prepare(`SELECT g.code, g.name, g.owner, (SELECT COUNT(*) FROM members x WHERE x.code = g.code) n
      FROM groups g JOIN members m ON m.code = g.code WHERE m.tg_id = ? ORDER BY g.created`).bind(id).all()).results;
  return {
    remind_on: !!me.remind_on, remind_hour: me.remind_hour, public: !!me.public,
    groups: groups.map(g => ({ code: g.code, name: g.name, members: g.n, mine: g.owner === id, invite: invite(env, g.code) })),
  };
}

/* Рейтинг: scope = 'all' (все, кто не скрылся) или код группы */
async function board(env, id, scope){
  const row = (r, rank) => ({ rank, name: r.name, avatar: r.avatar, char: r.char, stars: r.stars, streak: r.streak, mine: r.tg_id === id });
  if (scope === 'all'){
    const top = (await env.DB.prepare(`SELECT p.tg_id, p.pid, p.name, p.avatar, p.char, p.stars, p.streak FROM profiles p
        JOIN users u ON u.tg_id = p.tg_id WHERE u.public = 1 OR p.tg_id = ?1
        ORDER BY p.stars DESC, p.streak DESC, p.name LIMIT 50`).bind(id).all()).results;
    const rows = top.map((r, i) => row(r, i + 1));
    const total = (await env.DB.prepare('SELECT COUNT(*) n FROM profiles p JOIN users u ON u.tg_id = p.tg_id WHERE u.public = 1 OR p.tg_id = ?1').bind(id).first()).n;
    // свои профили, не попавшие в первые 50, показываем отдельной строкой с их местом
    const mine = (await env.DB.prepare('SELECT tg_id, pid, name, avatar, char, stars, streak FROM profiles WHERE tg_id = ? ORDER BY stars DESC').bind(id).all()).results;
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
  const list = (await env.DB.prepare(`SELECT p.tg_id, p.name, p.avatar, p.char, p.stars, p.streak FROM profiles p
      JOIN members m ON m.tg_id = p.tg_id WHERE m.code = ? ORDER BY p.stars DESC, p.streak DESC, p.name LIMIT 100`).bind(scope).all()).results;
  return { scope, total: list.length, rows: list.map((r, i) => row(r, i + 1)) };
}

async function joinGroup(env, code, id){
  const g = await env.DB.prepare('SELECT code, name FROM groups WHERE code = ?').bind(code).first();
  if (!g) return null;
  const n = (await env.DB.prepare('SELECT COUNT(*) n FROM members WHERE code = ?').bind(code).first()).n;
  if (n >= 100) return { full: true, name: g.name };
  await env.DB.prepare('INSERT OR IGNORE INTO members (code, tg_id) VALUES (?, ?)').bind(code, id).run();
  return { name: g.name };
}

async function api(path, body, env){
  const u = await verify(body.initData, env);
  if (!u) return json({ error: 'auth' }, 401);
  await ensureUser(env, u);

  if (path === '/api/sync'){
    const list = Array.isArray(body.profiles) ? body.profiles.slice(0, 8) : [];
    const stmts = [env.DB.prepare('DELETE FROM profiles WHERE tg_id = ?').bind(u.id)];
    let lastActive = null;
    for (const p of list){
      const last = isDay(p.last) ? p.last : null;
      if (last && (!lastActive || last > lastActive)) lastActive = last;
      stmts.push(env.DB.prepare('INSERT OR REPLACE INTO profiles (tg_id, pid, name, avatar, char, stars, streak, last) VALUES (?,?,?,?,?,?,?,?)')
        .bind(u.id, str(p.id, 24), str(p.name, 20), str(p.avatar, 16), str(p.char, 12), int(p.stars, 0, 999, 0), int(p.streak, 0, 9999, 0), last));
    }
    stmts.push(env.DB.prepare('UPDATE users SET tz = ?, last_active = COALESCE(?, last_active) WHERE tg_id = ?')
      .bind(int(body.tz, -840, 720, -180), lastActive, u.id));
    await env.DB.batch(stmts);
  }
  else if (path === '/api/board'){
    const b = await board(env, u.id, body.scope);
    return b ? json(b) : json({ error: 'scope' }, 404);
  }
  else if (path === '/api/settings'){
    await env.DB.prepare('UPDATE users SET remind_on = ?, remind_hour = ?, public = ? WHERE tg_id = ?')
      .bind(body.remind_on ? 1 : 0, int(body.remind_hour, 0, 23, 18), body.public === false ? 0 : 1, u.id).run();
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
      if (!left) await env.DB.prepare('DELETE FROM groups WHERE code = ?').bind(code).run();   // пустая группа не нужна
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
  } else if (text.startsWith('/stop')){
    await env.DB.prepare('UPDATE users SET remind_on = 0 WHERE tg_id = ?').bind(m.from.id).run();
    reply = 'Напоминания выключены. Включить обратно можно в игре на экране «Рейтинг».';
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

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      if (!env.BOT_TOKEN) return json({ error: 'BOT_TOKEN is not set' }, 500);
      if (url.pathname === '/tg' && req.method === 'POST') return await webhook(req, env);
      if (url.pathname.startsWith('/api/') && req.method === 'POST') return await api(url.pathname, await req.json().catch(() => ({})), env);
      if (url.pathname === '/setup'){
        const r = await tgApi(env, 'setWebhook', { url: url.origin + '/tg', secret_token: await hookSecret(env), allowed_updates: ['message'] });
        await tgApi(env, 'setMyCommands', { commands: [{ command: 'start', description: 'Открыть игру' }, { command: 'stop', description: 'Выключить напоминания' }] });
        return json({ webhook: r.ok, detail: r.data && r.data.description });
      }
      if (url.pathname === '/') return json({ ok: true, service: 'tiny-english' });
      return json({ error: 'not found' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'server' }, 500);
    }
  },
  async scheduled(event, env, ctx){
    ctx.waitUntil(remind(env, event.scheduledTime));
  },
};
