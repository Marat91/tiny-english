/* Прогресс: хранится на устройстве и, если игра открыта внутри Telegram, дублируется
   в облако Telegram (CloudStorage) — тогда он доступен с любого устройства того же аккаунта. */
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor('#f3f5fd'); tg.setBackgroundColor('#f3f5fd') } catch(e){} }

const KEY = 'tiny-v2', OLD_KEY = 'buddy-v1', MAX_PROFILES = 8, CLOUD_LIMIT = 4096;

function readLocal(){
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.profiles) return d;
    const o = JSON.parse(localStorage.getItem(OLD_KEY));          // прогресс из первой версии
    if (o && o.profiles){
      o.profiles.forEach(p => {
        const s = {};
        for (const k in p.stars) s[/^\d+$/.test(k) ? 'abc:' + k : k] = p.stars[k];
        p.stars = s; p.char = p.char || 'dog';
      });
      o.ts = 0;
      return o;
    }
  } catch(e){}
  return null;
}
let db = readLocal() || {profiles:[], cur:null, ts:0};

const cloud = (() => {
  try { return tg && tg.initData && tg.isVersionAtLeast('6.9') && tg.CloudStorage || null } catch(e){ return null }
})();

function save(){
  db.ts = Date.now();
  const s = JSON.stringify(db);
  try { localStorage.setItem(KEY, s) } catch(e){}
  if (cloud && s.length <= CLOUD_LIMIT) { try { cloud.setItem(KEY, s) } catch(e){} }
  if (typeof queueSync === 'function') queueSync();                 // и на сервер, для семейного рейтинга
}

/* Забирает прогресс из облака, если он новее локального. done(true) — данные заменены. */
function loadCloud(done){
  if (!cloud) return done(false);
  let fin = false;
  const end = changed => { if (!fin){ fin = true; done(changed) } };
  setTimeout(() => end(false), 2500);
  try {
    cloud.getItem(KEY, (err, val) => {
      if (!err && val){
        try {
          const r = JSON.parse(val);
          if (r && r.profiles && (r.ts || 0) > (db.ts || 0)){
            db = r;
            try { localStorage.setItem(KEY, val) } catch(e){}
            return end(true);
          }
        } catch(e){}
      }
      if (db.profiles.length) save();                               // локальный новее — отправляем в облако
      end(false);
    });
  } catch(e){ end(false) }
}

/* Иконка ученика: эмодзи или 'tg' — фото из профиля Telegram (если его нет или оно скрыто — смайлик) */
const tgPhoto = () => { try { const u = tg.initDataUnsafe.user.photo_url; return /^https:\/\//.test(u) ? u : '' } catch(e){ return '' } };
function av(a, photo){
  if (a !== 'tg') return String(a || '🙂').replace(/[&<>"']/g, '');
  /* photo не передан — это ученик с этого устройства, берём своё фото; передан пустым — чужой игрок без фото */
  const src = photo === undefined ? tgPhoto() : /^https:\/\//.test(photo || '') ? photo : '';
  return src ? `<img class="avimg" src="${src.replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';')}" alt="" onerror="this.replaceWith('🙂')">` : '🙂';
}

let playAs = null;                                                  // в дуэли на одном устройстве ходит другой ученик
const me = () => db.profiles.find(p => p.id === (playAs || db.cur));
const total = p => Object.values(p.stars).reduce((a,b) => a + b, 0);
const dayStr = d => { const z = n => String(n).padStart(2,'0'); return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate()) };
const DAY0 = Date.UTC(2026, 0, 1);
const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000 - DAY0) / 864e5);   // номер сегодняшнего дня
/* Серия дней. Если пропущен ровно один день и есть «заморозка» (p.fr) — серия не сгорает. */
function touchStreak(p){
  const today = dayStr(new Date());
  if (p.last === today) return;
  const y = dayStr(new Date(Date.now() - 864e5)), y2 = dayStr(new Date(Date.now() - 2 * 864e5));
  if (p.last === y) p.streak = (p.streak || 0) + 1;
  else if (p.last === y2 && p.fr > 0 && p.streak > 0){ p.fr--; p.streak++ }
  else p.streak = 1;
  p.last = today;
  p.ms = Math.max(p.ms || 0, p.streak);                             // рекорд серии
}
function liveStreak(p){
  const today = dayStr(new Date()), y = dayStr(new Date(Date.now() - 864e5)), y2 = dayStr(new Date(Date.now() - 2 * 864e5));
  return (p.last === today || p.last === y || (p.last === y2 && p.fr > 0)) ? (p.streak || 0) : 0;
}

/* Повторение: для каждого выученного слова — «коробка» (0–5) и номер дня следующего показа.
   Хранится отдельно от основного прогресса, по одному ключу на профиль. */
const REV_KEY = 'tiny-rev-v1';
let rev = (() => { try { return JSON.parse(localStorage.getItem(REV_KEY)) || {} } catch(e){ return {} } })();
const revOf = p => rev[p.id] || (rev[p.id] = {ts: 0, m: {}});
function saveRev(p){
  const r = revOf(p); r.ts = Date.now();
  try { localStorage.setItem(REV_KEY, JSON.stringify(rev)) } catch(e){}
  if (cloud){
    const s = JSON.stringify(r);
    if (s.length <= CLOUD_LIMIT) { try { cloud.setItem('rev_' + p.id, s) } catch(e){} }
  }
}
/* Статистика для родителей: сколько ответов и ошибок, в какие дни занимались, какие слова даются трудно.
   a — ответов, e — ошибок, x — {слово: сколько раз ошибся}, d — {номер дня: ответов}. */
const ST_KEY = 'tiny-st-v1';
let stat = (() => { try { return JSON.parse(localStorage.getItem(ST_KEY)) || {} } catch(e){ return {} } })();
const statOf = p => stat[p.id] || (stat[p.id] = {ts: 0, a: 0, e: 0, x: {}, d: {}});
function track(p, key, ok){
  if (!p) return;
  const s = statOf(p), d = dayNo();
  s.a++; s.d[d] = (s.d[d] || 0) + 1;
  if (!ok){ s.e++; s.x[key] = (s.x[key] || 0) + 1 }
  else if (s.x[key]){ if (--s.x[key] <= 0) delete s.x[key] }       // ответил верно — слово перестаёт быть трудным
  try { localStorage.setItem(ST_KEY, JSON.stringify(stat)) } catch(e){}
}
function saveStat(p){
  const s = statOf(p), d = dayNo(); s.ts = Date.now();
  for (const k in s.d) if (+k < d - 60) delete s.d[k];
  const top = Object.entries(s.x).sort((a, b) => b[1] - a[1]).slice(0, 40);
  s.x = Object.fromEntries(top);
  try { localStorage.setItem(ST_KEY, JSON.stringify(stat)) } catch(e){}
  if (cloud){
    const j = JSON.stringify(s);
    if (j.length <= CLOUD_LIMIT) { try { cloud.setItem('st_' + p.id, j) } catch(e){} }
  }
}

function loadCloudRev(done){
  if (!cloud || !db.profiles.length) return done();
  let fin = false;
  const end = () => { if (!fin){ fin = true; done() } };
  setTimeout(end, 2000);
  try {
    cloud.getItems(db.profiles.flatMap(p => ['rev_' + p.id, 'st_' + p.id]), (err, vals) => {
      if (!err && vals) for (const p of db.profiles){
        try {
          const r = JSON.parse(vals['rev_' + p.id] || 'null');
          if (r && r.m && (r.ts || 0) > ((rev[p.id] || {}).ts || 0)) rev[p.id] = r;
          const s = JSON.parse(vals['st_' + p.id] || 'null');
          if (s && s.d && s.x && (s.ts || 0) > ((stat[p.id] || {}).ts || 0)) stat[p.id] = s;
        } catch(e){}
      }
      try { localStorage.setItem(REV_KEY, JSON.stringify(rev)); localStorage.setItem(ST_KEY, JSON.stringify(stat)) } catch(e){}
      end();
    });
  } catch(e){ end() }
}
