/* Звук. Слова берутся из записанного набора audio/pack.js (работает везде, в том числе
   в Telegram на Android). Если записи нет — пробуем встроенный голос устройства. */
const canSpeak = 'speechSynthesis' in window;
let voice = null;
function pickVoice(){
  const v = speechSynthesis.getVoices();
  voice = v.find(x => /en[-_]US/i.test(x.lang) && /Samantha|Google US|Aria|Jenny|Ava/i.test(x.name))
       || v.find(x => /^en[-_]US/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null;
}
if (canSpeak){ try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice } catch(e){} }

const player = new Audio();
let sayToken = 0;
const clipFor = t => window.AUDIO_PACK && window.AUDIO_PACK[t.toLowerCase()];
const hasSound = () => canSpeak || !!window.AUDIO_PACK;

function hush(){
  sayToken++;
  try { player.pause() } catch(e){}
  if (canSpeak) { try { speechSynthesis.cancel() } catch(e){} }
}
function tts(text, done){
  if (!canSpeak) { done && done(); return }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; if (voice) u.voice = voice; u.rate = 0.75;
  u.onend = () => done && done();
  speechSynthesis.speak(u);
}
/* say('A', 'apple') — произносит по очереди; новый вызов обрывает предыдущий.
   Число в списке — пауза; 'ru:<вид>' — задание по-русски из записи. */
function say(...texts){
  hush();
  const my = sayToken;
  let i = 0;
  const next = () => {
    if (my !== sayToken || i >= texts.length) return;
    const t = texts[i++];
    if (typeof t === 'number') return setTimeout(next, t);       // пауза в миллисекундах
    const clip = clipFor(t);
    if (!clip) return t.startsWith('ru:') ? next() : tts(t, next); // русские задания есть только в записи
    player.onended = next;
    player.onerror = () => { if (my === sayToken) tts(t, next) };
    player.src = 'data:audio/mp4;base64,' + clip;
    const p = player.play();
    if (p && p.catch) p.catch(() => { if (my === sayToken) tts(t, next) });
  };
  next();
}

let ac;
function tone(f, d, type, t0){
  try{
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    const t = ac.currentTime + (t0 || 0);
    g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.start(t); o.stop(t + d);
  }catch(e){}
}
const ding = () => { tone(660,.15); tone(880,.25,'sine',.12) };
const buzz = () => tone(180,.25,'triangle');
const fanfare = () => [523,659,784,1047].forEach((f,i) => tone(f,.3,'sine',i*.14));
