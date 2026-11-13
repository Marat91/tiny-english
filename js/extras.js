/* Косточки, задание дня, комната питомца с магазином, альбом наклеек, страница для родителей.
   Что хранится в профиле: b — косточки, own — купленные вещи, wall — обои, fed — день последней кормёжки,
   day — отметки задания дня, fr — заморозки серии, ms — рекорд серии, hi — рекорды игр, gp — сыграно игр. */
const bones = p => p.b || 0;
const earn = (p, n) => { p.b = bones(p) + n };
function today(p){ const d = dayNo(); if (!p.day || p.day.d !== d) p.day = {d}; return p.day }
const dayMark = (p, k) => { today(p)[k] = 1 };
/* За игры — не больше 24 косточек в день, чтобы уроки оставались выгоднее */
function gameBones(p, n){
  const d = today(p), give = Math.max(0, Math.min(n, 24 - (d.g || 0)));
  d.g = (d.g || 0) + give; earn(p, give);
  return give;
}

/* ================= Задание дня ================= */
const DAILY = [['l', '📘', 'Пройди урок'], ['r', '🔁', 'Повтори слова или сыграй в игру'], ['f', '🦴', 'Покорми друга']];
function dailyHTML(p){
  const d = today(p), n = DAILY.filter(q => d[q[0]]).length, all = n === DAILY.length;
  return `<div class="daily ${d.c ? 'done' : ''}">
    <div class="dl-t">
      <b>Задание на сегодня</b>
      <div class="dl-q">${DAILY.map(q => `<span class="${d[q[0]] ? 'ok' : ''}">${d[q[0]] ? '✅' : q[1]} ${q[2]}</span>`).join('')}</div>
    </div>
    <button class="chest ${all && !d.c ? 'ready' : ''}" id="chest"><i>${d.c ? '📭' : '🎁'}</i><small>${d.c ? 'до завтра' : all ? 'открыть!' : n + ' из 3'}</small></button>
  </div>`;
}
function openChest(){
  const p = me(), d = today(p);
  if (d.c || DAILY.some(q => !d[q[0]])){ buzz(); const b = $('#chest'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return }
  const n = 8 + Math.floor(Math.random() * 8), ice = (p.fr || 0) < FREEZE_MAX && Math.random() < .3;
  earn(p, n); if (ice) p.fr = (p.fr || 0) + 1;
  d.c = 1; save();
  render('chest', `
    <div class="stage" style="margin-top:24px"><div class="center">
      <div class="bigem medal">🎁</div>
      <h1>Подарок дня!</h1>
      <div class="earned big">+${n} 🦴</div>
      ${ice ? '<div class="gift">❄️ Заморозка серии: если пропустишь один день, огонёк 🔥 не погаснет</div>' : ''}
      <p class="sub" style="margin:0">Завтра будет новое задание и новый подарок</p>
      <button class="btn" id="go">Ура! →</button>
    </div></div>`);
  fanfare();
  $('#go').onclick = home;
}

/* ================= Комната питомца и магазин ================= */
function room(note){
  const p = me(), c = myPet(), own = p.own || [], fed = p.fed === dayNo();
  const wall = WALLS.find(w => w.id === (p.wall || '')) || WALLS[0], walls = p.walls || [];
  render('room', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Дом ${esc(c.name)}</h2><span class="chip" id="bn">🦴 ${bones(p)}</span></div>
    <div class="room" style="--wall:${wall.css}">
      ${SHOP.filter(i => own.includes(i.id)).map(i => `<button class="ri" data-id="${i.id}" style="left:${i.pos[0]}%;bottom:${i.pos[1]}%;font-size:${i.pos[2]}em">${i.icon}</button>`).join('')}
      ${petSVG(p.char, total(p), 'mid')}
    </div>
    ${note ? `<div class="note">${note}</div>` : ''}
    <div class="row" style="margin-top:14px">
      <button class="btn" id="feed">🦴 ${fed ? 'Угостить ещё (1 🦴)' : 'Покормить'}</button>
      <button class="btn ghost" id="chg">Сменить друга</button>
    </div>
    <p class="sub" style="margin:12px 0 0;font-size:14px">${own.length ? 'Нажимай на вещи в комнате — услышишь, как они называются по-английски' : 'Покупай вещи за косточки 🦴 — они появятся в комнате'}</p>

    <h3 class="sec">🛍️ Магазин</h3>
    <div class="shop">
      ${SHOP.map(i => { const has = own.includes(i.id); return `<button class="si ${has ? 'own' : bones(p) < i.price ? 'cant' : ''}" data-id="${i.id}">
        <i>${i.icon}</i><b>${esc(i.en)}</b><small>${i.ru}</small><span class="pr">${has ? '✓ есть' : '🦴 ' + i.price}</span></button>` }).join('')}
      <button class="si ${(p.fr || 0) >= FREEZE_MAX ? 'own' : bones(p) < FREEZE_PRICE ? 'cant' : ''}" data-id="freeze">
        <i>❄️</i><b>Заморозка</b><small>спасает серию 🔥, если пропустить день</small><span class="pr">${(p.fr || 0) >= FREEZE_MAX ? `✓ есть ${p.fr}` : `🦴 ${FREEZE_PRICE}${p.fr ? ' · есть ' + p.fr : ''}`}</span></button>
    </div>
    <h3 class="sec">🎨 Обои</h3>
    <div class="shop walls">
      ${WALLS.map(w => { const has = !w.price || walls.includes(w.id), on = wall === w; return `<button class="si ${on ? 'on' : has ? 'own' : bones(p) < w.price ? 'cant' : ''}" data-w="${w.id}">
        <i><span class="sw" style="background:${w.dot}"></span></i><b>${esc(w.en || 'home')}</b><small>${w.ru}</small><span class="pr">${on ? '✓ выбраны' : has ? 'поставить' : '🦴 ' + w.price}</span></button>` }).join('')}
    </div>`);
  $('#x').onclick = () => { hush(); home() };
  $('#chg').onclick = choosePet;
  $('.pet').onclick = () => { petReact('ok'); say(c.hello) };
  $$('.ri').forEach(b => b.onclick = () => { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); say(SHOP.find(i => i.id === b.dataset.id).en) });
  const poor = () => { buzz(); room('Не хватает косточек 🦴 — их дают за уроки, повторение и игры') };
  $('#feed').onclick = () => {
    const first = p.fed !== dayNo();
    if (!first && bones(p) < 1) return poor();
    if (!first) earn(p, -1);
    p.fed = dayNo(); dayMark(p, 'f'); save();
    $('#bn').textContent = '🦴 ' + bones(p);
    $('#feed').textContent = '🦴 Угостить ещё (1 🦴)';
    petReact('ok'); ding(); say('thank you');
    const h = document.createElement('span'); h.className = 'yum'; h.textContent = '🦴❤️'; $('.room').appendChild(h);
    setTimeout(() => h.remove(), 1200);
  };
  $$('.si[data-id]').forEach(b => b.onclick = () => {
    const id = b.dataset.id;
    if (id === 'freeze'){
      if ((p.fr || 0) >= FREEZE_MAX) return;
      if (bones(p) < FREEZE_PRICE) return poor();
      earn(p, -FREEZE_PRICE); p.fr = (p.fr || 0) + 1; save(); ding(); return room();
    }
    const i = SHOP.find(x => x.id === id);
    if (own.includes(id)) return say(i.en);
    if (bones(p) < i.price) return poor();
    earn(p, -i.price); p.own = [...own, id]; save(); fanfare(); room(); say(i.en);
  });
  $$('.si[data-w]').forEach(b => b.onclick = () => {
    const w = WALLS.find(x => x.id === b.dataset.w);
    if (w.price && !walls.includes(w.id)){
      if (bones(p) < w.price) return poor();
      earn(p, -w.price); p.walls = [...walls, w.id]; ding();
    }
    p.wall = w.id; save(); room(); if (w.en) say(w.en);
  });
}

/* ================= Альбом наклеек ================= */
function stickers(p){
  const learned = Object.keys(revOf(p).m).filter(k => k[0] === 'W' && ITEMS[k]).length;
  const ms = Math.max(p.ms || 0, liveStreak(p));
  return [
    {id: 'abc', icon: '🔤', name: 'Алфавит', have: abcDone(p) >= ABC.length, gold: p.stars['abc:x'] === 3, how: 'Пройди все уроки алфавита'},
    ...TOPICS.map(t => ({id: t.id, icon: t.icon, name: t.title, have: topicDone(p, t), gold: p.stars[t.id + ':x'] === 3, how: 'Пройди оба урока темы'})),
    {id: 'phr', icon: '💬', name: 'Фразы', have: ALL.filter(L => L.kind === 'phrase').every(L => p.stars[L.id] > 0), how: 'Пройди все уроки с фразами'},
    ...[[20, '📗'], [50, '📘'], [100, '📚']].map(([n, icon]) => ({id: 'w' + n, icon, name: n + ' слов', have: learned >= n, how: `Выучи ${n} слов`})),
    ...[[3, '🔥'], [7, '☄️'], [14, '🌟'], [30, '🏅']].map(([n, icon]) => ({id: 's' + n, icon, name: n + ' ' + plural(n, 'день', 'дня', 'дней') + ' подряд', have: ms >= n, how: `Занимайся ${n} ${plural(n, 'день', 'дня', 'дней')} подряд`})),
    {id: 'gp', icon: '🎮', name: 'Игрок', have: (p.gp || 0) >= 10, how: 'Сыграй в игры 10 раз'},
    {id: 'shop', icon: '🛋️', name: 'Уютный дом', have: (p.own || []).length >= 5, how: 'Купи 5 вещей в комнату'},
  ];
}
const stickerSet = p => new Set(stickers(p).flatMap(s => [s.have ? s.id : '', s.have && s.gold ? s.id + '*' : '']));
/* Что появилось после урока: новые наклейки и наклейки, ставшие золотыми */
function newStickers(p, had){
  return stickers(p).filter(s => s.have && (!had.has(s.id) || (s.gold && !had.has(s.id + '*'))))
    .map(s => ({...s, gold: had.has(s.id)}));
}
function album(){
  const p = me(), list = stickers(p), n = list.filter(s => s.have).length;
  render('album', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Альбом</h2><span class="chip">${n} / ${list.length}</span></div>
    <p class="sub">Наклейки дают за пройденные темы. Золотая — за испытание на 🥇</p>
    <div class="album">${list.map(s => `<div class="stk ${s.have ? 'have' : ''} ${s.have && s.gold ? 'gold' : ''}">
      <i>${s.have ? s.icon : '❔'}</i><b>${esc(s.name)}</b><small>${s.have ? (s.gold ? 'золотая ✨' : 'gold' in s ? 'сдай испытание на 🥇' : 'получена') : s.how}</small></div>`).join('')}</div>`);
  $('#x').onclick = home;
}

/* ================= Для родителей ================= */
function parents(pid){
  const p = db.profiles.find(x => x.id === pid) || me() || db.profiles[0];
  const m = revOf(p).m, s = statOf(p), keys = Object.keys(m).filter(k => ITEMS[k]), d = dayNo();
  const words = keys.filter(k => k[0] === 'W').length, letters = keys.filter(k => k[0] === 'L').length;
  const allWords = TOPICS.reduce((a, t) => a + t.lessons.flat().length, 0);
  const solid = keys.filter(k => m[k][0] >= 3).length;
  const phr = ALL.filter(L => L.kind === 'phrase' && p.stars[L.id] > 0).reduce((a, L) => a + L.set.length, 0);
  const week = Array.from({length: 7}, (_, i) => s.d[d - 6 + i] || 0), max = Math.max(1, ...week);
  const wd = i => ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][new Date(Date.now() - (6 - i) * 864e5).getDay()];
  const days30 = Object.keys(s.d).filter(k => +k > d - 30 && +k <= d).length;
  const acc = s.a ? Math.round((1 - s.e / s.a) * 100) : null;
  const hard = Object.entries(s.x).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const label = k => { const it = ITEMS[k]; return !it ? esc(k.slice(2)) : it.x.u ? `буква ${it.x.u}${it.x.l}` : `${esc(it.x.en)} — ${it.x.ru}` };
  const tile = (v, t) => `<div class="pt"><b>${v}</b><small>${t}</small></div>`;
  render('parents', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Для родителей</h2><span style="width:46px"></span></div>
    ${db.profiles.length > 1 ? `<div class="tabs">${db.profiles.map(x => `<button class="tab ${x === p ? 'on' : ''}" data-id="${x.id}">${x.avatar} ${esc(x.name)}</button>`).join('')}</div>` : ''}
    <div class="ptiles">
      ${tile(`${words}<i> из ${allWords}</i>`, 'слов выучено')}
      ${tile(`${letters}<i> из 26</i>`, 'букв')}
      ${tile(phr, 'фраз')}
      ${tile(solid, 'знает уверенно')}
      ${tile(`🔥 ${liveStreak(p)}`, `дней подряд · рекорд ${Math.max(p.ms || 0, liveStreak(p))}`)}
      ${tile(days30, 'дней занятий за месяц')}
      ${tile(acc == null ? '—' : acc + '%', 'верных ответов')}
      ${tile(`⭐ ${total(p)}`, 'звёзд')}
    </div>
    <h3 class="sec">📅 Последние 7 дней <small>ответов в день</small></h3>
    <div class="stage week">${week.map((n, i) => `<div><span>${n || ''}</span><i style="height:${Math.round(n / max * 100)}%" class="${n ? '' : 'z'}"></i><small>${wd(i)}</small></div>`).join('')}</div>
    <h3 class="sec">🧩 Что даётся трудно</h3>
    ${hard.length ? `<div class="board">${hard.map(([k, n]) => `<div class="brow"><span class="bn">${label(k)}</span><span class="bs">ошибок: ${n}</span></div>`).join('')}</div>
        <p class="sub" style="margin:10px 0 0;font-size:14px">Эти слова игра сама чаще показывает в «Повторении». Слово уходит из списка, когда на него начинают отвечать верно.</p>`
      : `<p class="sub">${s.a ? 'Трудных слов сейчас нет 👍' : 'Статистика копится с этой версии игры — данные появятся после первых занятий.'}</p>`}
    <h3 class="sec">📚 Темы</h3>
    <div class="board">
      ${[{title: 'Алфавит', icon: '🔤', ids: ABC.map((_, i) => 'abc:' + i), x: 'abc:x'},
         ...TOPICS.map(t => ({title: t.title, icon: t.icon, ids: t.lessons.map((_, i) => t.id + ':' + i), x: t.id + ':x'}))]
        .filter(t => t.ids.some(id => p.stars[id] > 0))
        .map(t => `<div class="brow"><span class="bav">${t.icon}</span><span class="bn">${esc(t.title)}</span>
          <span class="bs">⭐ ${t.ids.reduce((a, id) => a + (p.stars[id] || 0), 0)} / ${t.ids.length * 3}</span><span class="bs">${['—', '🥉', '🥈', '🥇'][p.stars[t.x] || 0]}</span></div>`).join('')
        || '<p class="sub">Пока ни одного пройденного урока</p>'}
    </div>
    <p class="sub" style="margin:22px 0 0;font-size:14px">Совет: 5–10 минут каждый день дают больше, чем час раз в неделю. «Знает уверенно» — слова, на которые ребёнок верно ответил в повторении три раза подряд с перерывами в несколько дней.</p>`);
  $('#x').onclick = home;
  $$('.tab').forEach(b => b.onclick = () => parents(b.dataset.id));
}
