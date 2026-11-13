/* Связь с сервером: общий рейтинг семьи и напоминания. Работает только внутри Telegram —
   сервер узнаёт пользователя по подписи Telegram (initData), паролей и регистрации нет. */
let srv = null;                       // последний ответ сервера: {remind_on, remind_hour, public, groups}
const online = () => !!(API_URL && tg && tg.initData);

/* Запрос к серверу; вернёт null, если сервера нет или он ответил ошибкой */
async function post(path, body){
  if (!online()) return null;
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST', headers: {'content-type': 'text/plain'},
      body: JSON.stringify({initData: tg.initData, ...body}),
    });
    return r.ok ? await r.json() : null;
  } catch(e){ return null }
}
/* Запрос, который возвращает настройки и список групп — запоминаем их в srv */
async function call(path, body){
  const r = await post(path, body);
  if (r) srv = r;
  if (r && 'photo' in r && (r.photo || '') !== myPhoto){               // сервер нашёл (или потерял) настоящее фото
    myPhoto = r.photo || '';
    try { localStorage.setItem(PHOTO_KEY, myPhoto) } catch(e){}
    if (screen === 'home') home(); else if (screen === 'profiles') profiles();
  }
  return r;
}

const syncServer = () => call('/api/sync', {
  tz: new Date().getTimezoneOffset(),
  profiles: db.profiles.map(p => ({id: p.id, name: p.name, avatar: p.avatar, char: p.char, stars: total(p), streak: liveStreak(p), last: p.last})),
});

let syncTimer = 0;
function queueSync(){ if (!online()) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncServer, 1500) }
