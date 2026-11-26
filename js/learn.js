/* Новые виды занятий: слова целиком, мини-книжки, «Я вижу…», магазин понарошку, часы, монетки,
   противоположности, сравнение, «Моя история» и разговор с питомцем.
   Уроки регистрируются в KINDS и добавляются в общий список ALL (см. app.js). */

const topicOf = id => { const ti = TOPICS.findIndex(t => t.id === id); return {t: TOPICS[ti], ti} };
const words = text => text.match(/[A-Za-z']+|[^A-Za-z']+/g) || [];             // слова и всё, что между ними
const clean = w => w.toLowerCase().replace(/[^a-z']/g, '');
const NUM_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

ALL.push(
  ...SIGHT.map((set, i) => ({id: 'sw:' + i, kind: 'sight', i, set, req: 'rd:3'})),
  ...BOOKS.map(b => ({id: 'bk:' + b.i, kind: 'book', i: b.i, b, req: b.after, set: []})),
  ...SCENES.map(sc => ({id: 'sp:' + sc.i, kind: 'spy', i: sc.i, sc, ...topicOf(sc.after), set: sc.items})),
  ...ROLEPLAYS.map(r => ({id: 'rp:' + r.i, kind: 'role', i: r.i, r, ...topicOf(r.after), set: []})),
  {id: 'ck:0', kind: 'clock', i: 0, ...topicOf('numbers'), set: []},
  {id: 'mn:0', kind: 'money', i: 1, ...topicOf('numbers2'), set: []},
  {id: 'op:0', kind: 'opp', i: 0, ...topicOf('adjectives'), set: []},
  {id: 'op:1', kind: 'cmp', i: 1, ...topicOf('adjectives'), set: []},
);

/* ================= Слова целиком ================= */
KINDS.sight = {label: '👀 Слова целиком', obj: L => ({title: L.set.map(x => x.en).join(' '), icon: '👀'}),
  steps: L => [...L.set.map(x => ({t: 'sintro', x})), ...shuffle(L.set).map(x => ({t: 'whear', x})), ...shuffle(L.set).map(x => ({t: 'sfind', x}))]};
const markIn = (ex, w) => words(ex).map(t => clean(t) === w.toLowerCase() ? `<b>${esc(t)}</b>` : esc(t)).join('');
STEPS.sintro = ({x}) => {
  frame(`
    <p class="task">Это слово читают целиком 👀</p>
    <p class="bigword" id="bw">${esc(x.en)}</p>
    <p class="ruhint">${x.ru}</p>
    <button class="bubble wide" id="ex">${markIn(x.ex, x.en)}</button>
    <div class="row" style="margin-top:14px"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#bw').onclick = () => say(x.en);
  $('#ex').onclick = $('#snd').onclick = () => say(x.en, 400, x.ex);
  $('#go').onclick = advance;
  task('sintro', x.en, 400, x.ex);
};
/* Найти слово в предложении */
STEPS.sfind = ({x}) => {
  let missed = false, done = false;
  frame(`
    <p class="task">Найди слово «${esc(x.en)}»</p>
    <div class="sentence">${words(x.ex).map(t => /[A-Za-z]/.test(t) ? `<button class="sw-b" data-w="${esc(clean(t))}">${esc(t)}</button>` : '').join(' ')}</div>
    <div class="center" style="margin-top:14px"><button class="btn round ghost" id="snd">🔊</button></div>`);
  $('#snd').onclick = () => say(x.ex);
  $$('.sw-b').forEach(b => b.onclick = () => {
    if (done) return;
    if (b.dataset.w === x.en.toLowerCase()){
      done = true; b.classList.add('ok'); ding(); petReact('ok'); track(me(), revKey(x), !missed);
      later(() => say(x.ex), 300); later(advance, 1800);
    } else { b.classList.add('no'); buzz(); if (!missed){ missed = true; S.mistakes++ } }
  });
  task('sfind', x.en);
};

/* ================= Мини-книжки ================= */
KINDS.book = {label: '📚 Книжка', obj: L => L.b,
  steps: L => [...L.b.pages.map((pg, i) => ({t: 'bpage', pg, i, b: L.b})), ...L.b.pages.map((pg, i) => ({t: 'bself', pg, i, b: L.b})),
    {t: 'speak', x: {en: L.b.pages[0].en.replace(/[.!]$/, ''), ru: 'Прочитай вслух', e: L.b.pages[0].e}}]};
const pageHTML = (pg, i, b) => `
  <div class="page">
    <div class="bigem sm">${pg.e}</div>
    <p class="bookline">${words(pg.en).map(t => /[A-Za-z]/.test(t) ? `<button class="bw" data-w="${esc(clean(t))}">${esc(t)}</button>` : esc(t)).join('')}</p>
  </div>
  <div class="dots">${b.pages.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>`;
const wireBook = () => $$('.bw').forEach(b => b.onclick = () => { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); say(b.dataset.w) });
STEPS.bpage = ({pg, i, b}) => {
  frame(`<p class="task">📚 ${esc(b.title)} · слушаем</p>${pageHTML(pg, i, b)}
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  wireBook();
  $('#snd').onclick = () => say(pg.en);
  $('#go').onclick = advance;
  task('bpage', pg.en);
};
STEPS.bself = ({pg, i, b}) => {
  frame(`<p class="task">📖 Читаю сам</p>${pageHTML(pg, i, b)}
    <p class="sub" style="margin:0 0 10px">Трудное слово? Нажми на него</p>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Я прочитал! →</button></div>`);
  wireBook();
  $('#snd').onclick = () => say(pg.en);
  $('#go').onclick = () => { ding(); advance() };
  task('bself');
};

/* ================= «Я вижу…»: сцена с предлогами ================= */
KINDS.spy = {label: '🔍 Я вижу…', obj: L => L.sc,
  steps: L => [...L.set.map(x => ({t: 'spyintro', x, sc: L.sc})), ...shuffle(L.set).map(x => ({t: 'spyfind', x, sc: L.sc})), ...shuffle(L.set).slice(0, 4).map(x => ({t: 'spypick', x, sc: L.sc}))]};
/* Где нарисовать предмет относительно мебели (в em шрифта сцены) */
function spyPos(sc, it){
  const [, x, y, s] = sc.things[it.of];
  const at = {on: [0, -(s * .42 + .6), 3], under: [0, s * .3, 3], in: [0, -s * .16, 1], 'next to': [s * .55 + .75, s * .18, 3]}[it.rel];
  return `left:calc(${x}% + ${at[0]}em);top:calc(${y}% + ${at[1]}em);z-index:${at[2]}`;
}
const spyScene = (sc, hi) => `<div class="scene" style="background:${sc.bg}">
  ${Object.entries(sc.things).map(([id, [e, x, y, s]]) => `<span class="thing" style="left:${x}%;top:${y}%;font-size:${s}em">${e}</span>`).join('')}
  ${sc.items.map(it => `<button class="spy ${hi === it ? 'hi' : ''}" data-k="${esc(it.k)}" style="${spyPos(sc, it)}">${it.e}</button>`).join('')}
</div>`;
STEPS.spyintro = ({x, sc}) => {
  frame(`<p class="task">${esc(sc.title)} 👀</p>${spyScene(sc, x)}
    <button class="bubble wide" id="ph">${esc(x.say)}<small>${esc(x.ru)} — ${PREP_RU[x.rel]} …</small></button>
    <div class="row" style="margin-top:12px"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#ph').onclick = $('#snd').onclick = () => say(x.say);
  $$('.spy').forEach(b => b.onclick = () => { const it = sc.items.find(i => i.k === b.dataset.k); say(it.say) });
  $('#go').onclick = advance;
  task('spyintro', x.say);
};
STEPS.spyfind = ({x, sc}) => {
  let missed = false, done = false;
  frame(`${helper('Послушай и нажми на картинке')}${spyScene(sc)}
    <div class="center" style="margin-top:12px"><button class="btn big-round" id="snd" style="width:84px;height:84px;font-size:36px">🔊</button></div>`);
  $('#snd').onclick = () => say(x.say);
  $$('.spy').forEach(b => b.onclick = () => {
    if (done) return;
    if (b.dataset.k === x.k){ done = true; b.classList.add('hi'); ding(); petReact('ok'); track(me(), revKey(x), !missed); later(advance, 1100) }
    else { buzz(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); if (!missed){ missed = true; S.mistakes++; petReact('no') } }
  });
  task('spyfind', x.say);
};
STEPS.spypick = ({x, sc}) => {
  const rels = shuffle([x.rel, ...shuffle(['on', 'under', 'in', 'next to'].filter(r => r !== x.rel)).slice(0, 2)]);
  frame(`<p class="task">${esc(x.ask)}</p>${spyScene(sc, x)}
    <div class="opts">${rels.map(r => `<button class="opt word phr" data-k="${esc(r)}">${esc(r)} the ${esc(x.of)}</button>`).join('')}</div>`);
  wireOptions({...x, k: x.rel}, () => { later(() => say(x.say), 300); later(advance, 1700) });
  task('spypick');
};

/* ================= Магазин понарошку и монетки ================= */
KINDS.role = {label: '🛒 Магазин', obj: L => L.r,
  steps: L => [...L.r.lines.map(line => ({t: line.pay ? 'pay' : 'role', line, r: L.r, n: line.pay})),
    {t: 'speak', x: {...L.r.lines[0].opts[0], e: L.r.icon}}]};
const seller = (r, line) => `<div class="talk"><span class="who seller">${r.who}</span><button class="bubble q" id="dq">${esc(line.en)}<small>${esc(line.ru)}</small></button></div>`;
STEPS.role = ({line, r}) => {
  const right = line.opts[0];
  frame(`<p class="task">🛒 ${esc(r.title)}</p>${seller(r, line)}
    <p class="sub" style="margin:6px 0 0">Что ответить?</p>
    <div class="opts one">${shuffle(line.opts).map(o => `<button class="opt word phr" data-k="${esc(o.en)}">${esc(o.en)}<small class="cap">${esc(o.ru)}</small></button>`).join('')}</div>`);
  $('#dq').onclick = () => say(line.en);
  wireOptions({k: right.en, en: right.en}, () => { later(() => say(right.en), 300); later(advance, 2200) });
  task('role', line.en);
};
/* Заплатить n монеток: line — реплика продавца (или talk — что сказать) */
STEPS.pay = ({line, r, n, talk}) => {
  let paid = 0, missed = false, done = false;
  frame(`${line ? `<p class="task">🛒 ${esc(r.title)}</p>${seller(r, line)}` : `<p class="task">Дай ${n} ${plural(n, 'монетку', 'монетки', 'монеток')} 🪙</p>`}
    <div class="purse">${Array.from({length: 10}, (_, i) => `<button class="coin" data-i="${i}">🪙</button>`).join('')}</div>
    <div class="paid"><span id="pd">Заплачено: 0</span></div>
    <div class="row" style="margin-top:10px"><button class="btn round ghost" id="snd">🔊</button><button class="btn ghost" id="clr">↺</button><button class="btn" id="go">Заплатить ✓</button></div>`);
  const sayIt = () => line ? say(line.en) : say(...talk);
  $('#snd').onclick = sayIt;
  if (line) $('#dq').onclick = sayIt;
  const upd = () => { $('#pd').textContent = 'Заплачено: ' + paid };
  $$('.coin').forEach(b => b.onclick = () => { if (done || b.classList.contains('used')) return; b.classList.add('used'); paid++; tone(500 + paid * 40, .1); upd(); if (paid <= 10) say(NUM_WORDS[paid - 1]) });
  $('#clr').onclick = () => { if (done) return; paid = 0; $$('.coin').forEach(b => b.classList.remove('used')); upd() };
  $('#go').onclick = () => {
    if (done) return;
    if (paid === n){ done = true; ding(); petReact('ok'); say('Here you are'); later(advance, 1300) }
    else { buzz(); petReact('no'); if (!missed){ missed = true; S.mistakes++ } $('#pd').textContent = paid < n ? 'Мало! Нужно ' + n : 'Много! Нужно ' + n; paid = 0; $$('.coin').forEach(b => b.classList.remove('used')) }
  };
  line ? task('pay', line.en) : task('pay', ...talk);
};
KINDS.money = {label: '🪙 Монетки', obj: () => ({title: 'How many coins?', icon: '🪙'}),
  steps: () => [...shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4).map(n => ({t: 'mcount', n})),
    ...shuffle([1, 3, 4, 6, 7, 8, 10]).slice(0, 4).map(n => ({t: 'pay', n, talk: [NUM_WORDS[n - 1], 'coins']}))]};
STEPS.mcount = ({n}) => {
  const opts = shuffle([n, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(k => k !== n)).slice(0, 2)]);
  frame(`<p class="task">How many coins? 🪙</p>
    <div class="pile">${'🪙'.repeat(n)}</div>
    <div class="opts">${opts.map(k => `<button class="opt word" data-k="${k}">${NUM_WORDS[k - 1]}</button>`).join('')}</div>`);
  wireOptions({k: String(n), en: NUM_WORDS[n - 1]}, () => { later(() => say(NUM_WORDS[n - 1], 'coins'), 300); later(advance, 1700) });
  task('mcount', 'How many coins?');
};

/* ================= Часы ================= */
KINDS.clock = {label: '🕐 Который час?', obj: () => ({title: "What time is it?", icon: '🕐'}),
  steps: () => [...[3, 7, 12].map(h => ({t: 'cintro', h})), ...shuffle([1, 2, 4, 5, 6, 8, 9, 10, 11]).slice(0, 6).map(h => ({t: 'cpick', h})),
    ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 3).map(h => ({t: 'chear', h}))]};
function clockSVG(h){
  const a = (h % 12) * 30 * Math.PI / 180, hx = 50 + 22 * Math.sin(a), hy = 50 - 22 * Math.cos(a);
  return `<svg class="clock" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#5b5bf0" stroke-width="4"/>
    ${Array.from({length: 12}, (_, i) => { const b = (i + 1) * 30 * Math.PI / 180; return `<text x="${50 + 36 * Math.sin(b)}" y="${50 - 36 * Math.cos(b) + 4}" text-anchor="middle" font-size="11" font-weight="900" fill="#1e2340">${i + 1}</text>` }).join('')}
    <line x1="50" y1="50" x2="50" y2="16" stroke="#7a819c" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${hx}" y2="${hy}" stroke="#f43f5e" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="#1e2340"/></svg>`;
}
STEPS.cintro = ({h}) => {
  frame(`<p class="task">Который час? 🕐</p><div class="center">${clockSVG(h)}</div>
    <p class="bigword phr" id="bw">${esc(TIME_SAY(h))}</p>
    <p class="ruhint">${h} ${plural(h, 'час', 'часа', 'часов')} ровно. Красная стрелка — часы, длинная — на 12</p>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#bw').onclick = $('#snd').onclick = () => say(TIME_SAY(h));
  $('#go').onclick = advance;
  task('cintro', "What time is it?", 300, TIME_SAY(h));
};
STEPS.cpick = ({h}) => {
  const opts = shuffle([h, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(k => k !== h)).slice(0, 2)]);
  frame(`<p class="task">What time is it?</p><div class="center">${clockSVG(h)}</div>
    <div class="opts one">${opts.map(k => `<button class="opt word phr" data-k="${k}">${esc(TIME_SAY(k))}</button>`).join('')}</div>`);
  wireOptions({k: String(h), en: TIME_SAY(h)}, () => { later(() => say(TIME_SAY(h)), 300); later(advance, 1700) });
  task('cpick', "What time is it?");
};
STEPS.chear = ({h}) => {
  const opts = shuffle([h, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(k => k !== h)).slice(0, 2)]);
  frame(`${helper('Послушай и найди часы')}
    <div class="center" style="margin-top:8px"><button class="btn round" id="snd">🔊</button></div>
    <div class="opts three">${opts.map(k => `<button class="opt" data-k="${k}">${clockSVG(k)}</button>`).join('')}</div>`);
  $('#snd').onclick = () => say(TIME_SAY(h));
  wireOptions({k: String(h), en: TIME_SAY(h)}, () => later(advance, 1000));
  task('chear', TIME_SAY(h));
};

/* ================= Противоположности и сравнение ================= */
KINDS.opp = {label: '↔️ Наоборот', obj: () => ({title: 'hot — cold', icon: '↔️'}),
  steps: () => [...OPPOSITES.map(o => ({t: 'ointro', o})), ...shuffle(OPPOSITES).map((o, i) => ({t: 'opick', o, flip: i % 2 === 1}))]};
STEPS.ointro = ({o}) => {
  frame(`<p class="task">Наоборот ↔️</p>
    <div class="opp"><button class="oc" id="oa"><i>${o.a.e}</i><b>${esc(o.a.en)}</b><small>${o.a.ru}</small></button><span>↔️</span>
      <button class="oc" id="ob"><i>${o.b.e}</i><b>${esc(o.b.en)}</b><small>${o.b.ru}</small></button></div>
    <div class="row" style="margin-top:16px"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#oa').onclick = () => say(o.a.en); $('#ob').onclick = () => say(o.b.en);
  $('#snd').onclick = () => say(o.a.en, 400, o.b.en);
  $('#go').onclick = advance;
  task('ointro', o.a.en, 400, o.b.en);
};
STEPS.opick = ({o, flip}) => {
  const from = flip ? o.b : o.a, to = flip ? o.a : o.b;
  const others = shuffle(OPPOSITES.filter(x => x !== o)).slice(0, 2).map(x => Math.random() < .5 ? x.a : x.b);
  frame(`<p class="task">Что наоборот?</p>
    <div class="bigem sm" id="em">${from.e}</div><p class="bigword phr">${esc(from.en)}</p>
    <div class="opts">${shuffle([to, ...others]).map(x => `<button class="opt word" data-k="${esc(x.k)}">${x.e} ${esc(x.en)}</button>`).join('')}</div>`);
  $('#em').onclick = () => say(from.en);
  wireOptions(to, () => { later(() => say(from.en, 300, to.en), 300); later(advance, 1900) });
  task('opick', from.en);
};
KINDS.cmp = {label: '📏 Больше-меньше', obj: () => ({title: 'bigger, smaller', icon: '📏'}),
  steps: () => shuffle([...COMPARE, ...COMPARE]).map(c => ({t: 'cmp', c, e: pick(c.how === 'tall' ? ['🦒', '🌳', '🏢'] : c.how === 'long' ? ['🐍', '🚂', '🥖'] : ['🐘', '🐶', '🍎', '🎈', '🐻'])}))};
STEPS.cmp = ({c, e}) => {
  const right = Math.random() < .5 ? 'L' : 'R';               // где нарисовать «правильный» предмет
  /* «правильный» предмет больше (или меньше — для вопроса про smaller) */
  const look = win => { const f = (c.how === 'small' ? !win : win) ? 1.7 : 1;
    return c.how === 'tall' ? `transform:scaleY(${f})` : c.how === 'long' ? `transform:scaleX(${f})` : `font-size:${f}em` };
  frame(`<p class="task">${esc(c.q)}</p><p class="ruhint" style="margin-top:0">${c.ru}</p>
    <div class="opts cmp">${['L', 'R'].map(sd => `<button class="opt" data-k="${sd}"><span style="display:inline-block;${look(sd === right)}">${e}</span></button>`).join('')}</div>`);
  wireOptions({k: right, en: c.q}, () => later(advance, 1000));
  task('cmp', c.q);
};

/* ================= Моя история ================= */
function myStory(edit){
  const p = me(), pick0 = k => STORY_PARTS[k][0];
  const st = edit || {hero: pick0('hero'), color: pick0('color'), place: pick0('place'), can: pick0('can'), feel: pick0('feel')};
  const W = k => WORDS[k] || {en: k, e: '🤖', ru: ''};
  const lines = s => [['This is my', s.hero], ['My', s.hero, 'is', s.color], ['It is in the', s.place], ['It can', s.can], ['It is', s.feel]];
  const row = (k, title) => `<p class="sub" style="margin:12px 0 6px">${title}</p><div class="row picks">${STORY_PARTS[k].map(v =>
    `<button class="chip pickp ${st[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}">${pic(W(v))} ${esc(v)}</button>`).join('')}</div>`;
  const read = () => say(...lines(st).flatMap(l => [...l, 450]), 'The end!');
  render('mystory', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">✏️ Моя история</h2><span style="width:46px"></span></div>
    ${row('hero', 'Кто герой?')}${row('color', 'Какого цвета?')}${row('place', 'Где он?')}${row('can', 'Что умеет?')}${row('feel', 'Какое настроение?')}
    <div class="page story-out" id="out">${lines(st).map(l => `<p>${esc(l.join(' '))}.</p>`).join('')}
      <div class="bigem sm">${pic(W(st.hero))}${pic(W(st.place))}</div></div>
    <div class="row" style="margin-top:14px"><button class="btn ghost" id="rd">🔊 Прочитать</button><button class="btn" id="sv">💾 Сохранить</button>${tg && tg.openTelegramLink ? '<button class="btn ghost" id="sh">📨 Отправить</button>' : ''}</div>
    ${(p.stories || []).length ? `<h3 class="sec">📚 Мои истории</h3><div class="board">${p.stories.map((s, i) => `<button class="brow tap" data-s="${i}"><span class="bav">${pic(W(s.hero))}</span><span class="bn">My ${esc(s.hero)} · ${esc(s.place)}</span><span class="bs">▶</span></button>`).join('')}</div>` : ''}`);
  if (!myStory.told){ myStory.told = 1; say('ru:mystory') }
  $('#x').onclick = home;
  $$('.picks .chip').forEach(b => b.onclick = () => { st[b.dataset.k] = b.dataset.v; say(b.dataset.v); myStory(st) });
  $('#rd').onclick = read;
  $('#sv').onclick = () => { p.stories = [{...st}, ...(p.stories || [])].slice(0, 12); dayMark(p, 'r'); save(); ding(); myStory(st) };
  if ($('#sh')) $('#sh').onclick = () => {
    const text = lines(st).map(l => l.join(' ') + '.').join('\n') + '\n\n— ' + p.name + ', Tiny English ✏️';
    try { tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(BOT_URL) + '&text=' + encodeURIComponent(text)) } catch(e){}
  };
  $$('[data-s]').forEach(b => b.onclick = () => myStory({...p.stories[+b.dataset.s]}));
}

/* ================= Сервер: что услышал питомец ================= */
const blobB64 = blob => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => ok(''); r.readAsDataURL(blob) });
async function hearCheck(blob, expect, show){
  if (!online() || !blob || blob.size > 400000) return;
  show('Слушаю… 👂');
  const r = await post('/api/hear', {audio: await blobB64(blob), mime: blob.type, expect});
  if (!r || r.error) return show(r && r.error === 'limit' ? 'На сегодня проверки закончились — просто сравни сам 🙂' : 'Сравни свой голос с образцом 👂');
  show(r.ok ? `${myPet().name} понял: «${esc(r.text)}» ✅ Отлично!` : `${myPet().name} услышал: «${esc(r.text || '…')}». Попробуй ещё раз 🙂`);
  if (r.ok){ ding(); petReact('ok') }
}

/* ================= Поболтать с питомцем ================= */
const chatOn = () => online() && !!(srv && srv.chat);
let chatLog = [];
function knownWords(p){ return Object.keys(revOf(p).m).filter(k => k[0] === 'W').map(k => k.slice(2)).slice(0, 200) }
function chat(){
  const p = me(), c = myPet();
  if (!chatLog.length || chatLog.pid !== p.id){ chatLog = [{who: 'pet', en: `Hello, ${p.name}! How are you?`, ru: 'Привет! Как дела?', tips: ['I am fine!', 'I am happy!', 'I am tired.']}]; chatLog.pid = p.id }
  const last = chatLog[chatLog.length - 1];
  render('chat', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">💬 ${esc(c.name)}</h2><span class="chip" id="left">${srv.chat_left != null ? 'осталось ' + srv.chat_left : ''}</span></div>
    <div class="chatlog" id="log">${chatLog.map((m, i) => m.who === 'pet'
      ? `<div class="talk"><span class="who">${c.emoji || '🐶'}</span><button class="bubble q" data-i="${i}">${esc(m.en)}<small>${esc(m.ru || '')}</small></button></div>`
      : `<div class="talk me"><span class="bubble a">${esc(m.en)}</span><span class="who">${av(p)}</span></div>`).join('')}</div>
    ${last.who === 'pet' && last.tips ? `<div class="row tips">${last.tips.map(t => `<button class="chip" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="chatin"><input id="msg" maxlength="120" placeholder="Напиши по-английски…" autocomplete="off"><button class="btn round mic" id="mic">🎙️</button><button class="btn round" id="send">➤</button></div>
    <p class="sub" id="cs" style="margin:6px 0 0;font-size:14px"></p>`);
  const log = $('#log'); log.scrollTop = log.scrollHeight;
  $('#x').onclick = () => { hush(); home() };
  $$('.bubble.q[data-i]').forEach(b => b.onclick = () => say(chatLog[+b.dataset.i].en));
  $$('.tips .chip').forEach(b => b.onclick = () => { $('#msg').value = b.dataset.t; send() });
  $('#send').onclick = () => send();
  $('#msg').onkeydown = e => { if (e.key === 'Enter') send() };
  if (!chat.told){ chat.told = 1; say('ru:chat', 300, last.en) }
  async function send(){
    const text = $('#msg').value.trim().slice(0, 120);
    if (!text || chat.busy) return;
    chat.busy = true; chatLog.push({who: 'me', en: text}); chat(); $('#cs').textContent = c.name + ' думает… 💭';
    const hist = chatLog.slice(-12).map(m => ({role: m.who === 'pet' ? 'assistant' : 'user', text: m.en}));
    const r = await post('/api/chat', {pet: c.name, kid: p.name, words: knownWords(p), history: hist});
    chat.busy = false;
    if (r && r.en){ chatLog.push({who: 'pet', en: r.en, ru: r.ru, tips: r.tips}); if (r.left != null) srv.chat_left = r.left; dayMark(p, 'r'); save() }
    else chatLog.push({who: 'pet', en: r && r.error === 'limit' ? 'I am sleepy now. Let us talk tomorrow!' : 'Oops! Say it again, please.', ru: r && r.error === 'limit' ? 'Я устал. Поболтаем завтра!' : 'Ой! Повтори, пожалуйста.'});
    if (screen === 'chat'){ chat(); say(chatLog[chatLog.length - 1].en) }
  }
  /* голосом: записываем, сервер превращает речь в текст */
  const mic = $('#mic');
  if (!canRec()) mic.remove();
  else mic.onclick = async () => {
    if (mic.rec && mic.rec.state === 'recording') return mic.rec.stop();
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({audio: true}) } catch(e){ micOff = true; mic.remove(); return }
    const chunks = [], rec = mic.rec = new MediaRecorder(stream);
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) };
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop()); mic.classList.remove('on');
      if (screen !== 'chat') return;
      $('#cs').textContent = 'Слушаю… 👂';
      const blob = new Blob(chunks, {type: rec.mimeType || 'audio/mp4'});
      const r = await post('/api/hear', {audio: await blobB64(blob), mime: blob.type});
      if (screen !== 'chat') return;
      if (r && r.text){ $('#msg').value = r.text; $('#cs').textContent = 'Проверь и нажми ➤' } else $('#cs').textContent = 'Не расслышал — попробуй ещё раз или напиши';
    };
    rec.start(); mic.classList.add('on'); $('#cs').textContent = 'Говори! Нажми 🎙️ ещё раз, когда закончишь';
    setTimeout(() => { if (rec.state === 'recording') rec.stop() }, 6000);
  };
}

/* ================= Отчёт для родителей раз в неделю (сервер присылает в Telegram) ================= */
function weekSummary(){
  const d = dayNo();
  return db.profiles.map(p => {
    const s = statOf(p), m = revOf(p).m;
    const days = Array.from({length: 7}, (_, i) => s.d[d - i] || 0);
    const hard = Object.entries(s.x).filter(([k]) => ITEMS[k] && ITEMS[k].x.en).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => ITEMS[k].x.en);
    return {n: p.name, d: days.filter(Boolean).length, a: days.reduce((a, b) => a + b, 0), w: Object.keys(m).filter(k => k[0] === 'W' && ITEMS[k]).length, s: liveStreak(p), t: total(p), h: hard};
  });
}
