/* Мини-игры на скорость и дуэль. Играют только с тем, что ученик уже прошёл в уроках. */
let G = null;                                             // текущая игра; null — игра закончена или закрыта
const gAlive = g => G === g && screen === 'game';
const isL = x => !!x.u;
const gFace = x => isL(x) ? `<b class="gl">${x.u}</b>` : pic(x);
const gSay = x => isL(x) ? x.u : x.en;
function gamePool(p){ const m = revOf(p).m; return Object.keys(m).filter(k => ITEMS[k]).map(k => ITEMS[k].x) }
/* Для одной игры берём либо буквы, либо слова (слова — чаще), если их хотя бы четыре */
function gameSet(p){
  const pool = gamePool(p), L = pool.filter(isL), W = pool.filter(x => !isL(x));
  if (W.length >= 4 && (L.length < 4 || Math.random() < .7)) return W;
  return L.length >= 4 ? L : null;
}

function games(){
  const p = me(), ok = !!gameSet(p), hi = p.hi || {};
  const card = (id, icon, name, text, best) => `<button class="gcard ${ok ? '' : 'locked'}" data-g="${id}">
    <i>${icon}</i><span><b>${name}</b><small>${text}</small></span>${best ? `<em>${best}</em>` : ''}</button>`;
  render('games', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Игры</h2><span class="chip">🦴 ${bones(p)}</span></div>
    <p class="sub">${ok ? 'Здесь только буквы и слова, которые ты уже знаешь. За игру дают косточки 🦴' : 'Игры откроются после первого урока — нужно знать хотя бы 4 буквы'}</p>
    <div class="glist">
      ${card('b', '🎈', 'Шарики', 'Лопни шарик с тем, что услышишь', hi.b ? 'рекорд ' + hi.b : '')}
      ${card('y', '✅', 'Да или нет', 'Картинка и слово совпадают?', hi.y ? 'рекорд ' + hi.y : '')}
      ${card('m', '🧠', 'Пары на время', 'Найди все пары как можно быстрее', hi.m ? 'рекорд ' + hi.m + ' с' : '')}
      ${card('d', '⚔️', 'Дуэль', 'Одинаковые вопросы — кто ответит лучше?', '')}
    </div>`);
  $('#x').onclick = home;
  $$('.gcard').forEach(b => b.onclick = () => {
    if (!ok) return buzz();
    ({b: gameBalloons, y: gameYesNo, m: gameMemory, d: duel})[b.dataset.g]();
  });
}

function gameBar(icon){
  return `<div class="lbar"><button class="x" id="x">✕</button><div class="prog time"><i id="tm" style="width:100%"></i></div><span class="chip" id="sc">${icon} 0</span></div>`;
}
/* Отсчёт времени: по окончании вызывает end() */
function gameClock(g, secs, end){
  g.left = secs;
  const tv = setInterval(() => {
    if (!gAlive(g)) return clearInterval(tv);
    g.left -= .25;
    const bar = $('#tm'); if (bar) bar.style.width = Math.max(0, g.left / secs * 100) + '%';
    if (g.left <= 0){ clearInterval(tv); end() }
  }, 250);
}
function gameOver(id, score, replay){
  const p = me(), hi = p.hi || (p.hi = {}), time = id === 'm';
  const best = hi[id] == null || (time ? score < hi[id] : score > hi[id]);
  if (best && (time || score > 0)) hi[id] = score;
  const got = gameBones(p, time ? 4 : Math.min(8, Math.ceil(score / (id === 'b' ? 3 : 2))));
  p.gp = (p.gp || 0) + 1; dayMark(p, 'r'); touchStreak(p); saveStat(p); save();
  G = null; hush();
  render('gameover', `
    <div class="stage" style="margin-top:24px"><div class="center">
      ${petSVG(p.char, total(p), 'jump dance')}
      <h1>${time ? score + ' с' : score}</h1>
      <p class="sub" style="margin:0">${time ? 'Все пары найдены!' : plural(score, 'верный ответ', 'верных ответа', 'верных ответов')}
        ${best && hi[id] === score ? ' · 🏆 новый рекорд!' : ` · рекорд ${hi[id] != null ? hi[id] + (time ? ' с' : '') : '—'}`}</p>
      <div class="earned">${got ? `+${got} 🦴` : 'Косточки за игры на сегодня закончились — завтра будут снова'}</div>
      <div class="row"><button class="btn ghost" id="again">Ещё раз</button><button class="btn" id="back">К играм →</button></div>
    </div></div>`);
  fanfare();
  $('#again').onclick = replay;
  $('#back').onclick = games;
}

/* ---------- Шарики ---------- */
const BAL_NEED = 10;                                      // сколько раз подряд ловим одно слово
function gameBalloons(){
  const set = gameSet(me()); if (!set) return games();
  const g = G = {score: 0, target: null, opts: [], n: 0, lock: false};
  render('game', `
    ${gameBar('🎈')}
    <div class="stage gstage">
      <div class="row"><button class="btn round" id="snd">🔊</button><p class="task" style="margin:0">Лопай шарики с тем, что услышишь</p><span class="chip" id="left"></span></div>
      <div class="sky" id="sky"></div>
    </div>`);
  const sky = $('#sky');
  sky.style.setProperty('--h', (sky.offsetHeight + 260) + 'px');
  $('#x').onclick = () => { G = null; hush(); games() };
  $('#snd').onclick = () => say(gSay(g.target));
  /* Шарики летят без остановки. Одно и то же слово нужно поймать BAL_NEED раз — потом загадывается новое. */
  const round = first => {
    const old = g.target;
    g.target = pick(set.filter(x => x !== old));
    g.opts = shuffle(set.filter(x => x !== g.target)).slice(0, 3);
    g.got = 0; g.n = 0;
    [...sky.children].forEach(b => { if (b.x === old || b.x === g.target){ b.dead = true; b.classList.add('miss') } });   // чтобы старые шарики не путали
    $('#left').textContent = 'ещё ' + BAL_NEED;
    first ? say('ru:g_b', 300, gSay(g.target)) : say(gSay(g.target));
  };
  const spawn = () => {
    const x = (g.n++ % 2 === 1 || Math.random() < .15) ? g.target : pick(g.opts);
    const b = document.createElement('button');
    b.x = x;
    b.className = 'bal b' + Math.floor(Math.random() * 6);
    b.style.left = (3 + Math.random() * 74) + '%';
    b.style.animationDuration = (5.5 + Math.random() * 2) + 's';
    b.innerHTML = `<span>${gFace(x)}</span>`;
    b.onpointerdown = e => {
      e.preventDefault();
      if (!gAlive(g) || b.dead) return;
      b.dead = true;
      if (x === g.target){
        g.score++; g.got++; $('#sc').textContent = '🎈 ' + g.score; ding(); b.classList.add('pop');
        if (g.got >= BAL_NEED) round(); else { $('#left').textContent = 'ещё ' + (BAL_NEED - g.got); say(gSay(g.target)) }
      } else { buzz(); b.classList.add('miss') }
    };
    b.onanimationend = () => b.remove();
    sky.appendChild(b);
  };
  round(true);
  const iv = setInterval(() => { if (!gAlive(g)) return clearInterval(iv); spawn() }, 750);
  gameClock(g, 63, () => { clearInterval(iv); gameOver('b', g.score, gameBalloons) });
}

/* ---------- Да или нет ---------- */
function gameYesNo(){
  const set = gameSet(me()); if (!set) return games();
  const g = G = {score: 0, x: null, lock: false};
  render('game', `
    ${gameBar('✅')}
    <div class="stage gstage">
      <p class="task">Совпадает?</p>
      <div class="yn-card" id="card"></div>
      <div class="row" style="margin-top:18px"><button class="btn yn no" id="no">❌ Нет</button><button class="btn yn yes" id="yes">✅ Да</button></div>
    </div>`);
  $('#x').onclick = () => { G = null; hush(); games() };
  const next = first => {
    g.x = pick(set.filter(x => x !== g.x)); g.same = Math.random() < .5;
    g.shown = g.same ? g.x : pick(set.filter(x => x !== g.x)); g.lock = false;
    const c = $('#card'); c.className = 'yn-card';
    c.innerHTML = isL(g.x) ? `<span class="bigem"><b class="up">${g.x.u}</b></span><span class="yn-w lo">${g.shown.l}</span>`
                           : `<span class="bigem">${pic(g.x)}</span><span class="yn-w">${esc(g.shown.en)}</span>`;
    first ? say('ru:g_y', 300, gSay(g.shown)) : say(gSay(g.shown));
  };
  const ans = yes => {
    if (g.lock || !gAlive(g)) return;
    g.lock = true;
    const ok = yes === g.same, c = $('#card');
    c.classList.add(ok ? 'ok' : 'no');
    if (ok){ g.score++; $('#sc').textContent = '✅ ' + g.score; ding() }
    else { buzz(); c.insertAdjacentHTML('beforeend', `<small>это ${isL(g.x) ? g.x.u + g.x.l : esc(g.x.en)}</small>`) }
    setTimeout(() => { if (gAlive(g)) next() }, ok ? 350 : 1100);
  };
  $('#yes').onclick = () => ans(true);
  $('#no').onclick = () => ans(false);
  next(true);
  gameClock(g, 43, () => gameOver('y', g.score, gameYesNo));
}

/* ---------- Пары на время ---------- */
function gameMemory(){
  const pool = gamePool(me()), W = pool.filter(x => !isL(x)), L = pool.filter(isL);
  const src = W.length >= 4 ? W : L; if (src.length < 4) return games();
  const items = shuffle(src).slice(0, 6);
  const cards = shuffle(items.flatMap(x => isL(x) ? [{k: x.u, s: x.u}, {k: x.u, s: x.l}]
                                                 : [{k: x.en, s: pic(x)}, {k: x.en, s: esc(x.en), txt: true}]));
  const g = G = {t0: 0, done: 0};
  let open = [], lock = false;
  render('game', `
    <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1">Пары на время</h2><span class="chip" id="sc">⏱ 0</span></div>
    <div class="stage">
      <div class="pairs">${cards.map((c, i) => `<button class="pc" data-i="${i}"><span class="back">🐾</span><span class="front ${c.txt ? 'txt' : ''}">${c.s}</span></button>`).join('')}</div>
    </div>`);
  $('#x').onclick = () => { G = null; hush(); games() };
  say('ru:g_m');
  const secs = () => Math.max(1, Math.round((Date.now() - g.t0) / 1000));
  const tv = setInterval(() => { if (!gAlive(g)) return clearInterval(tv); if (g.t0) $('#sc').textContent = '⏱ ' + secs() }, 500);
  $$('.pc').forEach(b => b.onclick = () => {
    if (lock || b.classList.contains('open') || !gAlive(g)) return;
    if (!g.t0) g.t0 = Date.now();
    b.classList.add('open'); say(cards[+b.dataset.i].k); open.push(b);
    if (open.length < 2) return;
    const [a, c] = open; open = [];
    if (cards[+a.dataset.i].k === cards[+c.dataset.i].k){
      a.classList.add('ok'); c.classList.add('ok'); ding();
      if (++g.done === items.length){ const t = secs(); clearInterval(tv); setTimeout(() => { if (gAlive(g)) gameOver('m', t, gameMemory) }, 900) }
    } else {
      lock = true;
      setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false }, 800);
    }
  });
}

/* ================= Дуэль ================= */
const DUEL_W = ['wlisten', 'wread', 'whear'], DUEL_L = ['listen', 'missing'];
function duelQs(p){
  const pool = gamePool(p), W = pool.filter(x => !isL(x)), L = pool.filter(isL);
  const src = W.length >= 6 ? W : [...W, ...L];
  return shuffle(src).slice(0, 10).map((x, i) => ({k: revKey(x), t: isL(x) ? DUEL_L[i % 2] : DUEL_W[i % 3]}));
}
/* Прогоняет вопросы через обычный урок; done({score, ms}) — когда ответил на все */
function playDuel(qs, done){
  const steps = shuffle((qs || []).filter(q => q && ITEMS[q.k])).map(q => {
    const it = ITEMS[q.k], list = it.t ? DUEL_W : DUEL_L;
    return {t: list.includes(q.t) ? q.t : list[0], x: it.x, pool: it.t ? it.t.lessons.flat() : LETTERS};
  });
  if (!steps.length) return done(null);
  S = {L: {id: 'duel', kind: 'duel'}, mode: 'duel', steps, pos: 0, mistakes: 0, pool: [], missed: new Set(), right: 0, t0: Date.now(), done,
    onAnswer(st, ok){ if (ok) S.right++ }};
  step();
}
const duelTime = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' с';
function duelTable(rows, n){
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.ms - b.ms);
  return `<div class="board">${sorted.map((r, i) => `<div class="brow ${r.mine ? 'mine' : ''}">
    <span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="bav">${esc(r.avatar || '🙂')}</span>
    <span class="bn">${esc(r.name || 'Игрок')}</span><span class="bs">✅ ${r.score}${n ? ' / ' + n : ''}</span><span class="bs">⏱ ${duelTime(r.ms)}</span></div>`).join('')}</div>`;
}

function duel(note){
  playAs = null;
  const p = me(), others = db.profiles.filter(x => x.id !== p.id), can = gamePool(p).length >= 4;
  let sel = new Set(others.map(o => o.id));
  render('duel', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Дуэль</h2><span style="width:46px"></span></div>
    <p class="sub">Всем — одинаковые 10 вопросов из того, что знает ${esc(p.name)}. Побеждает тот, у кого больше верных ответов, а если поровну — кто быстрее.</p>
    ${note ? `<div class="note">${note}</div>` : ''}
    ${!can ? '<div class="note">Дуэль откроется после первого урока.</div>' : `
      ${others.length ? `<div class="stage">
          <p class="task">⚔️ На этом устройстве</p>
          <p class="sub">Отметь, кто играет, и отвечайте по очереди</p>
          <div class="row">${others.map(o => `<button class="chip pickp on" data-id="${o.id}">${o.avatar} ${esc(o.name)}</button>`).join('')}</div>
          <button class="btn" id="local" style="margin-top:16px">Начать</button>
        </div>` : '<div class="note">Чтобы играть вдвоём на одном устройстве, добавьте второго ученика (нажмите на имя вверху главного экрана).</div>'}
      ${online() ? `<div class="stage" style="margin-top:14px">
          <p class="task">📨 Через Telegram</p>
          <p class="sub">Сначала отвечаешь ты, потом отправляешь вызов маме, папе или другу — они ответят на те же вопросы у себя</p>
          <button class="btn" id="net">Создать вызов</button>
        </div>
        <div id="dl"></div>` : '<div class="note">Вызов через Telegram работает, когда игра открыта в Telegram.</div>'}`}`);
  $('#x').onclick = games;
  $$('.pickp').forEach(b => b.onclick = () => { const id = b.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); b.classList.toggle('on', sel.has(id)) });
  if ($('#local')) $('#local').onclick = () => { if (!sel.size) return buzz(); duelLocal(p, others.filter(o => sel.has(o.id))) };
  if ($('#net')) $('#net').onclick = duelCreate;
  if ($('#dl')) duelList();
}

/* ---------- на одном устройстве ---------- */
function duelLocal(host, rivals){
  const qs = duelQs(host), players = [host, ...rivals], res = [];
  const turn = i => {
    playAs = null;
    if (i >= players.length){
      const best = [...res].sort((a, b) => b.score - a.score || a.ms - b.ms)[0];
      players.forEach(pl => { earn(pl, pl.id === best.id ? 5 : 2); touchStreak(pl); saveStat(pl) });
      dayMark(host, 'r'); host.gp = (host.gp || 0) + 1; save();
      render('duelres', `
        <div class="stage" style="margin-top:24px"><div class="center">
          <div class="bigem medal">🏆</div>
          <h1>${esc(best.avatar)} ${esc(best.name)}</h1>
          <p class="sub" style="margin:0">Победа! Победителю +5 🦴, остальным +2 🦴</p>
        </div></div>
        <div style="margin-top:14px">${duelTable(res, qs.length)}</div>
        <div class="row" style="margin-top:18px"><button class="btn ghost" id="again">Реванш</button><button class="btn" id="back">Готово →</button></div>`);
      fanfare();
      $('#again').onclick = () => duelLocal(host, rivals);
      $('#back').onclick = home;
      return;
    }
    const pl = players[i];
    render('duelturn', `
      <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1">Дуэль</h2><span style="width:46px"></span></div>
      <div class="stage"><div class="center">
        <div class="bigem">${pl.avatar}</div>
        <h2 style="margin:0">Отвечает ${esc(pl.name)}</h2>
        <p class="sub" style="margin:0">${qs.length} ${plural(qs.length, 'вопрос', 'вопроса', 'вопросов')}. Остальные не подглядывают 🙈</p>
        <button class="btn" id="go">Я готов!</button>
      </div></div>`);
    $('#x').onclick = home;
    if (i === 0) say('ru:duel');
    $('#go').onclick = () => {
      playAs = pl.id;
      playDuel(qs, r => { playAs = null; res.push({id: pl.id, name: pl.name, avatar: pl.avatar, score: r ? r.score : 0, ms: r ? r.ms : 0}); turn(i + 1) });
    };
  };
  turn(0);
}

/* ---------- через Telegram ---------- */
const wait = text => render('wait', `<div class="center" style="margin-top:70px"><div class="bigem">⚔️</div><p class="sub">${text}</p></div>`);
async function duelCreate(){
  const qs = duelQs(me());
  wait('Готовлю вопросы…');
  const r = await post('/api/duel', {action: 'create', q: qs});
  if (!r || !r.duel) return duel('Не получилось создать вызов. Проверь интернет и попробуй ещё раз.');
  duelPlay(r.duel);
}
function duelPlay(d){
  const p = me();
  render('duelturn', `
    <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1">Дуэль</h2><span style="width:46px"></span></div>
    <div class="stage"><div class="center">
      <div class="bigem">⚔️</div>
      <h2 style="margin:0">${esc(p.name)}, твой ход!</h2>
      <p class="sub" style="margin:0">${d.q.length} ${plural(d.q.length, 'вопрос', 'вопроса', 'вопросов')}. Ответить можно только один раз — время идёт.</p>
      <button class="btn" id="go">Начать!</button>
    </div></div>`);
  $('#x').onclick = () => duel();
  say('ru:duel');
  $('#go').onclick = () => playDuel(d.q, async res => {
    if (!res) return duel('В этом вызове слова, которых нет в этой версии игры.');
    wait('Записываю результат…');
    const r = await post('/api/duel', {action: 'score', id: d.id, pid: p.id, name: p.name, avatar: p.avatar, score: res.score, ms: res.ms});
    earn(p, 3); p.gp = (p.gp || 0) + 1; dayMark(p, 'r'); touchStreak(p); saveStat(p); save();
    duelView(r && r.duel ? r.duel : {...d, scores: [{mine: true, pid: p.id, name: p.name, avatar: p.avatar, score: res.score, ms: res.ms}]},
      r ? '' : 'Результат не отправился — нет связи с сервером.', res);
  });
}
function duelView(d, note, res){
  const mine = res || d.scores.find(s => s.mine && s.pid === me().id);
  render('duelres', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Результаты дуэли</h2><span style="width:46px"></span></div>
    ${note ? `<div class="note">${note}</div>` : ''}
    ${res ? '<p class="sub">+3 🦴 за дуэль</p>' : ''}
    ${duelTable(d.scores, d.q.length)}
    <p class="sub" style="margin:14px 0 0">${d.scores.length < 2 ? 'Пока ответил только один игрок. Отправь вызов — и сравните результаты!' : 'Можно позвать ещё кого-нибудь'}</p>
    <div class="row" style="margin-top:14px"><button class="btn" id="inv">Отправить вызов</button><button class="btn ghost" id="back">Готово</button></div>`);
  if (res) fanfare();
  $('#x').onclick = $('#back').onclick = () => duel();
  $('#inv').onclick = () => {
    const text = mine ? `Вызываю тебя на дуэль в Tiny English! У меня ${mine.score} из ${d.q.length} — сможешь лучше?` : 'Вызываю тебя на дуэль в Tiny English!';
    try { tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(d.invite) + '&text=' + encodeURIComponent(text)) } catch(e){}
  };
}
async function duelList(){
  const r = await post('/api/duel', {action: 'list'});
  const box = screen === 'duel' && $('#dl');
  if (!box || !r || !r.duels || !r.duels.length) return;
  const pid = me().id;
  box.innerHTML = `<h3 class="sec">📜 Вызовы</h3><div class="board" style="margin-top:12px">${r.duels.map((d, i) => {
    const played = d.scores.some(s => s.mine && s.pid === pid);
    return `<button class="brow dl" data-i="${i}"><span class="bav">⚔️</span>
      <span class="bn">от ${esc(d.owner || 'игрока')} <small>· ответили: ${d.scores.length}</small></span>
      <span class="bs">${played ? 'результаты' : '▶ играть'}</span></button>`}).join('')}</div>`;
  $$('.brow.dl').forEach(b => b.onclick = () => {
    const d = r.duels[+b.dataset.i];
    d.scores.some(s => s.mine && s.pid === pid) ? duelView(d) : duelPlay(d);
  });
}
