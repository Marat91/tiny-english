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
  </div>`;
}
function wireMore(){
  if ($('#mfix')) $('#mfix').onclick = startFix;
  if ($('#msleep')) $('#msleep').onclick = sleepMode;
  if ($('#mprint')) $('#mprint').onclick = () => printScreen();
  if ($('#mtour')) $('#mtour').onclick = () => tourScreen();
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
