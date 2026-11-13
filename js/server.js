/* Связь с сервером: общий рейтинг семьи и напоминания. Работает только внутри Telegram —
   сервер узнаёт пользователя по подписи Telegram (initData), паролей и регистрации нет. */
let srv = null;                       // последний ответ сервера: {remind_on, remind_hour, family, board}
const online = () => !!(API_URL && tg && tg.initData);

async function call(path, body){
  if (!online()) return null;
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST', headers: {'content-type': 'text/plain'},
      body: JSON.stringify({initData: tg.initData, ...body}),
    });
    if (!r.ok) return null;
    srv = await r.json();
    return srv;
  } catch(e){ return null }
}

const syncServer = () => call('/api/sync', {
  tz: new Date().getTimezoneOffset(),
  profiles: db.profiles.map(p => ({id: p.id, name: p.name, avatar: p.avatar, char: p.char, stars: total(p), streak: liveStreak(p), last: p.last})),
});

let syncTimer = 0;
function queueSync(){ if (!online()) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncServer, 1500) }
