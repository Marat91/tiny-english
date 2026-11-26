/* Жизнь питомца и «хозяйство»: шкалы, еда, прогулка, сон, рост; магазин трёх видов вещей, копилка, цель,
   ярмарка, отчёт за неделю; подарки, гости и общая цель группы.
   В профиле: pet {f сытость, m настроение, e энергия, t когда считали, g дней хорошей заботы, gd день последнего зачёта},
   own — вещи, goal — на что копим, pig {n, d} — вклад в копилке, led / lw — траты этой и прошлой недели, gt — принятые подарки. */
const clamp = v => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
/* Шкалы понемногу падают сами: за сутки сытость −72, настроение −60, энергия −36. Ниже нуля не уходят, питомец не погибает. */
function petOf(p){
  const now = Date.now();
  if (!p.pet) p.pet = {f: 70, m: 70, e: 70, t: now, g: 0};
  const q = p.pet, h = Math.min(96, Math.max(0, (now - q.t) / 36e5));
  if (h >= .1){ q.f = clamp(q.f - 3 * h); q.m = clamp(q.m - 2.5 * h); q.e = clamp(q.e - 1.5 * h); q.t = now }
  return q;
}
const care = p => { const q = petOf(p); return (q.f + q.m + q.e) / 3 };
/* Ухоженный питомец приносит больше косточек за занятия, заброшенный — меньше */
const careMult = p => { const c = care(p); return c >= 70 ? 1.25 : c < 35 ? .7 : 1 };
const stageNo = p => { const g = petOf(p).g || 0; let n = 0; STAGES.forEach((s, i) => { if (g >= s.at) n = i }); return n };
const stageName = (c, n) => gw(c, STAGES[n].name, STAGES[n].nameF);
const praise = c => c.id === 'dog' ? 'good dog' : 'good job';
const petLook = p => care(p) < 35 ? 'low' : '';
const owns = (p, id) => id === 'bowl' || (p.own || []).includes(id);
const myPetHTML = (p, cls) => petSVG(p.char, total(p), (cls || '') + ' ' + petLook(p), STAGES[stageNo(p)].gs, outfitIcons(p));

function petBars(p){
  const q = petOf(p), bar = (icon, v, name) => `<div class="pb ${v < 35 ? 'low' : v >= 70 ? 'ok' : ''}" title="${name}"><span>${icon}</span><i><b style="width:${Math.max(3, Math.round(v))}%"></b></i></div>`;
  return `<div class="pbars">${bar('🍖', q.f, 'сытость')}${bar('💛', q.m, 'настроение')}${bar('⚡', q.e, 'энергия')}</div>`;
}
/* День засчитывается в рост, если питомец сыт, весел, бодр и ученик сегодня занимался. Вернёт новую стадию, если питомец вырос. */
function careTick(p){
  const q = petOf(p), d = today(p), before = stageNo(p);
  if (q.gd !== dayNo() && Math.min(q.f, q.m, q.e) >= 55 && (d.l || d.r)){ q.g = (q.g || 0) + 1; q.gd = dayNo() }
  const after = stageNo(p);
  return after > before ? STAGES[after] : null;
}

/* ---------- учёт косточек ---------- */
const weekNo = () => Math.floor((dayNo() - 4) / 7);                 // недели с понедельника
function led(p){
  const w = weekNo();
  if (!p.led || p.led.w !== w){ if (p.led) p.lw = p.led; p.led = {w, i: 0, f: 0, n: 0, u: 0, x: 0, g: 0} }
  return p.led;
}
/* cat: f — еда, n — нужное, u — полезное, x — красивое, g — подарки */
function spend(p, n, cat){
  if (bones(p) < n) return false;
  p.b = bones(p) - n; if (n) led(p)[cat] += n;
  return true;
}
/* Доход от лавки и дерева — раз в день, в день занятий */
function dailyIncome(p){
  const d = today(p); if (d.inc) return 0;
  d.inc = 1;
  const n = SHOP.filter(i => i.day && owns(p, i.id)).reduce((a, i) => a + i.day, 0);
  if (n) earn(p, n);
  return n;
}
/* Косточки за занятие с учётом заботы о питомце. lesson — это урок, повторение или испытание (за них платит ещё и полка). */
function earnWork(p, n, lesson){
  const base = Math.max(1, Math.round(n * careMult(p))), shelf = lesson && owns(p, 'shelf') ? 1 : 0;
  earn(p, base + shelf);
  const q = petOf(p); q.m = clamp(q.m + 8);                          // питомец рад, что с ним занимаются
  return {got: base + shelf, delta: base - n, shelf, day: dailyIncome(p)};
}
function earnedHTML(p, r){
  const c = myPet();
  return `<div class="earned">+${r.got} 🦴</div>
    ${r.delta > 0 ? `<p class="sub" style="margin:0">из них +${r.delta} — ${c.name} ${gw(c, 'счастлив', 'счастлива')}, потому что ты хорошо заботишься 💛</p>` : ''}
    ${r.delta < 0 ? `<div class="note">${c.name} ${gw(c, 'голоден', 'голодна')} или грустит — поэтому косточек меньше (${r.delta}). Загляни в комнату!</div>` : ''}
    ${r.day ? `<div class="gift">${SHOP.filter(i => i.day && owns(p, i.id)).map(i => i.icon).join('')} Доход за день: +${r.day} 🦴</div>` : ''}`;
}

/* ---------- окошко с вопросом: первая кнопка — «подумать», вторая — действие ---------- */
function askBox(html, yes, no, onYes){
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="mbox"><p>${html}</p><div class="row"><button class="btn" id="m-no">${no}</button><button class="btn ghost" id="m-yes">${yes}</button></div></div>`;
  app.appendChild(d);
  d.querySelector('#m-no').onclick = () => d.remove();
  d.querySelector('#m-yes').onclick = () => { d.remove(); onYes() };
}

/* ================= Комната ================= */
const fundLevel = n => FUND.filter(f => (n || 0) >= f.need).length;
const myFundLevel = () => Math.max(0, ...((srv && srv.groups) || []).map(g => fundLevel(g.fund)));
/* Комната и двор. o: {char, stars, own, wall, gs, look, fund} */
function sceneHTML(o){
  const wall = WALLS.find(w => w.id === (o.wall || '')) || WALLS[0];
  const has = SHOP.filter(i => i.id === 'bowl' || (o.own || []).includes(i.id)), yard = has.filter(i => i.yard), built = FUND.slice(0, o.fund || 0);
  return `<div class="room" style="--wall:${wall.css}">
      ${has.filter(i => i.pos).map(i => `<button class="ri" data-id="${i.id}" style="left:${i.pos[0]}%;bottom:${i.pos[1]}%;font-size:${i.pos[2]}em">${i.icon}</button>`).join('')}
      ${petSVG(o.char, o.stars, 'mid ' + (o.look || ''), o.gs)}
    </div>
    ${yard.length || built.length ? `<div class="yard"><small>двор</small>${built.map(f => `<span class="ri y" title="${f.name}">${f.icon}</span>`).join('')}${yard.map(i => `<button class="ri y" data-id="${i.id}">${i.icon}</button>`).join('')}</div>` : ''}`;
}
const fairOpen = () => [0, 6].includes(new Date().getDay());
function fairItems(){ const rare = SHOP.filter(i => i.rare), w = weekNo(); return [0, 1, 2].map(k => rare[(((w * 3 + k) % rare.length) + rare.length) % rare.length]) }

let roomTab = 'care';
function room(tab, note){
  if (tab) roomTab = tab;
  const p = me(), c = myPet(), q = petOf(p), st = stageNo(p), next = STAGES[st + 1], d = today(p), mult = careMult(p);
  const goal = SHOP.find(i => i.id === p.goal && !owns(p, i.id));
  const tabBtn = (id, label) => `<button class="tab ${roomTab === id ? 'on' : ''}" data-rt="${id}">${label}</button>`;
  const cat = {need: 'n', use: 'u', fun: 'x'};
  const item = (i, locked) => { const has = owns(p, i.id); return `<button class="si ${has ? 'own' : locked || bones(p) < i.price ? 'cant' : ''}" data-id="${i.id}" ${locked ? 'data-locked="1"' : ''}>
      ${!has && !locked && i.price ? `<span class="aim ${p.goal === i.id ? 'on' : ''}" data-goal="${i.id}">🎯</span>` : ''}
      <i>${i.icon}</i><b>${esc(i.en)}</b><small>${i.ru}${i.why ? ' · ' + i.why : ''}</small><span class="pr">${has ? '✓ есть' : i.price ? '🦴 ' + i.price : 'даром'}</span></button>` };
  const walls = p.walls || [], wallNow = WALLS.find(w => w.id === (p.wall || '')) || WALLS[0];

  const careTab = () => `
    <h3 class="sec">🍽️ Покормить</h3>
    <div class="shop foods">${FOODS.map(f => `<button class="si ${bones(p) < f.price ? 'cant' : ''}" data-food="${f.id}">
      <i>${f.icon}</i><b>${esc(f.en)}</b><small>${f.ru} · 🍖+${f.f}${f.m ? ' 💛+' + f.m : ''}</small><span class="pr">${f.price ? '🦴 ' + f.price : 'даром'}</span></button>`).join('')}</div>
    <h3 class="sec">🐾 Заняться</h3>
    <div class="row" style="margin-top:12px">
      <button class="btn ${owns(p, 'leash') ? '' : 'ghost'}" id="walk">🦮 Гулять</button>
      <button class="btn ${d.sl ? 'ghost' : ''}" id="nap">😴 Спать</button>
      <button class="btn ghost" id="chg">Сменить друга</button>
    </div>
    <h3 class="sec">🎓 Команды</h3>
    ${st < 1 ? `<p class="sub" style="margin:10px 0 0">${c.name} ещё ${gw(c, 'малыш', 'малышка')}. Команды откроются, когда подрастёт</p>`
      : `<div class="row" style="margin-top:12px">${TRICKS.map(t => `<button class="chip trick ${t.st > st ? 'off' : ''}" data-t="${t.en}">${t.st > st ? '🔒 ' : ''}${t.en} <small>${t.ru}</small></button>`).join('')}</div>`}`;

  const shopTab = () => `
    ${goal ? `<div class="goal"><span class="g-i">${goal.icon}</span><div class="g-t"><b>Коплю на: ${esc(goal.en)}</b>
          <div class="toybar"><i style="width:${Math.min(100, Math.max(4, Math.round(bones(p) / goal.price * 100)))}%"></i></div>
          <small>${bones(p) >= goal.price ? 'Хватает! Можно покупать 🎉' : `есть ${bones(p)} из ${goal.price} · осталось ${goal.price - bones(p)} 🦴`}</small></div>
          <button class="chip" id="nogoal">✕</button></div>`
      : `<p class="sub" style="margin:10px 0 0;font-size:14px">Нажми 🎯 на вещи, чтобы копить на неё — на главном экране появится шкала</p>`}
    <h3 class="sec">🧰 Нужное <small>без этого не получится ухаживать</small></h3>
    <div class="shop">${SHOP.filter(i => i.type === 'need').map(i => item(i)).join('')}</div>
    <h3 class="sec">💡 Полезное <small>со временем приносит косточки</small></h3>
    <div class="shop">${SHOP.filter(i => i.type === 'use').map(i => item(i)).join('')}
      <button class="si ${(p.fr || 0) >= FREEZE_MAX ? 'own' : bones(p) < FREEZE_PRICE ? 'cant' : ''}" data-id="freeze">
        <i>❄️</i><b>Заморозка</b><small>спасает серию 🔥, если пропустить день</small><span class="pr">${(p.fr || 0) >= FREEZE_MAX ? `✓ есть ${p.fr}` : `🦴 ${FREEZE_PRICE}${p.fr ? ' · есть ' + p.fr : ''}`}</span></button></div>
    <h3 class="sec">🎪 Ярмарка <small>${fairOpen() ? 'открыта до конца воскресенья!' : 'редкие вещи — только в субботу и воскресенье'}</small></h3>
    <div class="shop">${fairItems().map(i => item(i, !fairOpen())).join('')}</div>
    ${nyOn() ? `<h3 class="sec">🎄 Новогоднее <small>только до 10 января!</small></h3>
    <div class="shop">${SHOP.filter(i => i.ny).map(i => item(i)).join('')}</div>` : ''}
    <h3 class="sec">🎈 Красивое <small>просто для радости</small></h3>
    <div class="shop">${SHOP.filter(i => i.type === 'fun' && (!i.rare || owns(p, i.id)) && (!i.ny || (owns(p, i.id) && !nyOn())) && !fairItems().includes(i)).map(i => item(i)).join('')}</div>
    <h3 class="sec">🎨 Обои</h3>
    <div class="shop walls">${WALLS.map(w => { const has = !w.price || walls.includes(w.id), on = wallNow === w; return `<button class="si ${on ? 'on' : has ? 'own' : bones(p) < w.price ? 'cant' : ''}" data-w="${w.id}">
        <i><span class="sw" style="background:${w.dot}"></span></i><b>${esc(w.en || 'home')}</b><small>${w.ru}</small><span class="pr">${on ? '✓ выбраны' : has ? 'поставить' : '🦴 ' + w.price}</span></button>` }).join('')}</div>`;

  const bankTab = () => {
    const pg = p.pig, left = pg ? Math.max(0, 3 - (dayNo() - pg.d)) : 0, full = pg ? pg.n + Math.ceil(pg.n * .2) : 0;
    const groups = (srv && srv.groups) || [];
    return `
    <h3 class="sec">🐷 Копилка</h3>
    <div class="stage" style="margin-top:12px">
      ${!owns(p, 'pig') ? `<p class="sub" style="margin:0">Копилки пока нет. Она продаётся в магазине в разделе «Полезное» за 25 🦴.<br>Положишь в неё косточки на 3 дня — получишь на 20% больше.</p>`
      : pg ? `<p class="task">В копилке ${pg.n} 🦴</p>
          <p class="sub">${left ? `Через ${left} ${plural(left, 'день', 'дня', 'дней')} там будет ${full} 🦴. Если забрать сейчас — только ${pg.n}.` : `Косточки подросли: теперь их ${full}! 🎉`}</p>
          <button class="btn ${left ? 'ghost' : ''}" id="pigout">${left ? `Забрать ${pg.n} сейчас` : `Забрать ${full} 🦴`}</button>`
      : `<p class="task">Положи косточки на 3 дня</p>
          <p class="sub">Вернётся на 20% больше: из 10 станет 12, из 50 — 60. Но забрать раньше — значит остаться без прибавки.</p>
          <div class="row">${[10, 20, 50].map(n => `<button class="btn ${bones(p) < n ? 'ghost' : ''}" data-pig="${n}">${n} 🦴</button>`).join('')}</div>`}
    </div>
    <h3 class="sec">📊 Мои косточки</h3>
    ${reportHTML(p)}
    ${online() && groups.length && goal ? `<h3 class="sec">🙏 Попросить помощи</h3>
      <div class="stage" style="margin-top:12px"><p class="sub">Не хватает на ${goal.icon} ${esc(goal.en)}? Можно попросить у своей группы — просьбу увидят в рейтинге.</p>
      <div class="row">${groups.map(g => `<button class="chip askg" data-code="${g.code}">${esc(g.name)}</button>`).join('')}</div></div>` : ''}`;
  };

  render('room', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">${esc(c.name)} · ${stageName(c, st)}</h2><span class="chip" id="bn">🦴 ${bones(p)}</span></div>
    ${sceneHTML({char: p.char, stars: total(p), own: p.own, wall: p.wall, gs: STAGES[st].gs, look: petLook(p), fund: myFundLevel()})}
    ${petBars(p)}
    <p class="sub carenote ${mult > 1 ? 'ok' : mult < 1 ? 'low' : ''}">${mult > 1 ? `${c.name} ${gw(c, 'счастлив', 'счастлива')}: за уроки ты получаешь на четверть больше 🦴`
      : mult < 1 ? `${c.name} грустит: за уроки ты получаешь меньше 🦴. Нужны еда, прогулка и сон!` : `Подними все шкалы выше 70 — и ${c.name} будет приносить больше 🦴`}</p>
    ${next ? `<div class="grow"><small>${stageName(c, st)} → ${stageName(c, st + 1)}: ${q.g || 0} из ${next.at} дней хорошей заботы${q.gd === dayNo() ? ' · сегодня засчитано ✅' : ''}</small>
        <div class="toybar"><i style="width:${Math.max(4, Math.round(((q.g || 0) - STAGES[st].at) / (next.at - STAGES[st].at) * 100))}%"></i></div></div>` : `<p class="sub">🏅 ${c.name} — ${gw(c, 'чемпион', 'чемпионка')}!</p>`}
    ${note ? `<div class="note">${note}</div>` : ''}
    <div class="tabs" style="margin-top:14px">${tabBtn('care', '🐶 Уход')}${tabBtn('shop', '🛍️ Магазин')}${tabBtn('bank', '🐷 Копилка')}</div>
    ${roomTab === 'shop' ? shopTab() : roomTab === 'bank' ? bankTab() : careTab()}`);

  const again = n => { const y = window.scrollY; room(null, n); if (!n) window.scrollTo(0, y) };
  const poor = () => { buzz(); room(null, 'Не хватает косточек 🦴 — их дают за уроки, повторение и игры') };
  const grown = () => { const g = careTick(p); save(); if (g) grew(g); return !!g };
  $('#x').onclick = () => { hush(); home() };
  $$('[data-rt]').forEach(b => b.onclick = () => { const y = window.scrollY; room(b.dataset.rt); window.scrollTo(0, y) });
  $('.pet').onclick = () => { petReact('ok'); say(c.hello) };
  $$('button.ri').forEach(b => b.onclick = () => { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); say(SHOP.find(i => i.id === b.dataset.id).en) });
  const pop = text => { const h = document.createElement('span'); h.className = 'yum'; h.textContent = text; $('.room').appendChild(h); setTimeout(() => h.remove(), 1200) };

  /* --- уход --- */
  $$('[data-food]').forEach(b => b.onclick = () => {
    const f = FOODS.find(x => x.id === b.dataset.food), top = f.cap || 100;
    if (q.f >= top - 2 && !f.m){ buzz(); return again(f.cap ? `Водой сыт не будешь — ${c.name} хочет настоящей еды` : `${c.name} уже ${gw(c, 'сыт', 'сыта')}. Еду лучше приберечь на потом`) }
    if (!spend(p, f.price, 'f')) return poor();
    q.f = clamp(Math.max(q.f, Math.min(top, q.f + f.f))); q.m = clamp(q.m + f.m);
    p.fed = dayNo(); dayMark(p, 'f');
    if (grown()) return;
    again(); petReact('ok'); ding(); pop(f.icon + '❤️'); say(f.en, 250, 'yummy');
  });
  if ($('#chg')) $('#chg').onclick = choosePet;
  if ($('#walk')) $('#walk').onclick = () => {
    if (!owns(p, 'leash')){ buzz(); return again('Чтобы гулять, нужен поводок 🦮. Он продаётся в магазине в разделе «Нужное»') }
    walk();
  };
  if ($('#nap')) $('#nap').onclick = () => {
    if (d.sl){ buzz(); return again(`Сегодня ${c.name} уже ${gw(c, 'спал', 'спала')}. Приходи завтра`) }
    const bed = owns(p, 'bed');
    q.e = clamp(q.e + (bed ? 70 : 30)); d.sl = 1;
    if (grown()) return;
    again(bed ? '' : `${c.name} ${gw(c, 'подремал', 'подремала')} на полу и ${gw(c, 'отдохнул', 'отдохнула')} только чуть-чуть. В кроватке 🛏️ сон гораздо лучше`);
    const pet = $('.pet'); if (pet){ pet.classList.add('nap'); setTimeout(() => pet.classList.remove('nap'), 2600) }
    pop('💤'); say('good night');
  };
  $$('.trick').forEach(b => b.onclick = () => {
    const t = TRICKS.find(x => x.en === b.dataset.t), pet = $('.pet');
    if (t.st > st){ buzz(); return }
    say(t.en);
    pet.classList.remove('jump', 'sad', 'dance', 'runx', 'nap'); void pet.offsetWidth; pet.classList.add(t.anim);
    clearTimeout(pet._tr); pet._tr = setTimeout(() => pet.classList.remove(t.anim), 1800);
    if ((d.tr || 0) < 5){ d.tr = (d.tr || 0) + 1; q.m = clamp(q.m + 3); q.e = clamp(q.e - 2); save() }
  });

  /* --- магазин --- */
  const buy = i => {
    if (!spend(p, i.price, cat[i.type])) return poor();
    p.own = [...(p.own || []), i.id]; if (p.goal === i.id) p.goal = null;
    save(); fanfare(); again(); say(i.en);
  };
  $$('.si[data-id]').forEach(b => b.onclick = () => {
    const id = b.dataset.id;
    if (id === 'freeze'){
      if ((p.fr || 0) >= FREEZE_MAX) return;
      if (!spend(p, FREEZE_PRICE, 'u')) return poor();
      p.fr = (p.fr || 0) + 1; save(); ding(); return again();
    }
    const i = SHOP.find(x => x.id === id);
    if (owns(p, id)) return say(i.en);
    if (b.dataset.locked){ buzz(); return again('Ярмарка работает только в субботу и воскресенье. Можно начать копить заранее 🎯') }
    if (bones(p) < i.price) return poor();
    const miss = SHOP.find(x => x.type === 'need' && !owns(p, x.id));
    if (i.type === 'fun' && miss)
      return askBox(`У ${esc(c.name)} ещё нет вещи «${miss.ru}» ${miss.icon} — ${miss.why}.<br>Точно потратить ${i.price} 🦴 на ${i.icon}?`, 'Всё равно купить', 'Сначала нужное', () => buy(i));
    if (i.type === 'fun' && goal && goal.id !== i.id)
      return askBox(`Ты копишь на ${goal.icon} <b>${esc(goal.en)}</b>.<br>Если купить ${i.icon} сейчас, до цели останется ${goal.price - (bones(p) - i.price)} 🦴 вместо ${Math.max(0, goal.price - bones(p))}.`, 'Всё равно купить', 'Подожду', () => buy(i));
    buy(i);
  });
  $$('[data-goal]').forEach(b => b.onclick = e => { e.stopPropagation(); p.goal = p.goal === b.dataset.goal ? null : b.dataset.goal; save(); ding(); again() });
  if ($('#nogoal')) $('#nogoal').onclick = () => { p.goal = null; save(); again() };
  $$('.si[data-w]').forEach(b => b.onclick = () => {
    const w = WALLS.find(x => x.id === b.dataset.w);
    if (w.price && !walls.includes(w.id)){
      if (!spend(p, w.price, 'x')) return poor();
      p.walls = [...walls, w.id]; ding();
    }
    p.wall = w.id; save(); again(); if (w.en) say(w.en);
  });

  /* --- копилка --- */
  $$('[data-pig]').forEach(b => b.onclick = () => {
    const n = +b.dataset.pig;
    if (bones(p) < n) return poor();
    p.b = bones(p) - n; p.pig = {n, d: dayNo()}; save(); ding(); again();
  });
  if ($('#pigout')) $('#pigout').onclick = () => {
    const pg = p.pig, ripe = dayNo() - pg.d >= 3, take = () => {
      p.b = bones(p) + pg.n; if (ripe) earn(p, Math.ceil(pg.n * .2));
      p.pig = null; save(); ripe ? fanfare() : ding(); again();
    };
    ripe ? take() : askBox(`Если подождать ещё ${3 - (dayNo() - pg.d)} дн., в копилке будет ${pg.n + Math.ceil(pg.n * .2)} 🦴 вместо ${pg.n}.`, 'Забрать сейчас', 'Подожду', take);
  };
  $$('.askg').forEach(b => b.onclick = async () => {
    const need = Math.min(50, Math.max(1, goal.price - bones(p)));
    const r = await post('/api/ask', {code: b.dataset.code, pid: p.id, name: p.name, n: need, item: goal.id});
    again(r && r.ok ? 'Просьба отправлена 🙏 Её увидят в рейтинге группы' : 'Не получилось отправить просьбу. Проверь интернет');
  });
}

function grew(stage){
  const p = me(), c = myPet(), tricks = TRICKS.filter(t => t.st === STAGES.indexOf(stage));
  render('grew', `
    <div class="stage" style="margin-top:24px"><div class="center">
      ${myPetHTML(p, 'jump dance')}
      <h1>${esc(c.name)} ${gw(c, 'вырос', 'выросла')}!</h1>
      <p class="sub" style="margin:0">Теперь ${gw(c, 'он', 'она')} — ${stageName(c, STAGES.indexOf(stage)).toLowerCase()}. Это потому, что ты хорошо заботишься 💛</p>
      ${tricks.length ? `<div class="gift">🎓 Новые команды: ${tricks.map(t => t.en).join(', ')}</div>` : ''}
      <button class="btn" id="go">Ура! →</button>
    </div></div>`);
  fanfare(); say(praise(c));
  $('#go').onclick = () => room('care');
}

function reportHTML(p){
  const now = led(p), was = p.lw && p.lw.w === now.w - 1 ? p.lw : null;
  const rows = [['f', '🍖', 'еда'], ['n', '🧰', 'нужное'], ['u', '💡', 'полезное'], ['x', '🎈', 'красивое'], ['g', '🎁', 'подарки']];
  const block = (l, title) => { const out = rows.reduce((a, r) => a + (l[r[0]] || 0), 0), max = Math.max(1, l.i, out);
    return `<div class="stage rep" style="margin-top:12px"><p class="task">${title}</p>
      <div class="rp"><span>заработано</span><i><b class="in" style="width:${l.i / max * 100}%"></b></i><em>+${l.i}</em></div>
      <div class="rp"><span>потрачено</span><i><b style="width:${out / max * 100}%"></b></i><em>−${out}</em></div>
      <div class="rp-cats">${rows.filter(r => l[r[0]]).map(r => `<span>${r[1]} ${r[2]} ${l[r[0]]}</span>`).join('') || '<span>трат не было</span>'}</div>
      ${out ? `<small>${l.x > l.f + l.n + l.u ? 'Больше всего ушло на красивое. Подумай: это то, чего ты хотел?' : l.u ? 'Часть косточек вложена в полезное — оно вернётся с прибавкой 👍' : 'Сначала нужное, потом остальное — так держать 👍'}</small>` : ''}</div>` };
  return block(now, 'Эта неделя') + (was ? block(was, 'Прошлая неделя') : '');
}

/* ================= Прогулка: пять вопросов по дороге ================= */
function walk(){
  const p = me(), c = myPet(), qs = duelQs(p).slice(0, 5);
  if (qs.length < 4){ buzz(); return room('care', 'Гулять можно после первого урока — по дороге встречаются знакомые слова') }
  render('walk', `
    <div class="lbar"><button class="x" id="x">✕</button><h2 style="margin:0;flex:1">Прогулка</h2><span style="width:46px"></span></div>
    <div class="stage"><div class="center">
      ${myPetHTML(p, 'jump')}
      <h2 style="margin:0">Let's go for a walk!</h2>
      <p class="sub" style="margin:0">Идём гулять! По дороге ${c.name} встретит ${qs.length} ${plural(qs.length, 'слово', 'слова', 'слов')} — помоги ему их узнать</p>
      <button class="btn" id="go">Пошли! 🐾</button>
    </div></div>`);
  say("let's go for a walk");
  $('#x').onclick = () => room('care');
  $('#go').onclick = () => playDuel(qs, r => {
    const q = petOf(p), d = today(p), gain = (d.w || 0) < 2 ? 35 : 10, right = r ? r.score : 0, got = right >= 4 ? 2 : 1;
    d.w = (d.w || 0) + 1;
    q.m = clamp(q.m + gain); q.e = clamp(q.e - 15); q.f = clamp(q.f - 5);
    earn(p, got); dayMark(p, 'r'); touchStreak(p); saveStat(p);
    const g = careTick(p); save();
    if (g) return grew(g);
    render('walkend', `
      <div class="stage" style="margin-top:24px"><div class="center">
        ${myPetHTML(p, 'jump dance')}
        <h1>${c.id === 'dog' ? 'Good dog!' : 'Good job!'}</h1>
        <p class="sub" style="margin:0">Погуляли! Узнано слов: ${right} из ${qs.length}</p>
        <div class="row"><span class="chip">💛 +${gain}</span><span class="chip">⚡ −15</span><span class="chip">🦴 +${got}</span></div>
        ${gain < 35 ? `<p class="sub" style="margin:0">Сегодня уже нагулялись — третья прогулка радует меньше</p>` : ''}
        <button class="btn" id="go">Домой →</button>
      </div></div>`);
    fanfare(); setTimeout(() => { if (screen === 'walkend') say(praise(c)) }, 600);
    $('#go').onclick = () => room('care');
  });
}

/* ================= Подарки, гости, общая цель ================= */
/* Что уходит на сервер о комнате ученика — чтобы к нему можно было зайти в гости */
function roomData(p){ const q = petOf(p); return {o: (p.own || []).slice(0, 40), w: p.wall || '', s: [Math.round(q.f), Math.round(q.m), Math.round(q.e)], st: stageNo(p)} }
const myGifts = p => ((srv && srv.gifts) || []).filter(g => g.pid === p.id && !(p.gt || []).includes(g.id));
const giftWhat = g => { const i = SHOP.find(x => x.id === g.val); return g.kind === 'b' ? `+${+g.val} 🦴` : g.kind === 't' ? `угощение для ${myPet().name} 🦴` : i ? `${i.icon} ${i.en}` : '🎁' };

function giftOpen(){
  const p = me(), g = myGifts(p)[0];
  if (!g) return home();
  const card = CARDS[g.card] || CARDS[0], i = SHOP.find(x => x.id === g.val), q = petOf(p);
  let what = giftWhat(g);
  if (g.kind === 'b') earn(p, Math.max(0, Math.min(20, +g.val || 0)));
  else if (g.kind === 't'){ q.f = clamp(q.f + 15); q.m = clamp(q.m + 10) }
  else if (i && !owns(p, i.id)) p.own = [...(p.own || []), i.id];
  else if (i){ earn(p, i.price); what = `${i.icon} у тебя уже есть — держи ${i.price} 🦴` }
  p.gt = [...(p.gt || []), g.id].slice(-40); save();
  post('/api/gift', {action: 'take', id: g.id});
  const more = myGifts(p).length;
  render('gift', `
    <div class="stage" style="margin-top:24px"><div class="center">
      <div class="bigem medal">🎁</div>
      <h2 style="margin:0">Подарок от ${esc(g.from || 'друга')}</h2>
      <div class="earned big">${what}</div>
      ${g.kind === 't' ? `<p class="sub" style="margin:0">К тебе заходили в гости и угостили ${myPet().name}</p>`
        : `<p class="bigword phr" style="font-size:clamp(24px,5vw,36px)">${esc(card.en)}</p><p class="ruhint" style="margin:0">${card.ru}</p>`}
      <button class="btn" id="go">${more ? `Ещё подарок (${more}) →` : 'Спасибо! →'}</button>
    </div></div>`);
  fanfare(); if (g.kind !== 't') setTimeout(() => { if (screen === 'gift') say(card.en) }, 600);
  $('#go').onclick = () => more ? giftOpen() : home();
}

const waitScr = text => render('wait', `<div class="center" style="margin-top:70px"><div class="bigem">🐾</div><p class="sub">${text}</p></div>`);
/* Меню участника группы в рейтинге */
function memberMenu(code, r){
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="mbox"><p><b>${esc(r.name)}</b></p><div class="row"><button class="btn" id="m-v">🏠 В гости</button><button class="btn" id="m-g">🎁 Подарить</button></div>
    <button class="link" id="m-x" style="margin-top:10px">Закрыть</button></div>`;
  app.appendChild(d);
  d.querySelector('#m-x').onclick = () => d.remove();
  d.querySelector('#m-v').onclick = () => { d.remove(); visit(code, r) };
  d.querySelector('#m-g').onclick = () => { d.remove(); giftTo(code, r) };
}

async function visit(code, r, note){
  waitScr('Иду в гости…');
  const v = await post('/api/visit', {code, ref: r.ref});
  if (!v || !v.room) { rating(); return }
  const pet = petById(v.char), s = v.room.s || [50, 50, 50], st = STAGES[v.room.st] || STAGES[0], avg = (s[0] + s[1] + s[2]) / 3;
  const bar = (icon, val) => `<div class="pb ${val < 35 ? 'low' : val >= 70 ? 'ok' : ''}"><span>${icon}</span><i><b style="width:${Math.max(3, val)}%"></b></i></div>`;
  render('visit', `
    <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">В гостях: ${esc(v.name)}</h2><span class="chip">🦴 ${bones(me())}</span></div>
    ${sceneHTML({char: v.char, stars: v.stars, own: v.room.o, wall: v.room.w, gs: st.gs, look: avg < 35 ? 'low' : '', fund: fundLevel(v.fund)})}
    <div class="pbars">${bar('🍖', s[0])}${bar('💛', s[1])}${bar('⚡', s[2])}</div>
    <p class="sub">${pet.name} · ${gw(pet, st.name, st.nameF)}${avg < 35 ? ' · тут грустно без угощения!' : ''}</p>
    ${note ? `<div class="note">${note}</div>` : ''}
    <div class="row">
      <button class="btn ${v.treated ? 'ghost' : ''}" id="treat">🦴 Угостить</button>
      <button class="btn ghost" id="gift">🎁 Подарить</button>
    </div>
    <p class="sub" style="margin:12px 0 0;font-size:14px">Угощать можно раз в день. Это бесплатно: питомцу друга — еда, тебе — 2 🦴 за доброту</p>`);
  $('#x').onclick = rating;
  $('.pet').onclick = () => { petReact('ok'); say(pet.hello) };
  $$('button.ri').forEach(b => b.onclick = () => { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); say(SHOP.find(i => i.id === b.dataset.id).en) });
  $('#gift').onclick = () => giftTo(code, r);
  $('#treat').onclick = async () => {
    if (v.treated){ buzz(); return visit(code, r, 'Сегодня ты уже угощал этого питомца. Приходи завтра') }
    const t = await post('/api/treat', {code, ref: r.ref, from: me().name});
    if (!t || !t.ok) return visit(code, r, t && t.why === 'today' ? 'Сегодня ты уже угощал этого питомца. Приходи завтра' : 'Не получилось. Проверь интернет');
    earn(me(), 2); save(); ding();
    visit(code, r, `${pet.name} говорит спасибо за угощение! Тебе +2 🦴 за доброту 💛`);
  };
}

function giftTo(code, r, preset){
  const p = me();
  let pick = {kind: 'b', val: preset ? Math.min(20, Math.max(5, Math.ceil(preset / 5) * 5)) : 5}, card = 0;
  const items = SHOP.filter(i => i.type === 'fun' && !i.rare);
  const draw = note => {
    const cost = pick.kind === 'b' ? pick.val : SHOP.find(i => i.id === pick.val).price;
    render('giftto', `
      <div class="lbar"><button class="x" id="x">←</button><h2 style="margin:0;flex:1">Подарок: ${esc(r.name)}</h2><span class="chip">🦴 ${bones(p)}</span></div>
      ${note ? `<div class="note">${note}</div>` : ''}
      <h3 class="sec" style="margin-top:6px">Косточки</h3>
      <div class="row" style="margin-top:12px">${[5, 10, 20].map(n => `<button class="chip pickp ${pick.kind === 'b' && pick.val === n ? 'on' : ''}" data-b="${n}">🦴 ${n}</button>`).join('')}</div>
      <h3 class="sec">Или вещь в комнату</h3>
      <div class="shop">${items.map(i => `<button class="si ${pick.val === i.id ? 'on' : bones(p) < i.price ? 'cant' : ''}" data-i="${i.id}"><i>${i.icon}</i><b>${esc(i.en)}</b><small>${i.ru}</small><span class="pr">🦴 ${i.price}</span></button>`).join('')}</div>
      <h3 class="sec">Открытка</h3>
      <div class="row" style="margin-top:12px">${CARDS.map((c, k) => `<button class="chip pickp ${k === card ? 'on' : ''}" data-c="${k}">${esc(c.en)}</button>`).join('')}</div>
      <p class="sub" style="margin:8px 0 0">${CARDS[card].ru}</p>
      <div class="center" style="margin-top:18px"><button class="btn" id="send">Подарить за ${cost} 🦴</button></div>`);
    $('#x').onclick = rating;
    $$('[data-b]').forEach(b => b.onclick = () => { pick = {kind: 'b', val: +b.dataset.b}; keep() });
    $$('[data-i]').forEach(b => b.onclick = () => { pick = {kind: 'i', val: b.dataset.i}; say(SHOP.find(i => i.id === pick.val).en); keep() });
    $$('[data-c]').forEach(b => b.onclick = () => { card = +b.dataset.c; say(CARDS[card].en); keep() });
    $('#send').onclick = async () => {
      if (!spend(p, cost, 'g')){ buzz(); return draw('Не хватает косточек 🦴') }
      save(); waitScr('Отправляю подарок…');
      const res = await post('/api/gift', {code, ref: r.ref, kind: pick.kind, val: pick.val, card, from: p.name});
      if (!res || !res.ok){
        p.b = bones(p) + cost; led(p).g -= cost; save();                      // не ушло — возвращаем косточки
        return draw(res && res.why === 'limit' ? 'Сегодня ты уже подарил 5 подарков. Остальные — завтра' : 'Подарок не отправился. Проверь интернет');
      }
      p.kind = 1; save();
      render('giftsent', `
        <div class="stage" style="margin-top:24px"><div class="center">
          <div class="bigem medal">🎁</div><h1>Подарок отправлен!</h1>
          <p class="sub" style="margin:0">${esc(r.name)} увидит его, когда откроет игру. Дарить — здорово 💛</p>
          <button class="btn" id="go">Готово →</button>
        </div></div>`);
      fanfare(); $('#go').onclick = rating;
    };
  };
  const keep = () => { const y = window.scrollY; draw(); window.scrollTo(0, y) };
  draw();
}

/* Блок группы в рейтинге: общая цель и просьбы о помощи. b — ответ сервера по группе */
function socialHTML(b){
  if (!b || !b.fund) return '';
  const total = b.fund.total || 0, lvl = fundLevel(total), next = FUND[lvl], prev = lvl ? FUND[lvl - 1].need : 0;
  return `
    <h3 class="sec">🏗️ Общая цель</h3>
    <div class="stage" style="margin-top:12px">
      ${next ? `<p class="task">${next.icon} ${next.name}</p>
          <div class="toybar big"><i style="width:${Math.max(3, Math.round((total - prev) / (next.need - prev) * 100))}%"></i></div>
          <p class="sub" style="margin:8px 0 12px">Собрано ${total} из ${next.need} 🦴. Когда соберёте, ${next.name.toLowerCase()} появится во дворе у каждого</p>
          <div class="row">${[5, 10, 20].map(n => `<button class="btn ${bones(me()) < n ? 'ghost' : ''}" data-fund="${n}">+${n} 🦴</button>`).join('')}</div>`
        : `<p class="task">🏰 Всё построено! Вы молодцы</p>`}
      ${lvl ? `<p class="sub" style="margin:12px 0 0">Уже построено: ${FUND.slice(0, lvl).map(f => f.icon + ' ' + f.name).join(', ')}</p>` : ''}
      ${b.fund.parts && b.fund.parts.length ? `<div class="rp-cats" style="margin-top:12px">${b.fund.parts.map(x => `<span>${esc(x.name)}: ${x.n}</span>`).join('')}</div>` : ''}
    </div>
    ${b.asks && b.asks.length ? `<h3 class="sec">🙏 Просьбы</h3><div class="board" style="margin-top:12px">${b.asks.map((a, k) => { const i = SHOP.find(x => x.id === a.item); return `<div class="brow">
        <span class="bn">${esc(a.name)} копит на ${i ? i.icon + ' ' + i.en : 'мечту'} <small>· не хватает ${a.n} 🦴</small></span>
        ${a.mine ? '<span class="bs">твоя просьба</span>' : `<button class="chip" data-ask="${k}">Помочь</button>`}</div>` }).join('')}</div>` : ''}`;
}
function wireSocial(g, b, redraw){
  $$('.brow[data-ref]').forEach(el => el.onclick = () => memberMenu(g.code, b.rows[+el.dataset.k]));
  $$('[data-ask]').forEach(el => el.onclick = () => { const a = b.asks[+el.dataset.ask]; giftTo(g.code, {ref: a.ref, name: a.name}, a.n) });
  $$('[data-fund]').forEach(el => el.onclick = async () => {
    const p = me(), n = +el.dataset.fund;
    if (!spend(p, n, 'g')){ buzz(); return }
    save();
    const before = fundLevel(b.fund.total);
    const r = await post('/api/fund', {code: g.code, pid: p.id, name: p.name, n});
    if (!r || !r.fund){ p.b = bones(p) + n; led(p).g -= n; save(); buzz(); return redraw() }
    b.fund = r.fund; g.fund = r.fund.total; p.kind = 1; save();
    fundLevel(r.fund.total) > before ? fanfare() : ding();
    redraw();
  });
}
