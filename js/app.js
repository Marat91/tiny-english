/* Экраны и игры */
const app = document.getElementById('app');
const $ = s => app.querySelector(s);
const $$ = s => [...app.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a };
const pick = a => a[Math.floor(Math.random() * a.length)];
let screen = '';
const render = (name, html) => { screen = name; app.innerHTML = html; window.scrollTo(0, 0) };

const pic = x => x.c ? `<span class="sw" style="background:${x.c}"></span>` : x.n ? `<span class="numpic">${x.n}</span>` : x.e;
const myPet = () => petById((me() || {}).char);
function petReact(kind){
  const d = $('.pet'); if (!d) return;
  d.classList.remove('jump','sad','dance'); void d.getBoundingClientRect();
  d.classList.add(kind === 'ok' ? 'jump' : 'sad');
  clearTimeout(d._cls);
  d._cls = setTimeout(() => d.classList.remove('jump','sad'), 900);   // после реакции возвращаемся в покой
  const c = d.dataset.char && petById(d.dataset.char), im = d.querySelector('img');
  if (c && c.img && im){                                   // у персонажа-картинки меняем позу
    im.src = kind === 'ok' ? c.img.happy : c.img.sad;
    clearTimeout(d._pose);
    d._pose = setTimeout(() => { if (im.isConnected) im.src = c.img.idle }, 1200);
    if (kind === 'ok') sparkle(d);
  }
}
/* Звёздочки веером вверх от персонажа */
function sparkle(d){
  const size = d.offsetWidth;
  for (let i = 0; i < 7; i++){
    const s = document.createElement('span');
    s.className = 'spark'; s.textContent = i % 2 ? '✨' : '⭐';
    const a = (-155 + i * 21.5 + Math.random() * 8) * Math.PI / 180, r = size * (.5 + Math.random() * .3);
    s.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px');
    s.style.setProperty('--dy', Math.round(Math.sin(a) * r) + 'px');
    s.style.animationDelay = (i * 25) + 'ms';
    d.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

/* ---------- список уроков и замки ---------- */
const abcDone = p => ABC.filter((_, i) => p.stars['abc:' + i] > 0).length;
function isLocked(p, L){
  if (L.kind === 'abc') return L.i > 0 && !(p.stars['abc:' + (L.i - 1)] > 0);
  return abcDone(p) < L.ti + 1 || (L.i > 0 && !(p.stars[L.t.id + ':' + (L.i - 1)] > 0));
}
const ALL = [
  ...ABC.map((set, i) => ({id: 'abc:' + i, kind: 'abc', i, set})),
  ...TOPICS.flatMap((t, ti) => t.lessons.map((set, i) => ({id: t.id + ':' + i, kind: 'word', t, ti, i, set}))),
];

/* ================= Профили ================= */
function profiles(){
  render('profiles', `
    <div class="center" style="margin-top:8px">${petSVG('dog', 0)}</div>
    <h1 class="brand">Tiny English</h1>
    <p class="sub">Кто сегодня занимается?</p>
    <div class="plist">
      ${db.profiles.map(p => `<button class="pcard" data-id="${p.id}"><span class="av">${p.avatar}</span>${esc(p.name)}<small>⭐ ${total(p)} · 🔥 ${liveStreak(p)}</small></button>`).join('')}
      ${db.profiles.length < MAX_PROFILES ? '<button class="pcard add" id="add"><span class="av">➕</span>Добавить</button>' : ''}
    </div>`);
  $$('.pcard[data-id]').forEach(b => b.onclick = () => { db.cur = b.dataset.id; save(); home() });
  if ($('#add')) $('#add').onclick = addProfile;
}

function petCards(sel){
  return `<div class="pets">${CHARACTERS.map(c =>
    `<button class="petcard ${c.id === sel ? 'sel' : ''}" data-c="${c.id}">${petSVG(c.id, 0, 'mid')}${c.name}</button>`).join('')}</div>`;
}

function addProfile(){
  let av = AVATARS[0], ch = CHARACTERS[0].id;
  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const tgName = u && !db.profiles.length ? u.first_name : '';
  render('add', `
    <h1>Новый ученик</h1>
    <p class="sub">Выбери картинку и напиши имя</p>
    <div class="center">
      <div class="avs">${AVATARS.map(a => `<button data-a="${a}" class="${a === av ? 'sel' : ''}">${a}</button>`).join('')}</div>
      <input class="name" id="nm" maxlength="14" placeholder="Имя" value="${esc(tgName || '')}">
      <p class="sub" style="margin:8px 0 0">С кем будешь учиться?</p>
      ${petCards(ch)}
      <div class="row" style="margin-top:8px">
        ${db.profiles.length ? '<button class="btn ghost" id="back">Назад</button>' : ''}
        <button class="btn" id="ok">Готово!</button>
      </div>
    </div>`);
  $$('.avs button').forEach(b => b.onclick = () => { av = b.dataset.a; $$('.avs button').forEach(x => x.classList.toggle('sel', x === b)) });
  $$('.petcard').forEach(b => b.onclick = () => { ch = b.dataset.c; $$('.petcard').forEach(x => x.classList.toggle('sel', x === b)); say(petById(ch).hello) });
  if ($('#back')) $('#back').onclick = profiles;
  $('#ok').onclick = () => {
    const name = $('#nm').value.trim();
    if (!name) { $('#nm').focus(); return }
    const p = {id: 'p' + Date.now(), name, avatar: av, char: ch, stars: {}, streak: 0, last: null};
    db.profiles.push(p); db.cur = p.id; save(); home();
  };
}

function choosePet(){
  const p = me();
  render('pet', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Выбери друга</h2><span style="width:48px"></span></div>
    <p class="sub">Звёзды и подарки останутся с тобой</p>
    ${petCards(p.char)}`);
  $('#x').onclick = home;
  $$('.petcard').forEach(b => b.onclick = () => { p.char = b.dataset.c; save(); home(); say(myPet().hello) });
}

/* ================= Главная ================= */
function lessonCard(p, L){
  const st = p.stars[L.id] || 0, locked = isLocked(p, L);
  const face = L.kind === 'abc' ? `<div class="ls">${L.set.map(x => x.u).join('')}</div>`
                                : `<div class="ls pics">${L.set.slice(0, 5).map(pic).join('')}</div>`;
  return `<button class="lcard c${L.i % 6} ${locked ? 'locked' : ''}" data-id="${L.id}">
    ${face}
    <div class="meta"><span class="num">Урок ${L.i + 1}</span>${locked ? '<span class="st">🔒</span>' : starsHTML(st)}</div>
  </button>`;
}
const starsHTML = n => `<span class="st">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

function home(){
  const p = me(); if (!p) return profiles();
  const c = myPet(), t = total(p), done = abcDone(p);
  const nextToy = TOYS.find(x => x.at > t);
  const prevAt = ([...TOYS].reverse().find(x => x.at <= t) || {at: 0}).at;
  const hello = pick([[c.hello, c.helloRu], ['Hello, ' + esc(p.name) + '!', 'Привет! Поиграем?'], ["Let's play!", 'Давай играть!']]);
  render('home', `
    <div class="top">
      <button class="chip" id="who">${p.avatar} ${esc(p.name)}</button>
      <button class="chip" id="fam">👨‍👩‍👧 Семья</button>
      <span class="grow"></span>
      <span class="chip">⭐ ${t}</span>
      <span class="chip">🔥 ${liveStreak(p)}</span>
    </div>
    <div class="hero">
      <div class="hero-txt">
        <div class="hi">${hello[0]}</div>
        <div class="hi-ru">${hello[1]}</div>
        ${nextToy
          ? `<div class="toy">Ещё ${nextToy.at - t} ⭐ — и у ${c.name} появится ${nextToy.icon} ${nextToy.name}</div>
             <div class="toybar"><i style="width:${Math.max(4, Math.round((t - prevAt) / (nextToy.at - prevAt) * 100))}%"></i></div>`
          : `<div class="toy">У ${c.name} есть все подарки! 🎉</div>`}
        <button class="link" id="chg">Сменить друга</button>
      </div>
      ${petSVG(p.char, t)}
    </div>
    ${hasSound() ? '' : '<div class="note">🔇 Звук пока не загрузился — проверь интернет и открой игру ещё раз.</div>'}

    <h3 class="sec">🔤 Алфавит</h3>
    <div class="grid">
      ${ALL.filter(L => L.kind === 'abc').map(L => lessonCard(p, L)).join('')}
      <button class="lcard" id="abc"><div class="ls">🔤</div><div class="meta"><span class="num">Все буквы</span><span class="st">🔊</span></div></button>
    </div>
    ${TOPICS.map((tp, ti) => `
      <h3 class="sec">${tp.icon} ${tp.title}${done < ti + 1 ? ` <small>🔒 откроется после урока ${ti + 1} алфавита</small>` : ''}</h3>
      <div class="grid">${ALL.filter(L => L.t === tp).map(L => lessonCard(p, L)).join('')}</div>`).join('')}`);
  $('#who').onclick = profiles;
  $('#chg').onclick = choosePet;
  $('#fam').onclick = family;
  $('#abc').onclick = () => alphabet();
  $('.pet').onclick = () => { petReact('ok'); say(c.hello) };
  $$('.lcard[data-id]').forEach(b => b.onclick = () => {
    if (b.classList.contains('locked')) { buzz(); petReact('no'); return }
    startLesson(ALL.find(L => L.id === b.dataset.id));
  });
}

/* ================= Семья: общий рейтинг и напоминания ================= */
function family(){
  const draw = () => {
    if (screen !== 'family' && screen !== '') return;
    const board = srv ? srv.board : db.profiles
      .map(p => ({name: p.name, avatar: p.avatar, char: p.char, stars: total(p), streak: liveStreak(p), mine: true}))
      .sort((a, b) => b.stars - a.stars || b.streak - a.streak);
    const sum = board.reduce((a, r) => a + r.stars, 0);
    const medal = i => ['🥇','🥈','🥉'][i] || (i + 1);
    render('family', `
      <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Наша семья</h2><span style="width:48px"></span></div>
      <p class="sub">Вместе мы собрали ⭐ ${sum}</p>
      <div class="board">
        ${board.map((r, i) => `<div class="brow ${r.mine ? 'mine' : ''}">
          <span class="rk">${medal(i)}</span><span class="bav">${esc(r.avatar)}</span>
          <span class="bn">${esc(r.name)} <small>${petById(r.char).emoji}</small></span>
          <span class="bs">⭐ ${r.stars}</span><span class="bs">🔥 ${r.streak}</span>
        </div>`).join('') || '<p class="sub">Пока никого нет</p>'}
      </div>
      ${!online() ? '<div class="note">Общий рейтинг с другими телефонами и напоминания работают, когда игра открыта в Telegram.</div>'
        : !srv ? '<p class="sub" style="margin-top:14px">Загружаю…</p>' : `
        <div class="center" style="margin-top:18px;gap:12px">
          ${srv.family
            ? `<p class="sub" style="margin:0">В семье аккаунтов Telegram: ${srv.family.members}</p>
               <div class="row"><button class="btn" id="inv">Пригласить ещё</button><button class="btn ghost" id="leave">Выйти из семьи</button></div>`
            : `<p class="sub" style="margin:0">Позови маму, папу или друзей — у вас будет общий рейтинг</p>
               <button class="btn" id="mk">Пригласить семью</button>`}
          <div class="remind">
            <button class="chip" id="ron">${srv.remind_on ? '🔔 Напоминания включены' : '🔕 Напоминания выключены'}</button>
            ${srv.remind_on ? `<label class="chip">в <select id="rh">${Array.from({length: 24}, (_, h) => `<option value="${h}" ${h === srv.remind_hour ? 'selected' : ''}>${h}:00</option>`).join('')}</select></label>` : ''}
          </div>
          <p class="sub" style="margin:0;font-size:14px">Напоминание приходит от бота раз в день, если сегодня ещё не занимались</p>
        </div>`}`);
    $('#x').onclick = home;
    const share = () => {
      const url = 'https://t.me/share/url?url=' + encodeURIComponent(srv.family.invite) + '&text=' + encodeURIComponent('Давай учить английский вместе в Tiny English!');
      try { tg.openTelegramLink(url) } catch(e){}
    };
    if ($('#inv')) $('#inv').onclick = share;
    if ($('#mk')) $('#mk').onclick = async () => { await call('/api/family', {action: 'create'}); draw(); if (srv && srv.family) share() };
    if ($('#leave')) $('#leave').onclick = async () => { await call('/api/family', {action: 'leave'}); draw() };
    if ($('#ron')) $('#ron').onclick = async () => { await call('/api/settings', {remind_on: !srv.remind_on, remind_hour: srv.remind_hour}); draw() };
    if ($('#rh')) $('#rh').onchange = async e => { await call('/api/settings', {remind_on: true, remind_hour: +e.target.value}); draw() };
  };
  screen = ''; draw();
  if (online()) syncServer().then(() => { if (screen === 'family') draw() });
}

/* ================= Алфавит (свободный просмотр) ================= */
function markWord(L){
  const i = L.word.toLowerCase().indexOf(L.l);
  return esc(L.word.slice(0, i)) + '<b>' + L.word[i] + '</b>' + esc(L.word.slice(i + 1));
}
function alphabet(cur){
  const L = cur || LETTERS[0];
  render('abc', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Алфавит</h2><span style="width:48px"></span></div>
    <div class="stage">
      <p class="bigletter" style="font-size:clamp(70px,14vw,120px)"><span class="up">${L.u}</span><span class="lo">${L.l}</span></p>
      <p class="ruhint">буква читается «${L.ru}»</p>
      <div class="wordrow" id="wr"><span class="em">${L.emoji}</span><span class="w">${markWord(L)}<small>${L.tr}</small></span></div>
    </div>
    <div class="abc">${LETTERS.map(x => `<button data-u="${x.u}" class="${x === L ? 'cur' : ''}">${x.u}${x.l}</button>`).join('')}</div>`);
  $('#x').onclick = () => { hush(); home() };
  $('#wr').onclick = () => say(L.word);
  $('.bigletter').onclick = () => say(L.u);
  $$('.abc button').forEach(b => b.onclick = () => { const n = LETTERS.find(x => x.u === b.dataset.u); alphabet(n); say(n.u, n.word) });
}

/* ================= Урок ================= */
let S = null;
function startLesson(L){
  const set = L.set;
  let listen = shuffle([...set, ...set]);
  for (let k = 0; k < 30 && listen.some((x, j) => j && x === listen[j - 1]); k++) listen = shuffle(listen);
  const T = L.kind === 'abc' ? ['intro', 'listen', 'missing', 'pairs'] : ['wintro', 'wlisten', 'wread', 'wpairs'];
  const steps = [
    ...set.map(x => ({t: T[0], x})),
    ...listen.map(x => ({t: T[1], x})),
    ...shuffle(set).map(x => ({t: T[2], x})),
    {t: T[3], set},
  ];
  const pool = L.kind === 'abc' ? LETTERS.slice(0, ABC_RANGES[L.i][1]) : L.t.lessons.slice(0, L.i + 1).flat();
  S = {L, steps, pos: 0, mistakes: 0, pool};
  step();
}
function frame(inner){
  render('lesson', `
    <div class="lbar"><button class="x" id="x">✕</button><div class="prog"><i style="width:${Math.round(S.pos / S.steps.length * 100)}%"></i></div></div>
    <div class="stage">${inner}</div>`);
  $('#x').onclick = () => { hush(); S = null; home() };
}
function advance(){ if (!S) return; S.pos++; S.pos >= S.steps.length ? finish() : step() }
const STEPS = {};
function step(){ const st = S.steps[S.pos]; STEPS[st.t](st) }
function options(x){ return shuffle([x, ...shuffle(S.pool.filter(o => o !== x)).slice(0, 3)]) }
function optsHTML(x, label, cls){
  return `<div class="opts">${options(x).map(o => `<button class="opt ${cls || ''}" data-k="${esc(o.k)}">${label(o)}</button>`).join('')}</div>`;
}
function wireOptions(x, onRight){
  let locked = false;
  $$('.opt').forEach(b => b.onclick = () => {
    if (locked || b.classList.contains('no')) return;
    if (b.dataset.k === x.k){
      locked = true; b.classList.add('ok'); ding(); petReact('ok'); onRight();
    } else {
      b.classList.add('no'); buzz(); petReact('no'); S.mistakes++;
    }
  });
}
const later = (fn, ms) => { const mine = S, pos = S.pos; setTimeout(() => { if (S === mine && S.pos === pos) fn() }, ms) };
const helper = text => `<div class="row">${petSVG(me().char, total(me()), 'small')}<p class="task" style="margin:0">${text}</p></div>`;

/* ---------- буквы ---------- */
STEPS.intro = ({x}) => {
  frame(`
    <p class="task">Новая буква! Нажимай и слушай 👂</p>
    <p class="bigletter" id="bl"><span class="up">${x.u}</span><span class="lo">${x.l}</span></p>
    <p class="ruhint">читается «${x.ru}»</p>
    <button class="wordrow" id="wr"><span class="em">${x.emoji}</span><span class="w">${markWord(x)}<small>${x.tr}</small></span></button>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#bl').onclick = $('#snd').onclick = () => say(x.u);
  $('#wr').onclick = () => say(x.word);
  $('#go').onclick = advance;
  say(x.u, x.word);
};
STEPS.listen = ({x}) => {
  frame(`
    ${helper('Послушай и найди букву')}
    <div class="center" style="margin-top:10px"><button class="btn big-round" id="snd">🔊</button></div>
    ${optsHTML(x, o => `<span class="up">${o.u}</span><span class="lo">${o.l}</span>`)}`);
  $('#snd').onclick = () => say(x.u);
  wireOptions(x, () => later(advance, 900));
  say(x.u);
};
STEPS.missing = ({x}) => {
  const i = x.word.toLowerCase().indexOf(x.l);
  const gap = filled => esc(x.word.slice(0, i)) + '<u>' + (filled ? x.word[i] : '&nbsp;') + '</u>' + esc(x.word.slice(i + 1));
  frame(`
    <p class="task">Какой буквы не хватает?</p>
    <div class="bigem" id="em">${x.emoji}</div>
    <div class="gap" id="gap">${gap(false)}</div>
    <p class="ruhint" style="margin:0">${x.tr}</p>
    ${optsHTML(x, o => `<span class="lo">${o.l}</span>`)}`);
  $('#em').onclick = () => say(x.word);
  wireOptions(x, () => { $('#gap').innerHTML = gap(true); later(() => say(x.word), 350); later(advance, 1700) });
  say(x.word);
};
STEPS.pairs = ({set}) => pairsGame('Найди пары: большая и маленькая буква',
  set.flatMap(x => [{k: x.u, s: x.u}, {k: x.u, s: x.l}]), set.length);

/* ---------- слова ---------- */
STEPS.wintro = ({x}) => {
  frame(`
    <p class="task">Новое слово! Нажимай и слушай 👂</p>
    <div class="bigem" id="em">${pic(x)}</div>
    <p class="bigword" id="bw">${esc(x.en)}</p>
    <p class="ruhint">${x.ru}</p>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#em').onclick = $('#bw').onclick = $('#snd').onclick = () => say(x.en);
  $('#go').onclick = advance;
  say(x.en);
};
STEPS.wlisten = ({x}) => {
  frame(`
    ${helper('Послушай и найди картинку')}
    <div class="center" style="margin-top:10px"><button class="btn big-round" id="snd">🔊</button></div>
    ${optsHTML(x, pic)}`);
  $('#snd').onclick = () => say(x.en);
  wireOptions(x, () => later(advance, 900));
  say(x.en);
};
STEPS.wread = ({x}) => {
  frame(`
    <p class="task">Как это по-английски?</p>
    <div class="bigem">${pic(x)}</div>
    <p class="ruhint" style="margin:0">${x.ru}</p>
    ${optsHTML(x, o => esc(o.en), 'word')}`);
  wireOptions(x, () => { later(() => say(x.en), 300); later(advance, 1600) });
};
STEPS.wpairs = ({set}) => pairsGame('Найди пары: картинка и слово',
  set.flatMap(x => [{k: x.en, s: pic(x)}, {k: x.en, s: esc(x.en), txt: true}]), set.length);

function pairsGame(title, deck, need){
  const cards = shuffle(deck);
  let open = [], done = 0, lock = false;
  frame(`
    <p class="task">${title}</p>
    <div class="pairs">${cards.map((c, i) => `<button class="pc" data-i="${i}"><span class="back">🐾</span><span class="front ${c.txt ? 'txt' : ''}">${c.s}</span></button>`).join('')}</div>`);
  $$('.pc').forEach(b => b.onclick = () => {
    if (lock || b.classList.contains('open')) return;
    b.classList.add('open'); say(cards[+b.dataset.i].k); open.push(b);
    if (open.length < 2) return;
    const [a, c] = open; open = [];
    if (cards[+a.dataset.i].k === cards[+c.dataset.i].k){
      a.classList.add('ok'); c.classList.add('ok'); ding();
      if (++done === need) later(advance, 1000);
    } else {
      lock = true;
      setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false }, 900);
    }
  });
}

function finish(){
  const p = me(), before = total(p), id = S.L.id, L = S.L;
  const stars = S.mistakes <= 1 ? 3 : S.mistakes <= 4 ? 2 : 1;
  p.stars[id] = Math.max(p.stars[id] || 0, stars);
  touchStreak(p); save();
  const after = total(p), c = myPet();
  const toy = TOYS.find(x => x.at > before && x.at <= after);
  const praise = PRAISE[3 - stars];
  S = null;
  render('finish', `
    <div class="stage" style="margin-top:24px">
      <div class="center">
        ${petSVG(p.char, after, stars >= 2 ? 'jump dance' : '')}
        <h1>${praise.en}</h1>
        <p class="sub" style="margin:0">${praise.ru}</p>
        <div class="stars">${[1, 2, 3].map(n => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
        ${toy ? `<div class="gift">🎁 Новый подарок для ${c.name}: ${toy.icon} ${toy.name}!</div>` : ''}
        <div class="row">
          <button class="btn ghost" id="again">Ещё раз</button>
          <button class="btn" id="home">Дальше →</button>
        </div>
      </div>
    </div>`);
  fanfare(); setTimeout(() => { if (screen === 'finish') say(praise.en) }, 700);
  $('#again').onclick = () => startLesson(L);
  $('#home').onclick = () => { hush(); home() };
}

/* ================= Старт ================= */
preloadPets();
function start(){ db.profiles.length ? (me() ? home() : profiles()) : addProfile(); queueSync() }
if (cloud){
  render('loading', `<div class="center" style="margin-top:60px">${petSVG('dog', 0)}<p class="sub">Загружаю…</p></div>`);
  loadCloud(() => start());
} else start();
