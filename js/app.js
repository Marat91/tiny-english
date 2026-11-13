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
const topicDone = (p, t) => t.lessons.every((_, i) => p.stars[t.id + ':' + i] > 0);
/* Первые пять тем открываются по одной после уроков алфавита, дальше — после предыдущей темы */
const topicOpen = (p, ti) => abcDone(p) >= Math.min(ti + 1, ABC.length) && (ti < 5 || topicDone(p, TOPICS[ti - 1]));
function isLocked(p, L){
  if (L.kind === 'phrase') return !(topicOpen(p, L.ti) && topicDone(p, L.t));
  if (L.kind === 'exam') return L.t ? !(topicOpen(p, L.ti) && topicDone(p, L.t)) : abcDone(p) < ABC.length;
  if (L.kind === 'abc') return L.i > 0 && !(p.stars['abc:' + (L.i - 1)] > 0);
  return !topicOpen(p, L.ti) || (L.i > 0 && !(p.stars[L.t.id + ':' + (L.i - 1)] > 0));
}
const ALL = [
  ...ABC.map((set, i) => ({id: 'abc:' + i, kind: 'abc', i, set})),
  {id: 'abc:x', kind: 'exam', set: LETTERS},
  ...TOPICS.flatMap((t, ti) => [
    ...t.lessons.map((set, i) => ({id: t.id + ':' + i, kind: 'word', t, ti, i, set})),
    {id: t.id + ':x', kind: 'exam', t, ti, set: t.lessons.flat()},
  ]),
  ...PHRASES.map((ph, i) => { const ti = TOPICS.findIndex(t => t.id === ph.topic); return {id: 'ph:' + i, kind: 'phrase', i, ph, t: TOPICS[ti], ti, set: ph.set} }),
];
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many };

/* ---------- повторение: когда какое слово показывать снова ---------- */
const GAPS = [1, 2, 4, 7, 14, 30];                       // через сколько дней повторять после каждого верного ответа
const revKey = x => x.u ? 'L:' + x.u : 'W:' + x.en;
const ITEMS = {};
LETTERS.forEach(x => { ITEMS[revKey(x)] = {x} });
TOPICS.forEach(t => t.lessons.flat().forEach(x => { ITEMS[revKey(x)] = {x, t} }));
/* Всё, что пройдено в уроках, должно быть в повторении (в том числе пройденное до появления этого режима) */
function seedRev(p){
  const m = revOf(p).m, d = dayNo(); let added = 0;
  /* по 10 в день, чтобы не вывалить на ребёнка сразу всё пройденное */
  ALL.forEach(L => { if (L.kind !== 'exam' && L.kind !== 'phrase' && p.stars[L.id] > 0) L.set.forEach(x => { const k = revKey(x); if (!m[k]) m[k] = [0, d + Math.floor(added++ / 10)] }) });
  if (added) saveRev(p);
}
function grade(p, x, ok){
  const m = revOf(p).m, k = revKey(x), box = ok ? Math.min(((m[k] || [0])[0]) + 1, GAPS.length - 1) : 0;
  m[k] = [box, dayNo() + (ok ? GAPS[box] : 1)];
}
function dueItems(p){
  const m = revOf(p).m, d = dayNo();
  return Object.keys(m).filter(k => ITEMS[k] && m[k][1] <= d).sort((a, b) => m[a][1] - m[b][1] || m[a][0] - m[b][0]);
}

/* ================= Профили ================= */
function profiles(){
  render('profiles', `
    <div class="center" style="margin-top:8px">${petSVG('dog', 0)}</div>
    <h1 class="brand">Tiny English</h1>
    <p class="sub">Кто сегодня занимается?</p>
    <div class="plist">
      ${db.profiles.map(p => `<button class="pcard" data-id="${p.id}"><span class="pedit" data-edit="${p.id}">✏️</span><span class="av">${av(p)}</span>${esc(p.name)}<small>⭐ ${total(p)} · 🔥 ${liveStreak(p)}</small></button>`).join('')}
      ${db.profiles.length < MAX_PROFILES ? '<button class="pcard add" id="add"><span class="av">➕</span>Добавить</button>' : ''}
    </div>`);
  $$('.pcard[data-id]').forEach(b => b.onclick = () => { db.cur = b.dataset.id; save(); home() });
  $$('.pedit').forEach(b => b.onclick = e => { e.stopPropagation(); addProfile(db.profiles.find(p => p.id === b.dataset.edit)) });
  if ($('#add')) $('#add').onclick = addProfile;
}

function petCards(sel){
  return `<div class="pets">${CHARACTERS.map(c =>
    `<button class="petcard ${c.id === sel ? 'sel' : ''}" data-c="${c.id}">${petSVG(c.id, 0, 'mid')}${c.name}</button>`).join('')}</div>`;
}

/* Новый ученик или (если передан edit) изменение имени, иконки и друга */
function addProfile(edit){
  /* фото из Telegram предлагаем, только если бот смог его получить (или оно уже выбрано) */
  const icons = [...(photoSrc(myPhoto) || (edit && edit.avatar === 'tg') ? ['tg'] : []), ...AVATARS];
  let pic0 = edit ? edit.avatar : AVATARS[0], ch = edit ? edit.char : CHARACTERS[0].id;
  let shot = edit && edit.avatar === 'ph' ? picOf(edit.id) : '', fresh = false;      // снимок для иконки и выбран ли он сейчас
  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const tgName = edit ? edit.name : u && !db.profiles.length ? u.first_name : '';
  render('add', `
    <h1>${edit ? 'Изменить' : 'Новый ученик'}</h1>
    <p class="sub">Выбери картинку или своё фото 📷 и напиши имя</p>
    <div class="center">
      <div class="avs"><button data-a="ph" id="cam" class="${pic0 === 'ph' ? 'sel' : ''}">${shot ? imgTag(shot) : '📷'}</button>${icons.map(a => `<button data-a="${a}" class="${a === pic0 ? 'sel' : ''}">${av(a)}</button>`).join('')}</div>
      <input type="file" id="file" accept="image/*" hidden>
      <input class="name" id="nm" maxlength="14" placeholder="Имя" value="${esc(tgName || '')}">
      <p class="sub" style="margin:8px 0 0">С кем будешь учиться?</p>
      ${petCards(ch)}
      <div class="row" style="margin-top:8px">
        ${db.profiles.length ? '<button class="btn ghost" id="back">Назад</button>' : ''}
        <button class="btn" id="ok">Готово!</button>
      </div>
    </div>`);
  const mark = a => { pic0 = a; $$('.avs button').forEach(x => x.classList.toggle('sel', x.dataset.a === a)) };
  $$('.avs button').forEach(b => b.onclick = () => b.dataset.a === 'ph' ? $('#file').click() : mark(b.dataset.a));
  $('#file').onchange = e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    shrinkPhoto(f, data => {
      if (!data || screen !== 'add') return buzz();
      shot = data; fresh = true; $('#cam').innerHTML = imgTag(data); mark('ph');
    });
  };
  $$('.petcard').forEach(b => b.onclick = () => { ch = b.dataset.c; $$('.petcard').forEach(x => x.classList.toggle('sel', x === b)); say(petById(ch).hello) });
  if ($('#back')) $('#back').onclick = profiles;
  $('#ok').onclick = () => {
    const name = $('#nm').value.trim();
    if (!name) { $('#nm').focus(); return }
    if (edit){ edit.name = name; edit.avatar = pic0; edit.char = ch; if (pic0 === 'ph' && fresh) setPic(edit.id, shot); save(); return profiles() }
    const p = {id: 'p' + Date.now(), name, avatar: pic0, char: ch, stars: {}, streak: 0, last: null};
    db.profiles.push(p); db.cur = p.id; if (pic0 === 'ph' && fresh) setPic(p.id, shot); save(); home();
  };
}

function choosePet(){
  const p = me();
  render('pet', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Выбери друга</h2><span style="width:48px"></span></div>
    <p class="sub">Звёзды и подарки останутся с тобой</p>
    ${petCards(p.char)}`);
  $('#x').onclick = () => room();
  $$('.petcard').forEach(b => b.onclick = () => { p.char = b.dataset.c; save(); room(); say(myPet().hello) });
}

/* ================= Главная ================= */
function lessonCard(p, L){
  const st = p.stars[L.id] || 0, locked = isLocked(p, L);
  if (L.kind === 'exam'){
    const medal = ['', '🥉', '🥈', '🥇'][st];
    return `<button class="lcard exam ${locked ? 'locked' : ''}" data-id="${L.id}">
      <div class="ls">${medal || '🏆'}</div>
      <div class="meta"><span class="num">Испытание</span><span class="st">${locked ? '🔒' : medal ? 'пройдено' : '▶'}</span></div>
    </button>`;
  }
  if (L.kind === 'phrase')
    return `<button class="lcard c${(L.i + 3) % 6} ${locked ? 'locked' : ''}" data-id="${L.id}">
      <div class="ls phr">${esc(L.ph.pat.replace('…', ''))}<span>${pic(L.set[0])}</span></div>
      <div class="meta"><span class="num">💬 Фразы</span>${locked ? '<span class="st">🔒</span>' : starsHTML(st)}</div>
    </button>`;
  const face = L.kind === 'abc' ? `<div class="ls">${L.set.map(x => x.u).join('')}</div>`
                                : `<div class="ls pics">${L.set.slice(0, 5).map(pic).join('')}</div>`;
  return `<button class="lcard c${L.i % 6} ${locked ? 'locked' : ''}" data-id="${L.id}">
    ${face}
    <div class="meta"><span class="num">Урок ${L.i + 1}</span>${locked ? '<span class="st">🔒</span>' : starsHTML(st)}</div>
  </button>`;
}
const starsHTML = n => `<span class="st">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

function home(){
  playAs = null;
  const p = me(); if (!p) return profiles();
  if (p.b == null) p.b = total(p) * 2;                    // тем, кто играл до появления косточек, — за уже набранные звёзды
  seedRev(p);
  const c = myPet(), t = total(p), done = abcDone(p), fed = p.fed === dayNo();
  const dueN = dueItems(p).length, learned = Object.keys(revOf(p).m).length;
  const nextToy = TOYS.find(x => x.at > t);
  const prevAt = ([...TOYS].reverse().find(x => x.at <= t) || {at: 0}).at;
  const hello = pick([[c.hello, c.helloRu], ['Hello, ' + esc(p.name) + '!', 'Привет! Поиграем?'], ["Let's play!", 'Давай играть!']]);
  render('home', `
    <div class="top">
      <button class="chip" id="who">${av(p)} ${esc(p.name)}</button>
      <span class="grow"></span>
      <span class="chip">🦴 ${bones(p)}</span>
      <span class="chip">⭐ ${t}</span>
      <span class="chip">🔥 ${liveStreak(p)}${p.fr ? ' ❄️' : ''}</span>
    </div>
    <div class="hero">
      <div class="hero-txt">
        <div class="hi">${hello[0]}</div>
        <div class="hi-ru">${hello[1]}</div>
        ${nextToy
          ? `<div class="toy">Ещё ${nextToy.at - t} ⭐ — и у ${c.name} появится ${nextToy.icon} ${nextToy.name}</div>
             <div class="toybar"><i style="width:${Math.max(4, Math.round((t - prevAt) / (nextToy.at - prevAt) * 100))}%"></i></div>`
          : `<div class="toy">У ${c.name} есть все подарки! 🎉</div>`}
        <button class="link" id="chg">${fed ? `🏠 В гости к ${c.name}` : `🦴 Покормить: ${c.name} хочет есть`}</button>
      </div>
      ${petSVG(p.char, t)}
    </div>
    ${hasSound() ? '' : '<div class="note">🔇 Звук пока не загрузился — проверь интернет и открой игру ещё раз.</div>'}
    <div class="menu">
      <button id="m-games"><i>🎮</i>Игры</button>
      <button id="m-room"><i>🏠</i>Комната</button>
      <button id="m-album"><i>📒</i>Альбом</button>
      <button id="fam"><i>🏆</i>Рейтинг</button>
    </div>
    ${dailyHTML(p)}

    ${dueN
      ? `<button class="review" id="rev"><span class="rv-ic">🔁</span><span class="rv-t"><b>Повторение</b>
           <small>${dueN} ${plural(dueN, 'слово ждёт', 'слова ждут', 'слов ждут')} тебя, пока не забылись</small></span><span class="rv-go">▶</span></button>`
      : learned ? `<div class="review done"><span class="rv-ic">✅</span><span class="rv-t"><b>Всё повторено</b><small>Новые слова для повторения появятся завтра</small></span></div>` : ''}

    <h3 class="sec">🔤 Алфавит</h3>
    <div class="grid">
      ${ALL.filter(L => L.id.startsWith('abc:')).map(L => lessonCard(p, L)).join('')}
      <button class="lcard" id="abc"><div class="ls">🔤</div><div class="meta"><span class="num">Все буквы</span><span class="st">🔊</span></div></button>
    </div>
    ${TOPICS.map((tp, ti) => {
      if (topicOpen(p, ti)) return `<h3 class="sec">${tp.icon} ${tp.title}</h3>
        <div class="grid">${ALL.filter(L => L.t === tp).map(L => lessonCard(p, L)).join('')}</div>`;
      const why = done < Math.min(ti + 1, ABC.length) ? (ti < 5 ? `после урока ${ti + 1} алфавита` : 'после всего алфавита') : `после темы «${TOPICS[ti - 1].title}»`;
      return `<div class="locked-topic"><span>${tp.icon} ${tp.title}</span><small>🔒 откроется ${why}</small></div>`;
    }).join('')}
    <div class="center" style="margin-top:30px"><button class="link" id="par">👨‍👩‍👧 Для родителей</button></div>`);
  $('#who').onclick = profiles;
  $('#chg').onclick = $('#m-room').onclick = () => room();
  $('#m-games').onclick = games;
  $('#m-album').onclick = album;
  $('#par').onclick = () => parents();
  $('#chest').onclick = () => openChest();
  $('#fam').onclick = rating;
  if ($('#rev')) $('#rev').onclick = startReview;
  $('#abc').onclick = () => alphabet();
  $('.pet').onclick = () => { petReact('ok'); say(c.hello) };
  $$('.lcard[data-id]').forEach(b => b.onclick = () => {
    if (b.classList.contains('locked')) { buzz(); petReact('no'); return }
    const L = ALL.find(x => x.id === b.dataset.id);
    L.kind === 'exam' ? startExam(L) : startLesson(L);
  });
}

/* ================= Рейтинг: все игроки, группы, напоминания ================= */
let boardTab = 'all', boardData = null;
const GROUP_IDEAS = ['Семья', 'Друзья', 'Класс'];

function localBoard(){
  return db.profiles
    .map(p => ({id: p.id, name: p.name, avatar: p.avatar, char: p.char, stars: total(p), streak: liveStreak(p), mine: true}))
    .sort((a, b) => b.stars - a.stars || b.streak - a.streak)
    .map((r, i) => ({...r, rank: i + 1}));
}
function boardHTML(rows){
  const medal = n => ['🥇','🥈','🥉'][n - 1] || n;
  let prev = 0;
  return `<div class="board">${rows.map(r => {
    const gap = prev && r.rank > prev + 1 ? '<div class="bgap">⋯</div>' : '';
    prev = r.rank;
    return `${gap}<div class="brow ${r.mine ? 'mine' : ''}">
      <span class="rk">${medal(r.rank)}</span><span class="bav">${r.id ? av(r) : av(r.avatar, r.photo)}</span>
      <span class="bn">${esc(r.name)} <small>${petById(r.char).emoji}</small></span>
      <span class="bs">⭐ ${r.stars}</span><span class="bs">🔥 ${r.streak}</span>
    </div>`}).join('') || '<p class="sub">Пока никого нет</p>'}</div>`;
}

function rating(){
  const on = online();
  const draw = () => {
    if (screen !== 'rating' && screen !== '') return;
    const groups = (srv && srv.groups) || [];
    if (boardTab !== 'all' && boardTab !== 'new' && !groups.some(g => g.code === boardTab)) boardTab = 'all';
    const g = groups.find(x => x.code === boardTab);
    const rows = !on ? localBoard() : (boardData && boardData.scope === boardTab ? boardData.rows : null);
    const tab = (id, label) => `<button class="tab ${boardTab === id ? 'on' : ''}" data-tab="${id}">${label}</button>`;

    render('rating', `
      <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Рейтинг</h2><span style="width:46px"></span></div>
      ${on ? `<div class="tabs">${tab('all', '🌍 Все')}${groups.map(x => tab(x.code, esc(x.name))).join('')}${tab('new', '＋ Группа')}</div>` : ''}

      ${boardTab === 'new' ? `
        <div class="stage">
          <p class="task">Новая группа</p>
          <p class="sub">Назови группу и позови в неё кого хочешь — у вас будет свой рейтинг</p>
          <div class="center">
            <input class="name" id="gn" maxlength="24" placeholder="Название">
            <div class="row">${GROUP_IDEAS.map(n => `<button class="chip idea">${n}</button>`).join('')}</div>
            <button class="btn" id="mk">Создать</button>
          </div>
        </div>`
      : `
        ${!on ? '' : boardTab === 'all'
          ? `<p class="sub">Все, кто учит английский в Tiny English${boardData && boardData.scope === 'all' ? ` · ${boardData.total}` : ''}</p>`
          : `<p class="sub">Участников: ${g.members} · вместе ⭐ ${rows ? rows.reduce((a, r) => a + r.stars, 0) : '…'}</p>`}
        ${rows ? boardHTML(rows) : '<p class="sub">Загружаю…</p>'}
        ${on && g ? `<div class="row" style="margin-top:18px">
            <button class="btn" id="inv">Пригласить в группу</button>
            <button class="btn ghost" id="leave">Выйти</button>
          </div>` : ''}
        ${on && srv && boardTab === 'all' && !groups.length ? `<div class="center" style="margin-top:18px;gap:10px">
            <p class="sub" style="margin:0">Хочешь свой рейтинг с семьёй или друзьями?</p>
            <button class="btn" data-tab="new">Создать группу</button></div>` : ''}`}

      ${!on ? '<div class="note">Общий рейтинг, группы и напоминания работают, когда игра открыта в Telegram.</div>'
        : !srv ? '' : `
        <h3 class="sec">⚙️ Настройки</h3>
        <div class="remind">
          <button class="chip" id="ron">${srv.remind_on ? '🔔 Напоминания включены' : '🔕 Напоминания выключены'}</button>
          ${srv.remind_on ? `<label class="chip">в <select id="rh">${Array.from({length: 24}, (_, h) => `<option value="${h}" ${h === srv.remind_hour ? 'selected' : ''}>${h}:00</option>`).join('')}</select></label>` : ''}
          <button class="chip" id="pub">${srv.public ? '🌍 Меня видно в общем рейтинге' : '🙈 Меня не видно в общем рейтинге'}</button>
        </div>
        <p class="sub" style="margin:10px 0 0;font-size:14px">Напоминание приходит от бота раз в день, если сегодня ещё не занимались. В своих группах тебя видно всегда.</p>`}`);

    $('#x').onclick = home;
    $$('[data-tab]').forEach(b => b.onclick = () => { boardTab = b.dataset.tab; draw(); load() });
    const settings = patch => call('/api/settings', {remind_on: srv.remind_on, remind_hour: srv.remind_hour, public: srv.public, ...patch});
    if ($('#ron')) $('#ron').onclick = async () => { await settings({remind_on: !srv.remind_on}); draw() };
    if ($('#rh')) $('#rh').onchange = async e => { await settings({remind_on: true, remind_hour: +e.target.value}); draw() };
    if ($('#pub')) $('#pub').onclick = async () => { await settings({public: !srv.public}); boardData = null; draw(); load() };
    $$('.idea').forEach(b => b.onclick = () => { $('#gn').value = b.textContent });
    if ($('#mk')) $('#mk').onclick = async () => {
      const name = $('#gn').value.trim();
      if (!name) { $('#gn').focus(); return }
      const r = await call('/api/group', {action: 'create', name});
      if (r && r.created){ boardTab = r.created; draw(); load(); share(srv.groups.find(x => x.code === r.created)) }
      else { buzz(); draw() }
    };
    if ($('#inv')) $('#inv').onclick = () => share(g);
    if ($('#leave')) $('#leave').onclick = async () => { await call('/api/group', {action: 'leave', code: g.code}); boardTab = 'all'; boardData = null; draw(); load() };
  };
  const share = g => {
    if (!g) return;
    const url = 'https://t.me/share/url?url=' + encodeURIComponent(g.invite) + '&text=' + encodeURIComponent(`Давай учить английский вместе в Tiny English! Заходи в группу «${g.name}»`);
    try { tg.openTelegramLink(url) } catch(e){}
  };
  const load = async () => {
    if (!on || boardTab === 'new') return;
    const want = boardTab, r = await post('/api/board', {scope: want});
    if (r && boardTab === want){ boardData = r; if (screen === 'rating') draw() }
  };
  screen = ''; draw();
  if (on) syncServer().then(() => { if (screen === 'rating'){ draw(); load() } });
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
  const steps = L.kind === 'phrase' ? [
    ...set.map(x => ({t: 'pintro', x})),
    ...shuffle(set).map(x => ({t: 'plisten', x})),
    ...shuffle(set).map(x => ({t: 'pbuild', x})),
    ...shuffle(set).map(x => ({t: 'phear', x})),
  ] : [
    ...set.map(x => ({t: T[0], x})),
    ...listen.map(x => ({t: T[1], x})),
    ...shuffle(set).map(x => ({t: T[2], x})),
    ...(L.kind === 'word' ? shuffle(set).filter(canBuild).map(x => ({t: 'wbuild', x, model: true})) : []),   // собрать слово по образцу
    {t: T[3], set},
  ];
  const pool = L.kind === 'phrase' ? set : L.kind === 'abc' ? LETTERS.slice(0, ABC_RANGES[L.i][1]) : L.t.lessons.slice(0, L.i + 1).flat();
  S = {L, mode: 'lesson', steps, pos: 0, mistakes: 0, pool, missed: new Set()};
  step();
}

/* Испытание в конце темы: все слова темы вперемешку, без подсказок. Провалить нельзя — меняется только медаль. */
function startExam(L){
  const words = !!L.t;
  const items = words ? shuffle(L.set) : shuffle(LETTERS).slice(0, 12);
  const T = words ? ['wlisten', 'wread', 'whear', 'wbuild'] : ['listen', 'missing'];
  const kind = (x, i) => { const t = T[i % T.length]; return t === 'wbuild' && !canBuild(x) ? 'whear' : t };
  S = {L, mode: 'exam', steps: items.map((x, i) => ({t: kind(x, i), x})), pos: 0, mistakes: 0, pool: L.set, missed: new Set()};
  render('lesson', `
    <div class="lbar"><button class="x" id="x">✕</button><div class="prog"><i style="width:0%"></i></div></div>
    <div class="stage"><div class="center">
      <div class="bigem">🏆</div>
      <h2 style="margin:0">Испытание: ${esc(words ? L.t.title : 'Алфавит')}</h2>
      <p class="sub" style="margin:0">${items.length} ${plural(items.length, 'вопрос', 'вопроса', 'вопросов')} по всему, что ты уже знаешь.<br>Ошибаться можно — проверим, что запомнилось!</p>
      <div class="row" style="font-size:34px;letter-spacing:6px">🥇🥈🥉</div>
      <button class="btn" id="go">Начать →</button>
    </div></div>`);
  $('#x').onclick = () => { hush(); S = null; home() };
  $('#go').onclick = step;
  task('exam');
}

/* Повторение: до 10 слов, которым пришёл срок. Верно с первого раза — слово уходит дальше, ошибка — вернётся завтра. */
function startReview(){
  const p = me(), keys = dueItems(p).slice(0, 10);
  if (!keys.length) return home();
  const m = revOf(p).m;
  const known = LETTERS.filter(x => m[revKey(x)]), letters = known.length >= 4 ? known : LETTERS.slice(0, 4);
  const steps = shuffle(keys).map(k => {
    const {x, t} = ITEMS[k], hard = m[k][0] >= 2;
    return t ? {t: pick(hard ? ['wread', 'whear', ...(canBuild(x) ? ['wbuild'] : [])] : ['wlisten', 'wread']), x, pool: t.lessons.flat()}
             : {t: pick(['listen', 'missing']), x, pool: letters.includes(x) ? letters : [...letters, x]};
  });
  S = {L: {id: 'review', kind: 'review'}, mode: 'review', steps, pos: 0, mistakes: 0, pool: [], missed: new Set(), n: keys.length,
    onAnswer(st, ok){
      if (st.rep) return;
      grade(p, st.x, ok);
      if (!ok) S.steps.push({...st, rep: true});            // ошибся — спросим ещё раз в конце
    }};
  step();
}
function frame(inner){
  render('lesson', `
    <div class="lbar"><button class="x" id="x">✕</button><div class="prog"><i style="width:${Math.round(S.pos / S.steps.length * 100)}%"></i></div></div>
    <div class="stage">${inner}</div>`);
  $('#x').onclick = () => { hush(); S = null; home() };
  const t = $('.stage .task'), key = S.cur && 'ru:' + S.cur.t;
  if (t && key && clipFor(key)){ t.classList.add('say'); t.onclick = () => say(key) }
}
/* Задание по-русски звучит один раз за урок для каждого вида задания, после паузы — английское слово */
function task(type, ...texts){
  const key = 'ru:' + type;
  S.told = S.told || new Set();
  if (!S.told.has(type) && clipFor(key)){ S.told.add(type); say(key, 350, ...texts) }
  else if (texts.length) say(...texts);
}
function advance(){ if (!S) return; S.pos++; S.pos >= S.steps.length ? finish() : step() }
const STEPS = {};
function step(){ const st = S.steps[S.pos]; S.cur = st; STEPS[st.t](st) }
function options(x){ return shuffle([x, ...shuffle((S.cur.pool || S.pool).filter(o => o !== x)).slice(0, 3)]) }
function optsHTML(x, label, cls){
  return `<div class="opts">${options(x).map(o => `<button class="opt ${cls || ''}" data-k="${esc(o.k)}">${label(o)}</button>`).join('')}</div>`;
}
function wireOptions(x, onRight){
  let locked = false, missed = false;
  $$('.opt').forEach(b => b.onclick = () => {
    if (locked || b.classList.contains('no')) return;
    if (b.dataset.k === x.k){
      locked = true; b.classList.add('ok'); ding(); petReact('ok');
      track(me(), revKey(x), !missed);
      if (S.onAnswer) S.onAnswer(S.cur, !missed);
      onRight();
    } else {
      missed = true; b.classList.add('no'); buzz(); petReact('no'); S.mistakes++; S.missed.add(revKey(x));
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
  task('intro', x.u, x.word);
};
STEPS.listen = ({x}) => {
  frame(`
    ${helper('Послушай и найди букву')}
    <div class="center" style="margin-top:10px"><button class="btn big-round" id="snd">🔊</button></div>
    ${optsHTML(x, o => `<span class="up">${o.u}</span><span class="lo">${o.l}</span>`)}`);
  $('#snd').onclick = () => say(x.u);
  wireOptions(x, () => later(advance, 900));
  task('listen', x.u);
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
  task('missing', x.word);
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
  task('wintro', x.en);
};
STEPS.wlisten = STEPS.plisten = ({x, t}) => {
  frame(`
    ${helper(t === 'plisten' ? 'Послушай фразу и найди картинку' : 'Послушай и найди картинку')}
    <div class="center" style="margin-top:10px"><button class="btn big-round" id="snd">🔊</button></div>
    ${optsHTML(x, pic)}`);
  $('#snd').onclick = () => say(x.en);
  wireOptions(x, () => later(advance, 900));
  task(t, x.en);
};
STEPS.wread = ({x}) => {
  frame(`
    <p class="task">Как это по-английски?</p>
    <div class="bigem">${pic(x)}</div>
    <p class="ruhint" style="margin:0">${x.ru}</p>
    ${optsHTML(x, o => esc(o.en), 'word')}`);
  wireOptions(x, () => { later(() => say(x.en), 300); later(advance, 1600) });
  task('wread');
};
STEPS.whear = STEPS.phear = ({x, t}) => {
  frame(`
    ${helper(t === 'phear' ? 'Послушай и выбери фразу' : 'Послушай и выбери слово')}
    <div class="center" style="margin-top:10px"><button class="btn big-round" id="snd">🔊</button></div>
    ${optsHTML(x, o => esc(o.en), t === 'phear' ? 'word phr' : 'word')}`);
  $('#snd').onclick = () => say(x.en);
  wireOptions(x, () => later(advance, 900));
  task(t, x.en);
};

/* ---------- фразы ---------- */
STEPS.pintro = ({x}) => {
  frame(`
    <p class="task">Новая фраза! Послушай и повтори вслух 🗣️</p>
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="bigword phr" id="bw">${esc(x.en.slice(0, -x.w.length))}<b>${esc(x.w)}</b></p>
    <p class="ruhint">${x.ru}</p>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#em').onclick = $('#bw').onclick = $('#snd').onclick = () => say(x.en);
  $('#go').onclick = advance;
  task('pintro', x.en);
};

/* ---------- собери слово из букв или фразу из слов ---------- */
const canBuild = x => { const n = x.en.replace(/[^a-z]/gi, '').length; return n >= 2 && n <= 8 };
STEPS.wbuild = STEPS.pbuild = st => {
  const x = st.x, words = st.t === 'pbuild';
  const parts = words ? x.en.split(' ') : [...x.en];
  const need = parts.map((s, i) => ({s, i})).filter(o => words || /[a-z]/i.test(o.s));     // пробелы и дефисы стоят на месте
  let tiles = shuffle(need.map(o => o.s));
  for (let k = 0; k < 20 && need.length > 1 && tiles.every((s, i) => s === need[i].s); k++) tiles = shuffle(tiles);
  let pos = 0, missed = false;
  frame(`
    <p class="task">${words ? 'Собери фразу' : 'Собери слово'}</p>
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="ruhint" style="margin-bottom:6px">${x.ru}</p>
    ${st.model ? `<p class="model">${esc(x.en)}</p>` : ''}
    <div class="slots ${words ? 'w' : ''}">${parts.map((s, i) => words || /[a-z]/i.test(s)
      ? `<span class="sl" data-i="${i}"></span>` : `<span class="fx">${s === ' ' ? '&nbsp;' : esc(s)}</span>`).join('')}</div>
    <div class="tiles ${words ? 'w' : ''}">${tiles.map(s => `<button class="tile" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>`);
  $('#em').onclick = () => say(x.en);
  $$('.tile').forEach(b => b.onclick = () => {
    if (b.classList.contains('used') || pos >= need.length) return;
    const want = need[pos];
    if (b.dataset.s.toLowerCase() !== want.s.toLowerCase()){
      b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); buzz();
      if (!missed){ missed = true; S.mistakes++; S.missed.add(revKey(x)); petReact('no') }
      return;
    }
    const slot = $(`.sl[data-i="${want.i}"]`);
    slot.textContent = want.s; slot.classList.add('on'); b.classList.add('used'); pos++;
    if (pos < need.length){ tone(480 + pos * 45, .12); return }
    ding(); petReact('ok'); $('.slots').classList.add('ok');
    track(me(), revKey(x), !missed);
    if (S.onAnswer) S.onAnswer(S.cur, !missed);
    later(() => say(x.en), 300); later(advance, 1800);
  });
  task(st.t, x.en);
};
STEPS.wpairs = ({set}) => pairsGame('Найди пары: картинка и слово',
  set.flatMap(x => [{k: x.en, s: pic(x)}, {k: x.en, s: esc(x.en), txt: true}]), set.length);

function pairsGame(title, deck, need){
  const cards = shuffle(deck);
  let open = [], done = 0, lock = false;
  frame(`
    <p class="task">${title}</p>
    <div class="pairs">${cards.map((c, i) => `<button class="pc" data-i="${i}"><span class="back">🐾</span><span class="front ${c.txt ? 'txt' : ''}">${c.s}</span></button>`).join('')}</div>`);
  task(S.cur.t);
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
  if (S.mode === 'duel'){ const r = {score: S.right, ms: Date.now() - S.t0}, done = S.done; S = null; hush(); return done(r) }
  const p = me(), before = total(p), L = S.L, mode = S.mode, m = revOf(p).m, tomorrow = dayNo() + 1, had = stickerSet(p);
  let stars = 0, head, sub, big, again, got = 3;

  if (mode === 'review'){
    const n = S.n; dayMark(p, 'r');
    head = PRAISE[1].en; sub = `Повторено: ${n} ${plural(n, 'слово', 'слова', 'слов')}`;
    big = '<div class="bigem" style="font-size:clamp(54px,11vw,82px)">🔁✨</div>';
    stars = 3; again = dueItems(p).length ? startReview : null;
  } else {
    stars = mode === 'exam' ? (S.mistakes <= 1 ? 3 : S.mistakes <= 3 ? 2 : 1) : (S.mistakes <= 1 ? 3 : S.mistakes <= 4 ? 2 : 1);
    p.stars[L.id] = Math.max(p.stars[L.id] || 0, stars);
    got = stars * (mode === 'exam' ? 3 : 2); dayMark(p, 'l');
    if (mode === 'lesson' && L.kind === 'phrase'){}                 // фразы в повторение не попадают
    else if (mode === 'lesson') L.set.forEach(x => { const k = revKey(x); if (!m[k] || S.missed.has(k)) m[k] = [0, tomorrow] });
    else S.missed.forEach(k => { m[k] = [0, tomorrow] });   // в испытании ошибся — слово вернётся в повторение
    head = PRAISE[3 - stars].en; sub = PRAISE[3 - stars].ru;
    big = mode === 'exam'
      ? `<div class="bigem medal">${['', '🥉', '🥈', '🥇'][stars]}</div>${stars < 3 ? '<p class="sub" style="margin:0">Золото — если ошибиться не больше одного раза</p>' : ''}`
      : `<div class="stars">${[1, 2, 3].map(n => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>`;
    again = mode === 'exam' ? () => startExam(L) : () => startLesson(L);
  }
  earn(p, got);
  saveRev(p); saveStat(p); touchStreak(p); save();
  const after = total(p), c = myPet();
  const toy = TOYS.find(x => x.at > before && x.at <= after);
  const fresh = newStickers(p, had);
  S = null;
  render('finish', `
    <div class="stage" style="margin-top:24px">
      <div class="center">
        ${petSVG(p.char, after, stars >= 2 ? 'jump dance' : '')}
        <h1>${head}</h1>
        <p class="sub" style="margin:0">${sub}</p>
        ${big}
        <div class="earned">+${got} 🦴</div>
        ${toy ? `<div class="gift">🎁 Новый подарок для ${c.name}: ${toy.icon} ${toy.name}!</div>` : ''}
        ${fresh.map(s => `<div class="gift">📒 ${s.gold ? 'Наклейка стала золотой' : 'Новая наклейка'}: ${s.icon} ${esc(s.name)}!</div>`).join('')}
        <div class="row">
          ${again ? `<button class="btn ghost" id="again">${mode === 'review' ? 'Ещё повторить' : 'Ещё раз'}</button>` : ''}
          <button class="btn" id="home">Дальше →</button>
        </div>
      </div>
    </div>`);
  fanfare(); setTimeout(() => { if (screen === 'finish') say(head) }, 700);
  if (again) $('#again').onclick = again;
  $('#home').onclick = () => { hush(); home() };
}

/* ================= Старт ================= */
preloadPets();
function start(){
  db.profiles.length ? (me() ? home() : profiles()) : addProfile(); queueSync() }
if (cloud){
  render('loading', `<div class="center" style="margin-top:60px">${petSVG('dog', 0)}<p class="sub">Загружаю…</p></div>`);
  loadCloud(() => loadCloudRev(start));
} else start();
