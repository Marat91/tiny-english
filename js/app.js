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
const topicOpen = (p, ti) => TOPICS[ti].holiday
  ? nyOn() || TOPICS[ti].lessons.some((_, i) => p.stars[TOPICS[ti].id + ':' + i] > 0)          // праздничная: во время события или если уже начата
  : abcDone(p) >= Math.min(ti + 1, ABC.length) && (ti < 5 || topicDone(p, TOPICS[ti - 1]));
/* Новогоднее событие: с NY.from по NY.to (месяц с нуля, число). ?ny=1 в адресе — включить для проверки */
function nyOn(){
  if (/[?&]ny=1/.test(location.search)) return true;
  const d = new Date(), m = d.getMonth(), n = d.getDate();
  return (m === NY.from[0] && n >= NY.from[1]) || (m === NY.to[0] && n <= NY.to[1]);
}
const advDay = () => { const d = new Date(); return d.getMonth() === 11 || /[?&]ny=1/.test(location.search) ? Math.min(31, d.getDate()) : 0 };
function isLocked(p, L){
  if (['phrase', 'dialog', 'story', 'gram', 'rhyme'].includes(L.kind)) return !(topicOpen(p, L.ti) && topicDone(p, L.t));
  if (L.kind === 'read') return abcDone(p) < ABC.length || (L.i > 0 && !(p.stars['rd:' + (L.i - 1)] > 0));
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
  ...READ.map((set, i) => ({id: 'rd:' + i, kind: 'read', i, set})),
  ...DIALOGS.map((d, i) => { const ti = TOPICS.findIndex(t => t.id === d.after); return {id: 'dl:' + i, kind: 'dialog', i, d, t: TOPICS[ti], ti, set: d.set} }),
  ...STORIES.map((st, i) => { const ti = TOPICS.findIndex(t => t.id === st.after); return {id: 'st:' + i, kind: 'story', i, st, t: TOPICS[ti], ti, set: st.quiz.map(q => q.x)} }),
  ...GRAMMAR.map((g, i) => { const ti = TOPICS.findIndex(t => t.id === g.after); return {id: 'gr:' + i, kind: 'gram', i, g, t: TOPICS[ti], ti, set: g.set} }),
  ...RHYMES.map((r, i) => { const ti = TOPICS.findIndex(t => t.id === r.after); return {id: 'rh:' + i, kind: 'rhyme', i, r, t: TOPICS[ti], ti, set: []} }),
];
/* Уроки, слова из которых не попадают в повторение */
const noReview = L => L.kind !== 'abc' && L.kind !== 'word';
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
  ALL.forEach(L => { if (!noReview(L) && p.stars[L.id] > 0) L.set.forEach(x => { const k = revKey(x); if (!m[k]) m[k] = [0, d + Math.floor(added++ / 10)] }) });
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
  if (L.kind === 'read')
    return `<button class="lcard c${(L.i + 1) % 6} ${locked ? 'locked' : ''}" data-id="${L.id}">
      <div class="ls phr">${[...new Set(L.set.map(x => '-' + x.fam))].join(' ')}<span>${L.set.slice(0, 2).map(pic).join('')}</span></div>
      <div class="meta"><span class="num">📖 Чтение ${L.i + 1}</span>${locked ? '<span class="st">🔒</span>' : starsHTML(st)}</div>
    </button>`;
  const sp = {dialog: ['🗨️ Разговор', L.d], story: ['📚 История', L.st], gram: ['🧩 Грамматика', L.g], rhyme: ['🎵 Стишок', L.r]}[L.kind];
  if (sp)
    return `<button class="lcard c${(L.i + 4) % 6} ${locked ? 'locked' : ''}" data-id="${L.id}">
      <div class="ls phr">${esc(sp[1].title)}<span>${sp[1].icon}</span></div>
      <div class="meta"><span class="num">${sp[0]}</span>${locked ? '<span class="st">🔒</span>' : starsHTML(st)}</div>
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
  const c = myPet(), t = total(p), done = abcDone(p), q = petOf(p), gifts = myGifts(p).length;
  const goal = SHOP.find(i => i.id === p.goal && !owns(p, i.id)), low = q.f < 35 ? gw(c, 'голоден', 'голодна') : q.m < 35 ? 'скучает' : q.e < 35 ? gw(c, 'устал', 'устала') : '';
  const dueN = dueItems(p).length, learned = Object.keys(revOf(p).m).length;
  const hello = pick([[c.hello, c.helloRu], ['Hello, ' + esc(p.name) + '!', 'Привет! Поиграем?'], ["Let's play!", 'Давай играть!']]);
  render('home', `
    ${nyOn() ? snowHTML() : ''}
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
        ${petBars(p)}
        ${goal ? `<div class="toy">Коплю на ${goal.icon} ${esc(goal.en)}: ${Math.min(bones(p), goal.price)} из ${goal.price} 🦴</div>
             <div class="toybar"><i style="width:${Math.min(100, Math.max(4, Math.round(bones(p) / goal.price * 100)))}%"></i></div>` : ''}
        <button class="link" id="chg">${low ? `⚠️ ${c.name} ${low} — нужна твоя забота` : `🏠 ${c.name} · ${stageName(c, stageNo(p))}`}</button>
      </div>
      ${myPetHTML(p)}
    </div>
    ${hasSound() ? '' : '<div class="note">🔇 Звук пока не загрузился — проверь интернет и открой игру ещё раз.</div>'}
    <div class="menu">
      <button id="m-games"><i>🎮</i>Игры</button>
      <button id="m-room"><i>🏠</i>Комната</button>
      <button id="m-album"><i>📒</i>Альбом</button>
      <button id="fam"><i>🏆</i>Рейтинг</button>
      <button id="m-map"><i>🗺️</i>Карта</button>
    </div>
    ${nyBanner(p)}${focusBanner(p)}
    ${gifts ? `<button class="review giftb" id="gift"><span class="rv-ic">🎁</span><span class="rv-t"><b>Тебе подарок!</b><small>${gifts > 1 ? `Тебя ждут ${gifts} ${plural(gifts, 'подарок', 'подарка', 'подарков')}` : 'Нажми, чтобы открыть'}</small></span><span class="rv-go">▶</span></button>` : ''}
    ${dailyHTML(p)}

    ${dueN
      ? `<button class="review" id="rev"><span class="rv-ic">🔁</span><span class="rv-t"><b>Повторение</b>
           <small>${dueN} ${plural(dueN, 'слово ждёт', 'слова ждут', 'слов ждут')} тебя, пока не забылись</small></span><span class="rv-go">▶</span></button>`
      : learned ? `<div class="review done"><span class="rv-ic">✅</span><span class="rv-t"><b>Всё повторено</b><small>Новые слова для повторения появятся завтра</small></span></div>` : ''}

    <h3 class="sec">🔤 Алфавит</h3>
    <div class="grid">
      ${ALL.filter(L => L.id.startsWith('abc:')).map(L => lessonCard(p, L)).join('')}
      <button class="lcard" id="abc"><div class="ls">🔤</div><div class="meta"><span class="num">Все буквы</span><span class="st">🔊</span></div></button>
      ${done ? `<button class="lcard c2" id="trc"><div class="ls">✍️</div><div class="meta"><span class="num">Прописи</span>${starsHTML(p.stars.trace || 0)}</div></button>` : ''}
    </div>
    ${done >= ABC.length ? `<h3 class="sec">📖 Учимся читать</h3>
      <div class="grid">${ALL.filter(L => L.kind === 'read').map(L => lessonCard(p, L)).join('')}</div>`
      : `<div class="locked-topic"><span>📖 Учимся читать</span><small>🔒 откроется после всего алфавита</small></div>`}
    ${TOPICS.map((tp, ti) => {
      if (tp.holiday && !topicOpen(p, ti)) return '';
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
  if ($('#gift')) $('#gift').onclick = giftOpen;
  $('#fam').onclick = rating;
  if ($('#rev')) $('#rev').onclick = startReview;
  $('#abc').onclick = () => alphabet();
  $('#m-map').onclick = worldMap;
  if ($('#trc')) $('#trc').onclick = startTrace;
  if ($('#ny')) $('#ny').onclick = advent;
  if ($('#focus')) $('#focus').onclick = () => topicScreen(p.plan.f);
  $('.pet').onclick = () => { petReact('ok'); say(c.hello) };
  wireCards();
}
function wireCards(){
  $$('.lcard[data-id]').forEach(b => b.onclick = () => {
    if (b.classList.contains('locked')) { buzz(); petReact('no'); return }
    const L = ALL.find(x => x.id === b.dataset.id);
    L.kind === 'exam' ? startExam(L) : startLesson(L);
  });
}

/* ================= Новогоднее событие ================= */
function snowHTML(){
  return `<div class="snow" aria-hidden="true">${Array.from({length: 16}, (_, i) =>
    `<i style="left:${(i * 37) % 100}%;animation-delay:-${(i * 1.3) % 9}s;animation-duration:${8 + i % 5}s;font-size:${10 + (i % 4) * 5}px">❄</i>`).join('')}</div>`;
}
const lessonToday = p => !!(today(p).ln || today(p).l);
function nyBanner(p){
  if (!nyOn()) return '';
  const dd = advDay(), opened = (p.adv || []).includes(dd);
  const text = !dd ? 'Праздничная тема, история и украшения' : opened ? 'Окошко на сегодня открыто. Приходи завтра!'
    : lessonToday(p) ? 'Можно открыть окошко календаря! 🎁' : 'Пройди урок — и откроется окошко календаря';
  return `<button class="review ny ${dd && !opened && lessonToday(p) ? 'giftb' : ''}" id="ny"><span class="rv-ic">🎄</span><span class="rv-t"><b>Новый год!</b><small>${text}</small></span><span class="rv-go">▶</span></button>`;
}
function advent(){
  const p = me(), dd = advDay(), got = p.adv || (p.adv = []), t = TOPICS.find(x => x.holiday);
  const cell = n => {
    const big = NY.big[n], item = big && SHOP.find(s => s.id === big), open = got.includes(n);
    const cls = open ? 'open' : n === dd ? (lessonToday(p) ? 'ready' : 'today') : n < dd ? 'miss' : 'wait';
    return `<button class="adv ${cls} ${big ? 'big' : ''}" data-n="${n}"><b>${n}</b><i>${open ? (item ? item.icon : '🦴') : n < dd ? '❄️' : big ? '🎁' : ''}</i></button>`;
  };
  render('advent', `
    ${snowHTML()}
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">🎄 Новый год</h2><span class="chip">🦴 ${bones(p)}</span></div>
    ${dd ? `<p class="sub">Каждый день декабря — новое окошко. Пройди любой урок, и окошко дня откроется. В больших окошках — украшения для комнаты!</p>
      <div class="advent">${Array.from({length: 31}, (_, i) => cell(i + 1)).join('')}</div>`
      : '<p class="sub">Календарь был в декабре. Праздничная тема открыта до 10 января!</p>'}
    <h3 class="sec">${t.icon} ${t.title}</h3>
    <div class="grid">${ALL.filter(L => L.t === t).map(L => lessonCard(p, L)).join('')}</div>
    <div class="center" style="margin-top:18px"><button class="btn ghost" id="shop">🛍️ Праздничные украшения</button></div>`);
  $('#x').onclick = home;
  $('#shop').onclick = () => room('shop');
  wireCards();
  if (!advent.told){ advent.told = 1; say('ru:advent') }
  $$('.adv').forEach(b => b.onclick = () => {
    const n = +b.dataset.n;
    if (n !== dd || got.includes(n)) return n < dd || got.includes(n) ? say('Happy New Year') : buzz();
    if (!lessonToday(p)){ buzz(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return }
    got.push(n);
    const big = NY.big[n], item = big && SHOP.find(s => s.id === big), give = item && !owns(p, item.id);
    if (give) p.own = [...(p.own || []), item.id]; else earn(p, NY.bones);
    save();
    render('chest', `
      ${snowHTML()}
      <div class="stage" style="margin-top:24px"><div class="center">
        <div class="bigem medal">${give ? item.icon : '🎁'}</div>
        <h1>${n} декабря</h1>
        <div class="earned big">${give ? `${esc(item.en)} — ${item.ru}! Уже стоит в комнате` : `+${NY.bones} 🦴`}</div>
        <p class="sub" style="margin:0">Завтра откроется новое окошко</p>
        <button class="btn" id="go">Ура! →</button>
      </div></div>`);
    fanfare(); setTimeout(() => { if (screen === 'chest') say(give ? item.en : 'Happy New Year') }, 600);
    $('#go').onclick = advent;
  });
}
/* Совет родителей на главном экране */
function focusBanner(p){
  const f = p.plan && p.plan.f, ti = TOPICS.findIndex(t => t.id === f);
  if (ti < 0 || !topicOpen(p, ti) || p.stars[f + ':x'] > 0) return '';
  return `<button class="review focus" id="focus"><span class="rv-ic">${TOPICS[ti].icon}</span><span class="rv-t"><b>Совет на сегодня</b><small>Тема «${esc(TOPICS[ti].title)}» — так решили родители</small></span><span class="rv-go">▶</span></button>`;
}

/* ================= Карта путешествия ================= */
function mapNodes(p){
  const nodes = [
    {key: 'abc', icon: '🔤', title: 'Алфавит', ids: ABC.map((_, i) => 'abc:' + i), open: true},
    {key: 'read', icon: '📖', title: 'Учимся читать', ids: READ.map((_, i) => 'rd:' + i), open: abcDone(p) >= ABC.length},
    ...TOPICS.map((t, ti) => ({key: t.id, icon: t.icon, title: t.title, ids: t.lessons.map((_, i) => t.id + ':' + i), open: topicOpen(p, ti), holiday: t.holiday}))
      .filter(n => !n.holiday || n.open),
  ];
  nodes.forEach(n => { n.done = n.ids.every(id => p.stars[id] > 0); n.stars = n.ids.reduce((a, id) => a + (p.stars[id] || 0), 0) });
  return nodes;
}
function worldMap(){
  const p = me(), nodes = mapNodes(p), cur = nodes.findIndex(n => n.open && !n.done && !n.holiday);
  render('map', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">🗺️ Карта</h2><span class="chip">⭐ ${total(p)}</span></div>
    <p class="sub">${nodes.filter(n => n.done).length} из ${nodes.length} островов пройдено. Нажми на остров, чтобы открыть уроки</p>
    <div class="map">${nodes.map((n, i) => `<div class="mrow ${i % 2 ? 'r' : ''}" style="--x:${Math.round(50 + 28 * Math.sin(i * 1.15))}%">
      <button class="mnode ${n.done ? 'done' : n.open ? 'open' : 'locked'} ${i === cur ? 'cur' : ''}" data-k="${n.key}">
        <i>${n.open ? n.icon : '🔒'}</i>${i === cur ? `<span class="mpet">${myPetHTML(p, 'small')}</span>` : ''}${n.done ? '<em>✓</em>' : ''}</button>
      <span class="mlabel">${esc(n.title)}<small>${n.open ? '⭐ ' + n.stars + ' / ' + n.ids.length * 3 : 'закрыто'}</small></span></div>`).join('')}</div>`);
  $('#x').onclick = home;
  $$('.mnode').forEach(b => b.onclick = () => b.classList.contains('locked') ? buzz() : topicScreen(b.dataset.k));
  const c = $('.mnode.cur'); if (c && c.scrollIntoView) setTimeout(() => c.scrollIntoView({block: 'center', behavior: 'smooth'}), 60);
}
function topicScreen(key){
  const p = me(), t = TOPICS.find(x => x.id === key);
  if (!t && key !== 'abc' && key !== 'read') return home();
  const list = key === 'abc' ? ALL.filter(L => L.id.startsWith('abc:')) : key === 'read' ? ALL.filter(L => L.kind === 'read') : ALL.filter(L => L.t === t);
  render('topic', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">${key === 'abc' ? '🔤 Алфавит' : key === 'read' ? '📖 Учимся читать' : t.icon + ' ' + esc(t.title)}</h2><span class="chip">⭐ ${total(p)}</span></div>
    <div class="grid" style="margin-top:14px">${list.map(L => lessonCard(p, L)).join('')}</div>`);
  $('#x').onclick = worldMap;
  wireCards();
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
  return `<div class="board">${rows.map((r, k) => {
    const gap = prev && r.rank > prev + 1 ? '<div class="bgap">⋯</div>' : '';
    prev = r.rank;
    return `${gap}<div class="brow ${r.mine ? 'mine' : ''} ${r.ref && !r.mine ? 'tap' : ''}" ${r.ref && !r.mine ? `data-ref="1" data-k="${k}"` : ''}>
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
        ${on && g && rows && rows.length > 1 ? '<p class="sub" style="margin:10px 0 0;font-size:14px">Нажми на участника, чтобы зайти в гости или сделать подарок</p>' : ''}
        ${on && g && boardData && boardData.scope === boardTab ? socialHTML(boardData) : ''}
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
    if (on && g && boardData && boardData.scope === boardTab) wireSocial(g, boardData, draw);
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
  if (L.kind === 'trace') return startTrace();
  const set = L.set;
  let listen = shuffle([...set, ...set]);
  for (let k = 0; k < 30 && listen.some((x, j) => j && x === listen[j - 1]); k++) listen = shuffle(listen);
  const T = L.kind === 'abc' ? ['intro', 'listen', 'missing', 'pairs'] : ['wintro', 'wlisten', 'wread', 'wpairs'];
  const fam = x => set.filter(o => o.fam === x.fam);
  const steps = L.kind === 'gram' ? [
    ...set.map(x => ({t: 'gintro', x})),
    ...shuffle(set).map(x => ({t: 'wlisten', x})),
    ...shuffle(set).map(x => ({t: 'gfill', x})),
    {t: 'speak', x: pick(set)},
  ] : L.kind === 'rhyme' ? [
    {t: 'rhyme', r: L.r},
    ...shuffle(L.r.lines).slice(0, 3).map(line => ({t: 'rgap', line, r: L.r})),
  ] : L.kind === 'read' ? [
    ...set.map(x => ({t: 'rintro', x})),
    ...shuffle(set).map(x => ({t: 'rread', x})),
    ...shuffle(set).map(x => ({t: 'rfirst', x})),
    ...shuffle(set).slice(0, 4).map(x => ({t: 'rhear', x, pool: fam(x).length >= 3 ? fam(x) : set})),
  ] : L.kind === 'dialog' ? [
    ...set.map(x => ({t: 'dintro', x})),
    ...shuffle(set).map(x => ({t: 'dpick', x})),
    ...shuffle(set).slice(0, 2).map(x => ({t: 'speak', x})),
    ...shuffle(set).map(x => ({t: 'dbuild', x})),
  ] : L.kind === 'story' ? [
    ...L.st.pages.map((pg, i) => ({t: 'spage', pg, i, st: L.st})),
    ...L.st.quiz.map(q => ({t: 'squiz', q, x: q.x, pool: q.opts})),
  ] : L.kind === 'phrase' ? [
    ...set.map(x => ({t: 'pintro', x})),
    ...shuffle(set).map(x => ({t: 'plisten', x})),
    ...shuffle(set).slice(0, 2).map(x => ({t: 'speak', x})),
    ...shuffle(set).map(x => ({t: 'pbuild', x})),
    ...shuffle(set).map(x => ({t: 'phear', x})),
  ] : [
    ...set.map(x => ({t: T[0], x})),
    ...listen.map(x => ({t: T[1], x})),
    ...shuffle(set).map(x => ({t: T[2], x})),
    ...(L.kind === 'abc' ? set.map(x => ({t: 'trace', x})) : []),                                           // обвести букву пальцем
    ...(L.kind === 'word' ? shuffle(set).filter(canBuild).map(x => ({t: 'wbuild', x, model: true})) : []),   // собрать слово по образцу
    ...(L.kind === 'word' ? [{t: 'speak', x: pick(set)}] : []),                                               // сказать слово самому
    {t: T[3], set},
  ];
  const pool = ['phrase', 'read', 'dialog', 'gram'].includes(L.kind) ? set : L.kind === 'story' || L.kind === 'rhyme' ? [] : L.kind === 'abc' ? LETTERS.slice(0, ABC_RANGES[L.i][1]) : L.t.lessons.slice(0, L.i + 1).flat();
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
const helper = text => `<div class="row">${myPetHTML(me(), 'small')}<p class="task" style="margin:0">${text}</p></div>`;

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

/* ---------- учимся читать ---------- */
const readWord = x => `<span>${esc(x.en.slice(0, -x.fam.length))}</span><b>${esc(x.fam)}</b>`;
STEPS.rintro = ({x}) => {
  frame(`
    <p class="task">Читаем! Нажимай и слушай 👂</p>
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="bigword read" id="bw">${readWord(x)}</p>
    <p class="ruhint">${x.ru}</p>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#em').onclick = $('#bw').onclick = $('#snd').onclick = () => say(x.en);
  $('#go').onclick = advance;
  task('rintro', x.en);
};
/* Слово без звука: ребёнок читает сам и находит картинку */
STEPS.rread = ({x}) => {
  frame(`
    <p class="task">Прочитай и найди картинку</p>
    <p class="bigword read">${readWord(x)}</p>
    ${optsHTML(x, pic)}`);
  wireOptions(x, () => { later(() => say(x.en), 300); later(advance, 1500) });
  task('rread');
};
/* Первая буква: картинка и окончание, нужно подставить начало */
STEPS.rfirst = ({x}) => {
  const head = x.en.slice(0, -x.fam.length), right = {...x, k: head};
  const others = shuffle([...new Set([...S.pool.map(o => o.en.slice(0, -o.fam.length)), ...'bcdfhmnprst'])].filter(h => h !== head)).slice(0, 3);
  const gap = filled => `<u>${filled ? esc(head) : '&nbsp;'}</u>${esc(x.fam)}`;
  frame(`
    <p class="task">Какая буква в начале?</p>
    <div class="bigem" id="em">${pic(x)}</div>
    <div class="gap" id="gap">${gap(false)}</div>
    <p class="ruhint" style="margin:0">${x.ru}</p>
    <div class="opts">${shuffle([head, ...others]).map(h => `<button class="opt" data-k="${esc(h)}"><span class="lo">${esc(h)}</span></button>`).join('')}</div>`);
  $('#em').onclick = () => say(x.en);
  wireOptions(right, () => { $('#gap').innerHTML = gap(true); later(() => say(x.en), 300); later(advance, 1600) });
  task('rfirst', x.en);
};
STEPS.rhear = ({x}) => {
  frame(`
    ${helper('Послушай и найди слово')}
    <div class="center" style="margin-top:10px"><button class="btn big-round" id="snd">🔊</button></div>
    ${optsHTML(x, o => esc(o.en), 'word')}`);
  $('#snd').onclick = () => say(x.en);
  wireOptions(x, () => later(advance, 900));
  task('rhear', x.en);
};

/* ---------- разговор: вопрос и ответ ---------- */
const qBubble = x => `<div class="talk"><span class="who">${myPetHTML(me(), 'small')}</span><button class="bubble q" id="dq">${esc(x.q)}<small>${esc(x.qru)}</small></button></div>`;
STEPS.dintro = ({x}) => {
  frame(`
    <p class="task">Вопрос и ответ 💬</p>
    ${qBubble(x)}
    <div class="bigem sm" id="em">${pic(x)}</div>
    <div class="talk me"><button class="bubble a" id="da">${esc(x.en)}<small>${esc(x.ru)}</small></button><span class="who">${av(me())}</span></div>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#dq').onclick = () => say(x.q);
  $('#da').onclick = $('#em').onclick = () => say(x.en);
  $('#snd').onclick = () => say(x.q, 500, x.en);
  $('#go').onclick = advance;
  task('dintro', x.q, 500, x.en);
};
STEPS.dpick = ({x}) => {
  frame(`
    <p class="task">Что ответить?</p>
    ${qBubble(x)}
    <div class="bigem sm">${pic(x)}</div>
    ${optsHTML(x, o => esc(o.en), 'word phr')}`);
  $('#dq').onclick = () => say(x.q);
  wireOptions(x, () => { later(() => say(x.en), 300); later(advance, 1700) });
  task('dpick', x.q);
};

/* ---------- истории ---------- */
STEPS.spage = ({pg, i, st}) => {
  frame(`
    ${i === 0 ? `<p class="task">📚 ${esc(st.title)} <small class="ruhint">${esc(st.ru)}</small></p>` : '<p class="task">📚</p>'}
    <div class="page">
      <div class="bigem" id="em">${pg.e}</div>
      <button class="bigword phr story" id="bw">${esc(pg.en)}</button>
      <p class="ruhint">${esc(pg.ru)}</p>
    </div>
    <div class="dots">${st.pages.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#em').onclick = $('#bw').onclick = $('#snd').onclick = () => say(pg.en);
  $('#go').onclick = advance;
  task('spage', pg.en);
};
STEPS.squiz = ({q, x}) => {
  frame(`
    <p class="task">Вопрос по истории</p>
    <button class="bubble q wide" id="dq">${esc(q.q)}<small>${esc(q.qru)}</small></button>
    ${optsHTML(x, o => `${pic(o)}<small class="cap">${esc(o.en)}</small>`)}`);
  $('#dq').onclick = () => say(q.q);
  wireOptions(x, () => { later(() => say(x.en), 300); later(advance, 1500) });
  task('squiz', q.q);
};

/* ---------- скажи сам: запись голоса и сравнение с образцом ---------- */
let micOff = false;
const canRec = () => !micOff && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
STEPS.speak = st => {
  const x = st.x, rec0 = canRec();
  frame(`
    <p class="task">Скажи сам 🗣️</p>
    ${x.q ? qBubble(x) : ''}
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="bigword phr" id="bw">${esc(x.en)}</p>
    <p class="ruhint" style="margin-bottom:8px">${x.ru}</p>
    <div class="row">
      <button class="btn round ghost" id="snd">🔊</button>
      ${rec0 ? '<button class="btn round mic" id="mic">🎙️</button><button class="btn round ghost" id="mine" disabled>▶️</button>' : ''}
    </div>
    <p class="sub" id="mh">${rec0 ? 'Нажми 🎙️ и скажи. Нажми ещё раз, когда закончишь' : 'Послушай 🔊 и скажи вслух'}</p>
    <button class="btn" id="go">${rec0 ? 'Дальше →' : 'Я сказал! →'}</button>`);
  let rec = null, url = null, timer = 0;
  const stop = () => { clearTimeout(timer); if (rec && rec.state === 'recording') rec.stop() };
  const here = () => S && S.cur === st;
  const playMine = () => {
    if (!url) return;
    hush();
    const a = new Audio(url);
    a.onended = () => { if (here()) setTimeout(() => { if (here()) say(x.en) }, 300) };
    const pr = a.play(); if (pr && pr.catch) pr.catch(() => {});
  };
  const x0 = $('#x').onclick;
  $('#x').onclick = () => { stop(); x0() };
  $('#em').onclick = $('#bw').onclick = $('#snd').onclick = () => say(x.en);
  if (x.q) $('#dq').onclick = () => say(x.q);
  $('#go').onclick = () => { stop(); advance() };
  if (rec0){
    const mic = $('#mic'), mine = $('#mine'), mh = $('#mh');
    mine.onclick = playMine;
    mic.onclick = async () => {
      if (rec && rec.state === 'recording') return stop();
      hush();
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({audio: true}) }
      catch(e){
        micOff = true;                                     // больше не спрашиваем до перезапуска игры
        mic.remove(); mine.remove(); mh.textContent = 'Микрофон недоступен — просто скажи вслух 🙂'; $('#go').textContent = 'Я сказал! →';
        return;
      }
      if (!here()){ stream.getTracks().forEach(t => t.stop()); return }
      const chunks = [];
      try { rec = new MediaRecorder(stream) } catch(e){ stream.getTracks().forEach(t => t.stop()); micOff = true; mh.textContent = 'Запись не работает здесь — скажи вслух 🙂'; return }
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (!here()) return;
        mic.classList.remove('on');
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(new Blob(chunks, {type: rec.mimeType || 'audio/mp4'}));
        mine.disabled = false; mh.textContent = 'Это ты! А потом — как говорит учитель 👂';
        petReact('ok'); playMine();
      };
      rec.start(); mic.classList.add('on'); mh.textContent = 'Говори! 🔴 Нажми ещё раз, когда закончишь';
      timer = setTimeout(stop, 4000);
    };
  }
  task('speak', x.en);
};

/* ---------- прописи: обвести букву пальцем ---------- */
/* Пропись из 6 знакомых букв: большие и маленькие по очереди */
function startTrace(){
  const p = me(), n = abcDone(p); if (!n) return home();
  const known = LETTERS.slice(0, ABC_RANGES[n - 1][1]);
  const steps = shuffle(known).slice(0, 6).map((x, i) => ({t: 'trace', x, lo: i % 2 === 1}));
  S = {L: {id: 'trace', kind: 'trace'}, mode: 'lesson', steps, pos: 0, mistakes: 0, pool: [], missed: new Set()};
  step();
}
STEPS.trace = st => {
  const x = st.x, ch = st.lo ? x.l : x.u;
  frame(`
    <p class="task">Обведи букву пальцем ✍️</p>
    <div class="tracebox"><canvas id="tc" width="480" height="480"></canvas></div>
    <p class="sub" id="th" style="margin:8px 0 0">Веди по серой букве — от точки к точке</p>
    <div class="row" style="margin-top:10px"><button class="btn round ghost" id="clr">↺</button><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Готово ✓</button></div>`);
  $('#snd').onclick = () => say(x.u);
  task('trace', x.u);
  const cv = $('#tc'), ctx = cv.getContext && cv.getContext('2d');
  if (!ctx){ $('#clr').remove(); $('#go').onclick = advance; return }
  const N = cv.width, W = N * .085, font = `900 ${Math.round(N * (st.lo ? .74 : .7))}px Nunito, "Arial Rounded MT Bold", Arial, sans-serif`;
  const glyph = (c, how) => { c.font = font; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; how(c, N / 2, N * .76) };
  /* маска буквы и маска «с запасом» — чтобы не требовать идеальной точности */
  const mk = () => { const m = document.createElement('canvas'); m.width = m.height = N; return m };
  const inner = mk(), wide = mk(), ic = inner.getContext('2d'), wc = wide.getContext('2d');
  glyph(ic, (c, a, b) => c.fillText(ch, a, b));
  glyph(wc, (c, a, b) => { c.lineWidth = W * 1.6; c.lineJoin = 'round'; c.strokeText(ch, a, b); c.fillText(ch, a, b) });
  const id = ic.getImageData(0, 0, N, N).data, wd = wc.getImageData(0, 0, N, N).data;
  const at = (d, px, py) => d[((py | 0) * N + (px | 0)) * 4 + 3] > 100;
  const pts = []; for (let py = 6; py < N; py += 12) for (let px = 6; px < N; px += 12) if (at(id, px, py)) pts.push([px, py]);
  const lines = []; let cur = null, tries = 0, done = false;
  const draw = () => {
    ctx.clearRect(0, 0, N, N);
    glyph(ctx, (c, a, b) => { c.fillStyle = '#eceefa'; c.fillText(ch, a, b); c.setLineDash([3, 14]); c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = '#b9bfd3'; c.strokeText(ch, a, b); c.setLineDash([]) });
    ctx.lineWidth = W; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = done ? '#22c55e' : '#5b5bf0';
    lines.forEach(l => { ctx.beginPath(); l.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); if (l.length === 1) ctx.lineTo(l[0][0] + .1, l[0][1]); ctx.stroke() });
  };
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * N / r.width, (e.clientY - r.top) * N / r.height] };
  cv.onpointerdown = e => { if (done) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId) } catch(_){} cur = [pos(e)]; lines.push(cur); draw() };
  cv.onpointermove = e => { if (!cur) return; e.preventDefault(); cur.push(pos(e)); draw() };
  cv.onpointerup = cv.onpointercancel = () => { cur = null };
  $('#clr').onclick = () => { if (done) return; lines.length = 0; draw() };
  /* проверка: закрашена ли большая часть буквы и не слишком ли много мимо */
  const check = () => {
    const u = mk(), uc = u.getContext('2d');
    uc.lineWidth = W * 1.15; uc.lineCap = uc.lineJoin = 'round';
    lines.forEach(l => { uc.beginPath(); l.forEach(([a, b], i) => i ? uc.lineTo(a, b) : uc.moveTo(a, b)); if (l.length === 1) uc.lineTo(l[0][0] + .1, l[0][1]); uc.stroke() });
    const ud = uc.getImageData(0, 0, N, N).data;
    const cover = pts.length ? pts.filter(([a, b]) => at(ud, a, b)).length / pts.length : 1;
    const all = lines.flat(), out = all.length ? all.filter(([a, b]) => a < 0 || b < 0 || a >= N || b >= N || !at(wd, a, b)).length / all.length : 1;
    return cover >= .55 && out <= .3;
  };
  draw();
  $('#go').onclick = () => {
    if (done) return;
    if (!lines.length){ buzz(); $('#th').textContent = 'Сначала обведи букву пальцем 👆'; return }
    if (check() || tries >= 2){
      done = true; draw(); ding(); petReact('ok'); say(x.u);
      $('#th').textContent = tries >= 2 && !check() ? 'Хорошая попытка! Дальше получится лучше 💪' : 'Отлично! ✨';
      later(advance, 1200);
    } else {
      tries++; buzz(); petReact('no');
      $('#th').textContent = 'Обведи всю букву по серой линии — и ещё раз «Готово» 🙂';
      lines.length = 0; draw();
    }
  };
};

/* ---------- грамматика: одно слово меняется ---------- */
const gapRe = x => new RegExp('\\b' + x.gap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
STEPS.gintro = ({x}) => {
  frame(`
    <p class="task">Смотри, как меняется слово 👀</p>
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="bigword phr" id="bw">${esc(x.en).replace(gapRe(x), m => `<b>${m}</b>`)}</p>
    <p class="ruhint">${x.ru}</p>
    <div class="row"><button class="btn round ghost" id="snd">🔊</button><button class="btn" id="go">Дальше →</button></div>`);
  $('#em').onclick = $('#bw').onclick = $('#snd').onclick = () => say(x.en);
  $('#go').onclick = advance;
  task('gintro', x.en);
};
STEPS.gfill = ({x}) => {
  const gap = filled => esc(x.en).replace(gapRe(x), m => `<u>${filled ? m : '&nbsp;&nbsp;&nbsp;'}</u>`);
  frame(`
    <p class="task">Какое слово пропущено?</p>
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="bigword phr gap2" id="gp">${gap(false)}</p>
    <p class="ruhint" style="margin:0">${x.ru}</p>
    <div class="opts">${shuffle(x.opts).map(o => `<button class="opt word" data-k="${esc(o)}">${esc(o)}</button>`).join('')}</div>`);
  $('#em').onclick = () => say(x.en);
  wireOptions({...x, k: x.gap}, () => { $('#gp').innerHTML = gap(true); later(() => say(x.en), 300); later(advance, 1600) });
  task('gfill');
};

/* ---------- стишки: строки подсвечиваются, пока звучат ---------- */
STEPS.rhyme = ({r}) => {
  frame(`
    <p class="task">🎵 ${esc(r.title)}</p>
    <div class="bigem sm">${r.icon}</div>
    <div class="rhyme">${r.lines.map((l, i) => `<button class="rl" data-i="${i}">${esc(l.en)}<small>${esc(l.ru)}</small></button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn round ghost" id="snd">▶️</button><button class="btn" id="go">Дальше →</button></div>`);
  const hl = i => () => $$('.rl').forEach((b, j) => b.classList.toggle('on', j === i));
  const sing = () => [...r.lines.flatMap((l, i) => [hl(i), l.en, 450]), hl(-1)];
  $$('.rl').forEach(b => b.onclick = () => { const i = +b.dataset.i; say(hl(i), r.lines[i].en, hl(-1)) });
  $('#snd').onclick = () => say(...sing());
  $('#go').onclick = advance;
  task('rhyme', ...sing());
};
STEPS.rgap = ({line, r}) => {
  const words = line.en.match(/[A-Za-z']+/g), cand = words.filter(w => w.length >= 3);
  const word = pick(cand.length ? cand : words), at = line.en.indexOf(word);
  const others = shuffle([...new Set(r.lines.filter(l => l !== line).flatMap(l => l.en.match(/[A-Za-z']+/g)).filter(w => w.length >= 3 && w.toLowerCase() !== word.toLowerCase()))]).slice(0, 2);
  const show = filled => esc(line.en.slice(0, at)) + `<u>${filled ? esc(word) : '&nbsp;&nbsp;&nbsp;&nbsp;'}</u>` + esc(line.en.slice(at + word.length));
  frame(`
    <p class="task">Какое слово потерялось?</p>
    <p class="bigword phr gap2" id="gp">${show(false)}</p>
    <p class="ruhint" style="margin:0">${esc(line.ru)}</p>
    <div class="center" style="margin-top:10px"><button class="btn round ghost" id="snd">🔊</button></div>
    <div class="opts">${shuffle([word, ...others]).map(o => `<button class="opt word" data-k="${esc(o)}">${esc(o)}</button>`).join('')}</div>`);
  $('#snd').onclick = () => say(line.en);
  wireOptions({k: word, en: word}, () => { $('#gp').innerHTML = show(true); later(() => say(line.en), 300); later(advance, 1900) });
  task('rgap', line.en);
};

/* ---------- собери слово из букв или фразу из слов ---------- */
const canBuild = x => { const n = x.en.replace(/[^a-z]/gi, '').length; return n >= 2 && n <= 8 };
STEPS.wbuild = STEPS.pbuild = STEPS.dbuild = st => {
  const x = st.x, words = st.t !== 'wbuild';
  const parts = words ? x.en.split(' ') : [...x.en];
  const need = parts.map((s, i) => ({s, i})).filter(o => words || /[a-z]/i.test(o.s));     // пробелы и дефисы стоят на месте
  let tiles = shuffle(need.map(o => o.s));
  for (let k = 0; k < 20 && need.length > 1 && tiles.every((s, i) => s === need[i].s); k++) tiles = shuffle(tiles);
  let pos = 0, missed = false;
  frame(`
    <p class="task">${st.t === 'dbuild' ? 'Собери ответ' : words ? 'Собери фразу' : 'Собери слово'}</p>
    ${x.q ? `<div class="bubble q" id="dq">${esc(x.q)}</div>` : ''}
    <div class="bigem sm" id="em">${pic(x)}</div>
    <p class="ruhint" style="margin-bottom:6px">${x.ru}</p>
    ${st.model ? `<p class="model">${esc(x.en)}</p>` : ''}
    <div class="slots ${words ? 'w' : ''}">${parts.map((s, i) => words || /[a-z]/i.test(s)
      ? `<span class="sl" data-i="${i}"></span>` : `<span class="fx">${s === ' ' ? '&nbsp;' : esc(s)}</span>`).join('')}</div>
    <div class="tiles ${words ? 'w' : ''}">${tiles.map(s => `<button class="tile" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>`);
  $('#em').onclick = () => say(x.en);
  if ($('#dq')) $('#dq').onclick = () => say(x.q);
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
  x.q ? task(st.t, x.q) : task(st.t, x.en);
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
  let stars = 0, head, sub, big, again, got = 3;                    // got — сколько косточек положено за это занятие

  if (mode === 'review'){
    const n = S.n; dayMark(p, 'r');
    head = PRAISE[1].en; sub = `Повторено: ${n} ${plural(n, 'слово', 'слова', 'слов')}`;
    big = '<div class="bigem" style="font-size:clamp(54px,11vw,82px)">🔁✨</div>';
    stars = 3; again = dueItems(p).length ? startReview : null;
  } else {
    stars = mode === 'exam' ? (S.mistakes <= 1 ? 3 : S.mistakes <= 3 ? 2 : 1) : (S.mistakes <= 1 ? 3 : S.mistakes <= 4 ? 2 : 1);
    p.stars[L.id] = Math.max(p.stars[L.id] || 0, stars);
    got = stars * (mode === 'exam' ? 3 : 2); lessonDone(p);
    if (mode === 'lesson' && noReview(L)){}                        // фразы, чтение, разговоры и истории в повторение не попадают
    else if (mode === 'lesson') L.set.forEach(x => { const k = revKey(x); if (!m[k] || S.missed.has(k)) m[k] = [0, tomorrow] });
    else S.missed.forEach(k => { m[k] = [0, tomorrow] });   // в испытании ошибся — слово вернётся в повторение
    head = PRAISE[3 - stars].en; sub = PRAISE[3 - stars].ru;
    big = mode === 'exam'
      ? `<div class="bigem medal">${['', '🥉', '🥈', '🥇'][stars]}</div>${stars < 3 ? '<p class="sub" style="margin:0">Золото — если ошибиться не больше одного раза</p>' : ''}`
      : `<div class="stars">${[1, 2, 3].map(n => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>`;
    again = mode === 'exam' ? () => startExam(L) : L.kind === 'trace' ? startTrace : () => startLesson(L);
  }
  const pay = earnWork(p, got, true), grownTo = careTick(p);
  saveRev(p); saveStat(p); touchStreak(p); save();
  const after = total(p), c = myPet();
  const toy = TOYS.find(x => x.at > before && x.at <= after);
  const fresh = newStickers(p, had);
  S = null;
  render('finish', `
    <div class="stage" style="margin-top:24px">
      <div class="center">
        ${myPetHTML(p, stars >= 2 ? 'jump dance' : '')}
        <h1>${head}</h1>
        <p class="sub" style="margin:0">${sub}</p>
        ${big}
        ${earnedHTML(p, pay)}
        ${grownTo ? `<div class="gift">🎉 ${c.name} ${gw(c, 'вырос', 'выросла')}! Теперь ${gw(c, 'он', 'она')} — ${stageName(c, STAGES.indexOf(grownTo)).toLowerCase()}</div>` : ''}
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
