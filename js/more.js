/* Ещё занятия: диктант, работа над ошибками, игры «Спаси снеговика», «Найди слово» и «Научи питомца»,
   слушаем перед сном, карточки для печати, костюмы за выученные слова и турнир недели в группе. */

const learnedN = p => Object.keys(revOf(p).m).filter(k => k[0] === 'W' && ITEMS[k]).length;
const outfitIcons = p => { const n = learnedN(p); return OUTFITS.filter(o => n >= o.at).map(o => o.icon).join('') };
const plainWord = x => /^[a-z]{3,8}$/i.test(x.en);                  // слово из одних букв — для диктанта и игр с буквами
const knownWordsOf = p => gamePool(p).filter(x => !isL(x));

/* ================= Диктант: слово на слух, без картинки и образца ================= */
STEPS.dict = st => {
  const x = st.x, letters = [...x.en.toLowerCase()];
  const extra = shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(c => !letters.includes(c))).slice(0, 3);
  let tiles = shuffle([...letters, ...extra]), pos = 0, missed = false;
  frame(`
    <p class="task">Диктант ✍️</p>
    <div class="center"><button class="btn big-round" id="snd" style="width:96px;height:96px;font-size:40px">🔊</button></div>
    <div class="bigem sm" id="em" style="visibility:hidden">${pic(x)}</div>
    <div class="slots">${letters.map((_, i) => `<span class="sl" data-i="${i}"></span>`).join('')}</div>
    <div class="tiles">${tiles.map(c => `<button class="tile" data-s="${c}">${c}</button>`).join('')}</div>`);
  $('#snd').onclick = () => say(x.en);
  $$('.tile').forEach(b => b.onclick = () => {
    if (b.classList.contains('used') || pos >= letters.length) return;
    if (b.dataset.s !== letters[pos]){
      b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); buzz();
      if (!missed){ missed = true; S.mistakes++; S.missed.add(revKey(x)); petReact('no') }
      return;
    }
    const slot = $(`.sl[data-i="${pos}"]`); slot.textContent = letters[pos]; slot.classList.add('on'); b.classList.add('used'); pos++;
    if (pos < letters.length) return tone(480 + pos * 45, .12);
    ding(); petReact('ok'); $('.slots').classList.add('ok'); $('#em').style.visibility = 'visible';
    track(me(), revKey(x), !missed); if (S.onAnswer) S.onAnswer(S.cur, !missed);
    later(() => say(x.en), 300); later(advance, 1800);
  });
  task('dict', x.en);
};

/* ================= Работа над ошибками ================= */
function hardWords(p){
  return Object.entries(statOf(p).x).filter(([k]) => ITEMS[k] && ITEMS[k].t).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => ITEMS[k]);
}
const fixReady = p => hardWords(p).length >= 3 && !today(p).fx;
function startFix(){
  const p = me(), list = hardWords(p); if (list.length < 3) return home();
  today(p).fx = 1; save();
  const kinds = ['whear', 'dict', 'wread', 'wlisten'];
  const steps = shuffle(list).map(({x, t}, i) => { let k = kinds[i % kinds.length]; if (k === 'dict' && !plainWord(x)) k = 'whear'; return {t: k, x, pool: t.lessons.flat()} });
  S = {L: {id: 'fix', kind: 'fix', again: startFix}, mode: 'lesson', steps: [...steps, ...shuffle(steps)], pos: 0, mistakes: 0, pool: [], missed: new Set()};
  say('ru:fix'); step();
}

/* ================= Блок «Ещё занятия» на главном экране ================= */
function moreHTML(p){
  const card = (id, icon, name, small) => `<button class="lcard c${id.length % 6}" id="${id}"><div class="ls">${icon}</div><div class="meta"><span class="num">${name}</span><span class="st">${small || ''}</span></div></button>`;
  const groups = online() && srv && srv.groups && srv.groups.length;
  return `<h3 class="sec">🧺 Ещё занятия</h3><div class="grid">
    ${fixReady(p) ? card('mfix', '🔁', 'Работа над ошибками', hardWords(p).length + ' сл.') : ''}
    ${knownWordsOf(p).length >= 4 ? card('msleep', '🎧', 'Слушаем перед сном') : ''}
    ${knownWordsOf(p).length >= 4 ? card('mprint', '🖨️', 'Карточки') : ''}
    ${groups ? card('mtour', '🏆', 'Турнир недели') : ''}
    ${groups ? card('mhw', '📚', 'Домашка') : ''}
  </div>`;
}
function wireMore(){
  if ($('#mfix')) $('#mfix').onclick = startFix;
  if ($('#msleep')) $('#msleep').onclick = sleepMode;
  if ($('#mprint')) $('#mprint').onclick = () => printScreen();
  if ($('#mtour')) $('#mtour').onclick = () => tourScreen();
  if ($('#mhw')) $('#mhw').onclick = () => hwScreen();
}

/* ================= Игра «Спаси снеговика» ================= */
function gameSnow(){
  const pool = knownWordsOf(me()).filter(plainWord); if (pool.length < 3) return games();
  const g = G = {score: 0, round: 0, used: []};
  const word = () => {
    if (G !== g) return;                                    // игру закрыли
    if (g.round >= 5) return gameOver('h', g.score, gameSnow);
    g.round++; g.x = pick(pool.filter(x => !g.used.includes(x)).length ? pool.filter(x => !g.used.includes(x)) : pool); g.used.push(g.x);
    g.w = g.x.en.toLowerCase(); g.open = new Set(); g.miss = 0; g.over = false;
    const keys = shuffle([...new Set([...g.w, ...shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(c => !g.w.includes(c))).slice(0, Math.max(4, 12 - new Set(g.w).size))])]);
    render('game', `
      <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1">Спаси снеговика · ${g.round}/5</h2><span class="chip" id="sc">⛄ ${g.score}</span></div>
      <div class="stage gstage">
        <div class="snowman" id="sm"><span>⛄</span><i id="pud"></i></div>
        <div class="bigem sm">${pic(g.x)}</div>
        <div class="slots" id="sl">${[...g.w].map(() => '<span class="sl"></span>').join('')}</div>
        <div class="tiles">${keys.map(c => `<button class="tile" data-s="${c}">${c}</button>`).join('')}</div>
      </div>`);
    $('#x').onclick = () => { G = null; hush(); games() };
    g.round === 1 ? say('ru:g_h') : null;
    $$('.tile').forEach(b => b.onclick = () => guess(b));
  };
  const draw = () => {
    $$('#sl .sl').forEach((s, i) => { if (g.open.has(g.w[i])){ s.textContent = g.w[i]; s.classList.add('on') } });
    const sm = $('#sm span'); sm.style.transform = `scale(${1 - g.miss * .12})`; sm.style.opacity = 1 - g.miss * .1;
    $('#pud').textContent = '💧'.repeat(g.miss);
  };
  const guess = b => {
    if (g.over || b.disabled || !gAlive(g)) return;
    const c = b.dataset.s; b.disabled = true;
    if (g.w.includes(c)){ b.classList.add('ok'); g.open.add(c); tone(560, .1) } else { b.classList.add('no'); g.miss++; buzz() }
    draw();
    const won = [...g.w].every(ch => g.open.has(ch)), lost = g.miss >= 6;
    if (!won && !lost) return;
    g.over = true;
    if (won){ g.score++; $('#sc').textContent = '⛄ ' + g.score; ding(); $('#sl').classList.add('ok') }
    else { [...g.w].forEach(ch => g.open.add(ch)); draw(); $('#sm').classList.add('melt') }
    track(me(), revKey(g.x), won); say(g.x.en);
    setTimeout(word, 1800);
  };
  word();
}

/* ================= Игра «Найди слово» ================= */
function gameSearch(){
  const pool = shuffle(knownWordsOf(me()).filter(x => /^[a-z]{3,7}$/i.test(x.en))); if (pool.length < 3) return games();
  const N = 8, grid = Array.from({length: N}, () => Array(N).fill('')), placed = [];
  for (const x of pool){
    if (placed.length >= 5) break;
    const w = x.en.toLowerCase();
    for (let t = 0; t < 60; t++){
      const hor = Math.random() < .5, r = Math.floor(Math.random() * (hor ? N : N - w.length + 1)), c = Math.floor(Math.random() * (hor ? N - w.length + 1 : N));
      const cells = [...w].map((_, i) => hor ? [r, c + i] : [r + i, c]);
      if (cells.every(([a, b], i) => !grid[a][b] || grid[a][b] === w[i])){ cells.forEach(([a, b], i) => grid[a][b] = w[i]); placed.push({x, w, cells}); break }
    }
  }
  grid.forEach(row => row.forEach((v, i) => { if (!v) row[i] = 'abcdefghijklmnoprstuvwy'[Math.floor(Math.random() * 23)] }));
  const g = G = {score: 0, first: null};
  render('game', `
    ${gameBar('🔎')}
    <div class="stage gstage">
      <p class="task" style="margin-bottom:8px">Найди слова: нажми первую и последнюю букву</p>
      <div class="wgrid">${grid.map((row, r) => row.map((ch, c) => `<button class="wc" data-r="${r}" data-c="${c}">${ch}</button>`).join('')).join('')}</div>
      <div class="wlist">${placed.map((p, i) => `<span data-i="${i}">${pic(p.x)} ${esc(p.w)}</span>`).join('')}</div>
    </div>`);
  $('#x').onclick = () => { G = null; hush(); games() };
  say('ru:g_s');
  const cell = (r, c) => $(`.wc[data-r="${r}"][data-c="${c}"]`);
  $$('.wc').forEach(b => b.onclick = () => {
    if (!gAlive(g)) return;
    const r = +b.dataset.r, c = +b.dataset.c;
    if (!g.first){ g.first = [r, c]; b.classList.add('sel'); return }
    const [r0, c0] = g.first; g.first = null; $$('.wc.sel').forEach(x => x.classList.remove('sel'));
    const hit = placed.find(p => !p.found && [[p.cells[0], p.cells[p.cells.length - 1]], [p.cells[p.cells.length - 1], p.cells[0]]]
      .some(([a, z]) => a[0] === r0 && a[1] === c0 && z[0] === r && z[1] === c));
    if (!hit){ buzz(); return }
    hit.found = true; g.score++; $('#sc').textContent = '🔎 ' + g.score; ding(); say(hit.x.en);
    hit.cells.forEach(([a, z]) => cell(a, z).classList.add('found'));
    $(`.wlist [data-i="${placed.indexOf(hit)}"]`).classList.add('found');
    if (placed.every(p => p.found)) setTimeout(() => { if (gAlive(g)) gameOver('s', g.score + Math.round(g.left / 10), gameSearch) }, 1200);
  });
  gameClock(g, 120, () => gameOver('s', g.score, gameSearch));
}

/* ================= Игра «Научи питомца» ================= */
function gameTeach(){
  const pool = knownWordsOf(me()); if (pool.length < 4) return games();
  const g = G = {score: 0, round: 0};
  const next = () => {
    if (G !== g) return;                                    // игру закрыли
    if (g.round >= 8) return gameOver('t', g.score, gameTeach);
    g.round++; g.x = pick(pool); g.wrong = Math.random() < .5; g.said = g.wrong ? pick(pool.filter(o => o !== g.x)) : g.x; g.lock = false;
    render('game', `
      <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1">Научи ${esc(myPet().name)} · ${g.round}/8</h2><span class="chip" id="sc">🎓 ${g.score}</span></div>
      <div class="stage gstage">
        <div class="bigem">${pic(g.x)}</div>
        <div class="talk"><span class="who">${myPetHTML(me(), 'small')}</span><button class="bubble q" id="dq">It is a ${esc(g.said.en)}!</button></div>
        <div class="row" id="yn" style="margin-top:14px"><button class="btn yn no" id="no">❌ Неверно</button><button class="btn yn yes" id="yes">✅ Верно</button></div>
        <div id="fix"></div><p class="sub" id="hint" style="min-height:1.4em"></p>
      </div>`);
    $('#x').onclick = () => { G = null; hush(); games() };
    const tell = () => say('It is a', g.said.en);
    $('#dq').onclick = tell;
    g.round === 1 ? say('ru:teach', 300, 'It is a', g.said.en) : tell();
    $('#yes').onclick = () => answer(true);
    $('#no').onclick = () => answer(false);
  };
  const point = ok => { if (ok){ g.score++; $('#sc').textContent = '🎓 ' + g.score; ding() } else buzz(); track(me(), revKey(g.x), ok) };
  const answer = yes => {
    if (g.lock || !gAlive(g)) return;
    g.lock = true;
    if (yes && !g.wrong){ point(true); $('#hint').textContent = 'Да, питомец сказал правильно 👍'; return setTimeout(next, 1200) }
    if (yes && g.wrong){ point(false); $('#hint').textContent = `Ой! Это ${g.x.en}, а не ${g.said.en}`; say('It is a', g.x.en); return setTimeout(next, 2200) }
    if (!yes && !g.wrong){ point(false); $('#hint').textContent = 'Питомец сказал правильно!'; return setTimeout(next, 1700) }
    /* питомец ошибся, и ребёнок это заметил — теперь подскажи правильное слово */
    $('#yn').remove(); $('#hint').textContent = 'Верно! А как правильно?';
    const opts = shuffle([g.x, ...shuffle(pool.filter(o => o !== g.x && o !== g.said)).slice(0, 2)]);
    $('#fix').innerHTML = `<div class="opts">${opts.map(o => `<button class="opt word" data-k="${esc(o.en)}">${esc(o.en)}</button>`).join('')}</div>`;
    $$('#fix .opt').forEach(b => b.onclick = () => {
      if (b.dataset.k === g.x.en){ b.classList.add('ok'); point(true); petReact('ok'); say('Oh, thank you!', 200, 'It is a', g.x.en); setTimeout(next, 2400) }
      else { b.classList.add('no'); buzz() }
    });
  };
  next();
}

/* ================= Слушаем перед сном ================= */
function sleepMode(){
  const p = me(), list = shuffle(knownWordsOf(p)).slice(0, 30); if (!list.length) return home();
  let i = 0, paused = false, token = {};
  render('sleep', `
    <div class="sleepbox">
      <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1;color:#e6e9ff">🌙 Слушаем</h2><span class="chip" id="n"></span></div>
      <div class="center" style="margin-top:30px"><div class="bigem" id="em"></div><p class="bigword" id="bw"></p><p class="ruhint" id="ru"></p></div>
      <div class="center" style="margin-top:20px"><button class="btn round ghost" id="pp">⏸</button></div>
    </div>`);
  const show = () => {
    if (screen !== 'sleep' || paused) return;
    const mine = token;
    if (i >= list.length){ say('Good night!'); $('#bw').textContent = 'Good night!'; $('#em').textContent = '🌙'; $('#ru').textContent = 'Спокойной ночи!'; return }
    const x = list[i++];
    $('#em').innerHTML = pic(x); $('#bw').textContent = x.en; $('#ru').textContent = x.ru; $('#n').textContent = i + ' / ' + list.length;
    say(x.en, 900, x.en);
    setTimeout(() => { if (token === mine) show() }, 3800);
  };
  $('#x').onclick = () => { token = null; hush(); home() };
  $('#pp').onclick = () => { paused = !paused; token = {}; $('#pp').textContent = paused ? '▶️' : '⏸'; if (!paused) show(); else hush() };
  say('ru:sleep'); setTimeout(show, 2600);
}

/* ================= Карточки для печати ================= */
/* Внутри Telegram печать не работает, поэтому открываем игру в браузере со ссылкой #print=темы */
function printScreen(sel){
  const p = me(), open = TOPICS.filter((t, ti) => topicOpen(p, ti) && t.lessons.some((_, i) => p.stars[t.id + ':' + i] > 0));
  sel = sel || new Set(open.slice(0, 2).map(t => t.id));
  render('print', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">🖨️ Карточки</h2><span style="width:46px"></span></div>
    <p class="sub">Выбери темы — получится лист с карточками: картинка и слово. Распечатай, разрежь по линиям и играй без телефона: угадывай слова, собирай пары, раскладывай по темам.</p>
    <div class="row picks">${open.map(t => `<button class="chip pickp ${sel.has(t.id) ? 'on' : ''}" data-t="${t.id}">${t.icon} ${esc(t.title)}</button>`).join('')}</div>
    <div class="center" style="margin-top:18px"><button class="btn" id="go">🖨️ Открыть для печати</button></div>
    ${tg && tg.initData ? '<p class="sub" style="margin-top:10px;font-size:14px">Лист откроется в браузере — там нажмите «Печать» или «Сохранить как PDF»</p>' : ''}`);
  $('#x').onclick = home;
  $$('[data-t]').forEach(b => b.onclick = () => { const id = b.dataset.t; sel.has(id) ? sel.delete(id) : sel.add(id); printScreen(sel) });
  $('#go').onclick = () => {
    if (!sel.size) return buzz();
    const hash = '#print=' + [...sel].join(',');
    if (tg && tg.initData && tg.openLink) tg.openLink(location.href.split('#')[0] + hash);
    else { location.hash = hash; printSheet([...sel]) }
  };
}
function printSheet(ids){
  const list = TOPICS.filter(t => ids.includes(t.id));
  document.body.classList.add('printing');
  render('sheet', `
    <div class="noprint row" style="margin:10px 0"><button class="btn" onclick="window.print()">🖨️ Печать</button></div>
    ${list.map(t => `<h3 class="sec">${t.icon} ${esc(t.title)}</h3><div class="cards">${t.lessons.flat().map(x =>
      `<div class="pcard"><span>${pic(x)}</span><b>${esc(x.en)}</b><small>${esc(x.ru)}</small></div>`).join('')}</div>`).join('')}`);
  setTimeout(() => { try { window.print() } catch(e){} }, 600);
}

/* ================= Турнир недели в группе ================= */
/* Случайность, одинаковая у всех в группе: зависит от кода группы и номера недели */
function seeded(str){ let h = 1779033703; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296 } }
function tourQs(code, week){
  const rnd = seeded(code + ':' + week), pool = TOPICS.filter(t => TOUR_TOPICS.includes(t.id)).flatMap(t => t.lessons.flat());
  const picked = [...pool].sort(() => rnd() - .5).slice(0, 10);
  return picked.map((x, i) => ({k: revKey(x), t: DUEL_W[i % 3]}));
}
async function tourScreen(code){
  const groups = (srv && srv.groups) || [];
  if (!groups.length) return home();
  const g = groups.find(x => x.code === code) || groups[0], week = weekNo(), p = me();
  render('tour', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">🏆 Турнир недели</h2><span style="width:46px"></span></div>
    ${groups.length > 1 ? `<div class="tabs">${groups.map(x => `<button class="tab ${x === g ? 'on' : ''}" data-c="${x.code}">${esc(x.name)}</button>`).join('')}</div>` : `<p class="sub">Группа «${esc(g.name)}»</p>`}
    <p class="sub">10 вопросов — одинаковых для всех в группе. Можно играть сколько угодно раз, засчитывается лучший результат. Новый турнир — каждый понедельник.</p>
    <div class="center"><button class="btn" id="go">▶ Играть</button></div>
    <div id="tb"><p class="sub">Загружаю таблицу…</p></div>`);
  $('#x').onclick = home;
  $$('[data-c]').forEach(b => b.onclick = () => tourScreen(b.dataset.c));
  $('#go').onclick = () => { say('ru:tour'); playDuel(tourQs(g.code, week), async r => {
    if (!r) return tourScreen(g.code);
    wait('Записываю результат…');
    await post('/api/tour', {action: 'score', code: g.code, week, pid: p.id, name: p.name, avatar: p.avatar, score: r.score, ms: r.ms});
    earn(p, 3); dayMark(p, 'r'); touchStreak(p); save(); fanfare(); tourScreen(g.code);
  }) };
  const r = await post('/api/tour', {action: 'list', code: g.code, week});
  if (screen !== 'tour' || !$('#tb')) return;
  if (!r || !r.rows) return $('#tb').innerHTML = '<p class="sub">Таблица турнира появится, когда сервер обновят.</p>';
  $('#tb').innerHTML = `${r.rows.length ? duelTable(r.rows.map((x, i) => ({...x, name: (i === 0 ? '👑 ' : '') + x.name})), 10) : '<p class="sub">Пока никто не сыграл — будь первым!</p>'}
    ${r.last ? `<p class="sub" style="margin-top:12px">Победитель прошлой недели: 👑 ${esc(r.last.name)} (${r.last.score} из 10)</p>` : ''}`;
}

/* ================= Открыть тему раньше времени ================= */
const UNLOCK_PRICE = 30;
function unlockTopic(id){
  const p = me(), t = TOPICS.find(x => x.id === id); if (!t) return;
  askBox(`<p>Открыть тему «${esc(t.title)}» ${t.icon} сейчас за ${UNLOCK_PRICE} 🦴?</p>`, 'Открыть', 'Не сейчас', () => {
    if (!spend(p, UNLOCK_PRICE, 'u')){ buzz(); return home() }
    p.open = [...(p.open || []), id]; save(); fanfare(); topicScreen(id);
  });
}

/* ================= Праздники, кроме Нового года ================= */
const itemEv = i => i.ev || (i.ny ? 'ny' : '');
function evBanner(p){
  const ev = curEvents().find(e => e !== 'ny'); if (!ev) return '';
  const t = TOPICS.find(x => x.holiday === ev);
  return `<button class="review ny" id="evb" data-t="${t.id}"><span class="rv-ic">${EVENTS[ev].icon}</span><span class="rv-t"><b>${EVENTS[ev].title}!</b><small>Праздничная тема и украшения в магазине — только сейчас</small></span><span class="rv-go">▶</span></button>`;
}

/* ================= Задания недели ================= */
function weekQ(p){
  const w = weekNo();
  if (!p.wq || p.wq.w !== w) p.wq = {w, l: 0, g: 0, r: 0, w0: learnedN(p), days: [], got: false};
  return p.wq;
}
function questMark(p, k){ const q = weekQ(p); q[k] = (q[k] || 0) + 1; if (!q.days.includes(dayNo())) q.days.push(dayNo()) }
function questsOf(){
  const rnd = seeded('quests:' + weekNo()), out = [];
  for (const q of [...QUESTS].sort(() => rnd() - .5)) if (out.length < 4 && !out.some(o => o.id === q.id)) out.push(q);
  return out;
}
function questProgress(p, q){
  const s = weekQ(p);
  return Math.min(q.n, q.id === 'w' ? Math.max(0, learnedN(p) - s.w0) : q.id === 'd' ? s.days.length : s[q.id] || 0);
}
function questsHTML(p){
  const list = questsOf(), s = weekQ(p), all = list.every(q => questProgress(p, q) >= q.n);
  return `<div class="daily quests ${s.got ? 'done' : ''}"><div class="dl-t"><b>Задания недели</b>
    <div class="dl-q">${list.map(q => { const n = questProgress(p, q); return `<span class="${n >= q.n ? 'ok' : ''}">${n >= q.n ? '✅' : q.icon} ${q.ru} <i>${n}/${q.n}</i></span>` }).join('')}</div></div>
    <button class="chest ${all && !s.got ? 'ready' : ''}" id="wq"><i>${s.got ? '🏆' : '🎯'}</i><small>${s.got ? 'получено' : all ? `+${WEEK_PRIZE} 🦴` : 'до пн'}</small></button></div>`;
}
function wireQuests(){
  const b = $('#wq'); if (!b) return;
  b.onclick = () => {
    const p = me(), s = weekQ(p);
    if (s.got || !questsOf().every(q => questProgress(p, q) >= q.n)){ buzz(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return }
    s.got = true; earn(p, WEEK_PRIZE); save(); fanfare(); say('Excellent!'); home();
  };
}

/* ================= Сад питомца ================= */
function gardenHTML(p){
  const trees = TOPICS.filter(t => !t.holiday && topicDone(p, t)).map((t, i) => GARDEN[i % GARDEN.length]);
  const sprouts = Math.min(30, Math.floor(learnedN(p) / 10));
  return `<div class="garden"><small>сад · ${trees.length} ${plural(trees.length, 'тема', 'темы', 'тем')}, ${learnedN(p)} слов</small>
    <div>${trees.join('')}${'🌱'.repeat(sprouts)}${!trees.length && !sprouts ? '<em>Учи слова — и здесь вырастет сад 🌱</em>' : ''}</div></div>`;
}

/* ================= Слово дня от бота: какие слова отправлять ================= */
/* Слова двух последних открытых тем — их ребёнок учит сейчас */
function wordsOfDay(){
  const p = me(); if (!p) return [];
  const open = TOPICS.filter((t, ti) => !t.holiday && topicOpen(p, ti)).slice(-2);
  return open.flatMap(t => t.lessons.flat()).slice(0, 16).map(x => ({en: x.en, ru: x.ru, e: x.e || x.n || '🎨'}));
}

/* ================= Домашнее задание в группе (учитель — владелец группы) ================= */
const hwOf = g => g && g.hw && g.hw.due >= new Date().toISOString().slice(0, 10) ? g.hw : null;
const hwTopics = hw => TOPICS.filter(t => hw.topics.includes(t.id));
const hwDone = (p, hw) => hwTopics(hw).filter(t => topicDone(p, t)).map(t => t.id);
function hwBanner(){
  const p = me(), g = online() && srv && (srv.groups || []).find(x => hwOf(x) && hwDone(p, x.hw).length < x.hw.topics.length && !x.mine);
  if (!g) return '';
  return `<button class="review focus" id="hwb"><span class="rv-ic">📚</span><span class="rv-t"><b>Домашка от «${esc(g.name)}»</b><small>${hwTopics(g.hw).map(t => t.icon).join(' ')} до ${g.hw.due.slice(8, 10)}.${g.hw.due.slice(5, 7)}</small></span><span class="rv-go">▶</span></button>`;
}
async function hwScreen(code, edit){
  const p = me(), groups = (srv && srv.groups) || [];
  if (!groups.length) return home();
  const g = groups.find(x => x.code === code) || groups.find(x => hwOf(x)) || groups[0], hw = hwOf(g);
  if (hw) post('/api/hw', {action: 'done', code: g.code, pid: p.id, name: p.name, done: hwDone(p, hw)});
  const sel = new Set(edit || (hw ? hw.topics : []));
  const days = Array.from({length: 7}, (_, i) => new Date(Date.now() + (i + 1) * 864e5).toISOString().slice(0, 10));
  render('hw', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">📚 Домашнее задание</h2><span style="width:46px"></span></div>
    ${groups.length > 1 ? `<div class="tabs">${groups.map(x => `<button class="tab ${x === g ? 'on' : ''}" data-c="${x.code}">${esc(x.name)}</button>`).join('')}</div>` : `<p class="sub">Группа «${esc(g.name)}»</p>`}
    ${hw ? `<div class="stage"><p class="task">До ${hw.due.slice(8, 10)}.${hw.due.slice(5, 7)}: пройти темы</p>
      <div class="board">${hwTopics(hw).map(t => `<button class="brow tap" data-topic="${t.id}"><span class="bav">${t.icon}</span><span class="bn">${esc(t.title)}</span><span class="bs">${topicDone(p, t) ? '✅' : '▶'}</span></button>`).join('')}</div></div>`
      : '<p class="sub">Сейчас домашнего задания нет.</p>'}
    ${g.mine ? `<h3 class="sec">✏️ Задать домашку <small>вы владелец группы</small></h3>
      <div class="row picks">${TOPICS.filter(t => !t.holiday).map(t => `<button class="chip pickp ${sel.has(t.id) ? 'on' : ''}" data-pick="${t.id}">${t.icon} ${esc(t.title)}</button>`).join('')}</div>
      <p class="sub" style="margin:12px 0 6px">Срок</p>
      <select id="due" class="sel">${days.map(d => `<option value="${d}" ${hw && hw.due === d ? 'selected' : ''}>${d.slice(8, 10)}.${d.slice(5, 7)}</option>`).join('')}</select>
      <div class="row" style="margin-top:12px"><button class="btn" id="save">Задать</button>${hw ? '<button class="btn ghost" id="clear">Отменить</button>' : ''}</div>
      <h3 class="sec">👀 Кто сделал</h3><div id="who"><p class="sub">Загружаю…</p></div>` : ''}`);
  $('#x').onclick = home;
  $$('[data-c]').forEach(b => b.onclick = () => hwScreen(b.dataset.c));
  /* тема из домашки открывается сразу, даже если по цепочке до неё ещё далеко */
  $$('[data-topic]').forEach(b => b.onclick = () => { const id = b.dataset.topic, ti = TOPICS.findIndex(t => t.id === id); if (!topicOpen(p, ti)){ p.open = [...(p.open || []), id]; save() } topicScreen(id) });
  if (!g.mine) return say('ru:hw');
  $$('[data-pick]').forEach(b => b.onclick = () => { const id = b.dataset.pick; sel.has(id) ? sel.delete(id) : sel.add(id); hwScreen(g.code, [...sel]) });
  const setHw = async val => { const r = await call('/api/hw', {action: 'set', code: g.code, hw: val}); if (!r) return buzz(); ding(); hwScreen(g.code) };
  $('#save').onclick = () => sel.size ? setHw({topics: [...sel].slice(0, 6), due: $('#due').value}) : buzz();
  if ($('#clear')) $('#clear').onclick = () => setHw(null);
  const r = await post('/api/hw', {action: 'list', code: g.code});
  if (screen !== 'hw' || !$('#who')) return;
  $('#who').innerHTML = r && r.rows ? (r.rows.length ? `<div class="board">${r.rows.map(x => `<div class="brow"><span class="bn">${esc(x.name)}</span><span class="bs">${x.done.length} из ${hw ? hw.topics.length : 0} ${hw && x.done.length >= hw.topics.length ? '✅' : ''}</span></div>`).join('')}</div>` : '<p class="sub">Пока никто не открывал задание.</p>')
    : '<p class="sub">Список появится, когда сервер обновят.</p>';
}

/* ================= Покупки за Звёзды Telegram ================= */
/* Оплату подтверждает сам Telegram в своём окне. Сервер записывает оплаченное, игра выдаёт и сообщает серверу, что выдала.
   Номера выданных покупок помним и на телефоне — чтобы ничего не выдать дважды, даже если связь оборвалась. */
const BUYS_KEY = 'tiny-buys';
const starsOn = () => online() && !!(tg && tg.openInvoice);
function starShopHTML(p){
  if (!starsOn()) return '';
  return `<h3 class="sec">⭐ За звёзды Telegram <small>поддержать игру</small></h3>
    <div class="shop">${STAR_SHOP.map(s => { const has = s.give.own && owns(p, s.give.own);
      return `<button class="si stars ${has ? 'own' : ''}" data-star="${s.id}"><i>${s.icon}</i><b>${esc(s.ru)}</b><small>${esc(s.small)}</small><span class="pr">${has ? '✓ есть' : '⭐ ' + s.stars}</span></button>` }).join('')}</div>`;
}
function wireStarShop(){
  $$('[data-star]').forEach(b => b.onclick = async () => {
    const p = me(), s = STAR_SHOP.find(x => x.id === b.dataset.star);
    if (!s || b.classList.contains('own') || b.disabled) return;
    b.disabled = true;
    const r = await post('/api/invoice', {item: s.id, pid: p.id});
    b.disabled = false;
    if (!r || !r.link) return askBox('<p>Не получилось открыть оплату. Проверьте интернет и попробуйте ещё раз.</p>', 'Хорошо', 'Закрыть', () => {});
    try {
      tg.openInvoice(r.link, status => { if (status === 'paid') waitBuys() });
    } catch(e){ buzz() }
  });
}
/* После оплаты покупка появляется на сервере через секунду-другую — спрашиваем несколько раз */
async function waitBuys(){
  for (let i = 0; i < 8; i++){
    const r = await syncServer();
    if (r && r.buys && r.buys.length) return;
    await new Promise(ok => setTimeout(ok, 1500));
  }
}
function applyBuys(list){
  let done; try { done = new Set(JSON.parse(localStorage.getItem(BUYS_KEY)) || []) } catch(e){ done = new Set() }
  const got = [];
  for (const b of list){
    if (done.has(b.charge)) continue;
    const s = STAR_SHOP.find(x => x.id === b.item), p = db.profiles.find(x => x.id === b.pid) || me();
    if (!s || !p) continue;
    if (s.give.e){ const q = petOf(p); q.f = q.m = q.e = 100 }
    if (s.give.b) earn(p, s.give.b);
    if (s.give.fr) p.fr = (p.fr || 0) + s.give.fr;
    if (s.give.own && !owns(p, s.give.own)) p.own = [...(p.own || []), s.give.own];
    done.add(b.charge); got.push({s, p});
  }
  try { localStorage.setItem(BUYS_KEY, JSON.stringify([...done].slice(-200))) } catch(e){}
  post('/api/buys', {ids: list.map(b => b.charge)});
  if (!got.length) return;
  save();
  /* посреди урока или игры не мешаем — покупка уже выдана, увидят в магазине */
  if (!['room', 'home', 'chest', 'loading'].includes(screen)) return ding();
  render('chest', `
    <div class="stage" style="margin-top:24px"><div class="center">
      <div class="bigem medal">⭐</div>
      <h1>Спасибо!</h1>
      ${got.map(({s, p}) => `<div class="earned big">${s.icon} ${esc(s.ru)}${db.profiles.length > 1 ? ' · ' + esc(p.name) : ''}</div>`).join('')}
      <p class="sub" style="margin:0">Покупка уже в игре</p>
      <button class="btn" id="go">Ура! →</button>
    </div></div>`);
  fanfare();
  $('#go').onclick = () => room('shop');
}
