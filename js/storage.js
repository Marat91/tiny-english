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

const me = () => db.profiles.find(p => p.id === db.cur);
const total = p => Object.values(p.stars).reduce((a,b) => a + b, 0);
const dayStr = d => { const z = n => String(n).padStart(2,'0'); return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate()) };
function touchStreak(p){
  const today = dayStr(new Date());
  if (p.last === today) return;
  const y = dayStr(new Date(Date.now() - 864e5));
  p.streak = p.last === y ? (p.streak || 0) + 1 : 1;
  p.last = today;
}
function liveStreak(p){
  const today = dayStr(new Date()), y = dayStr(new Date(Date.now() - 864e5));
  return (p.last === today || p.last === y) ? (p.streak || 0) : 0;
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
function loadCloudRev(done){
  if (!cloud || !db.profiles.length) return done();
  let fin = false;
  const end = () => { if (!fin){ fin = true; done() } };
  setTimeout(end, 2000);
  try {
    cloud.getItems(db.profiles.map(p => 'rev_' + p.id), (err, vals) => {
      if (!err && vals) for (const p of db.profiles){
        try {
          const r = JSON.parse(vals['rev_' + p.id] || 'null');
          if (r && r.m && (r.ts || 0) > ((rev[p.id] || {}).ts || 0)) rev[p.id] = r;
        } catch(e){}
      }
      try { localStorage.setItem(REV_KEY, JSON.stringify(rev)) } catch(e){}
      end();
    });
  } catch(e){ end() }
}
