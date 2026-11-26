// Записывает озвучку английских слов и русских заданий. Звук разложен по файлам, чтобы игра не качала всё сразу:
//   audio/core.js      — буквы, задания по-русски, похвала, игры и всё общее (грузится при старте)
//   audio/read.js      — уроки чтения и книжки (грузится, когда пройден алфавит)
//   audio/t-<тема>.js  — слова, фразы, разговоры и истории одной темы (грузится, когда тема открыта)
//   audio/index.js     — список файлов с отметкой версии; index.html подключает его с новой отметкой после каждой сборки
// Работает только на Mac (использует системный голос).  Запуск из папки проекта:
//   node tools/build-audio.mjs
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/* Берём самый разборчивый из установленных голосов. Голоса Premium / Enhanced звучат гораздо чище —
   скачать: Системные настройки → Универсальный доступ → Устная речь → Системный голос → Управлять голосами. */
const installed = execFileSync('say', ['-v', '?'], {encoding: 'utf8'}).split('\n').map(l => l.split(/\s{2,}/)[0].trim()).filter(Boolean);
const best = prefs => prefs.find(v => installed.includes(v));
const VOICE = process.env.VOICE || best(['Ava (Premium)', 'Zoe (Premium)', 'Evan (Premium)', 'Ava (Enhanced)', 'Samantha (Enhanced)', 'Allison (Enhanced)', 'Samantha']);
const RU_VOICE = process.env.RU_VOICE || best(['Milena (Premium)', 'Katya (Premium)', 'Milena (Enhanced)', 'Katya (Enhanced)', 'Yuri (Enhanced)', 'Milena']);
const RATE = process.env.RATE || '130', RU_RATE = process.env.RU_RATE || '150', BITRATE = process.env.BITRATE || '48000';
/* короткая тишина в начале: на телефонах и Bluetooth-наушниках иначе «съедается» первый звук слова */
const LEAD = '[[slnc 120]] ';
console.log(`Голоса: ${VOICE} / ${RU_VOICE}`);

const chars = readdirSync(join(root, 'js/characters')).filter(f => f.endsWith('.js')).map(f => 'js/characters/' + f);
const code = ['js/data.js', 'js/characters.js', ...chars].map(f => readFileSync(join(root, f), 'utf8')).join('\n;\n');
const D = vm.runInNewContext(code + "\n;({LETTERS, TOPICS, PRAISE, CHARACTERS, HINTS, PHRASES, EXTRA, READ, DIALOGS, STORIES, GRAMMAR, RHYMES, SIGHT, BOOKS, SCENES, ROLEPLAYS})");

/* В какой файл попадает фраза: побеждает первый, поэтому общее (core) раскладываем первым */
const bucketOf = new Map();
const put = (bucket, text) => { const k = text.toLowerCase(); if (!bucketOf.has(k)) bucketOf.set(k, {bucket, text}) };
// буквы диктуем строчными: одиночную заглавную голос читает как «capital A»
D.LETTERS.forEach(l => { put('core', l.l); put('core', l.word) });
D.PRAISE.forEach(p => put('core', p.en));
D.EXTRA.forEach(t => put('core', t));
D.CHARACTERS.forEach(c => put('core', c.hello));
put('core', "Let's play!");
D.READ.flat().forEach(x => put('read', x.en));
D.SIGHT.flat().forEach(x => { put('read', x.en); put('read', x.ex) });
// в книжках каждое слово нажимается отдельно
D.BOOKS.forEach(b => b.pages.forEach(pg => { put('read', pg.en); pg.en.toLowerCase().match(/[a-z']+/g).forEach(w => put('read', w)) }));
const T = id => 't-' + id;
D.TOPICS.forEach(t => t.lessons.flat().forEach(w => put(T(t.id), w.en)));
D.PHRASES.forEach(ph => ph.set.forEach(x => put(T(ph.topic), x.en)));
D.DIALOGS.forEach(d => d.set.forEach(x => { put(T(d.after), x.q); put(T(d.after), x.en) }));
D.SCENES.forEach(sc => sc.items.forEach(it => put(T(sc.after), it.say)));
D.ROLEPLAYS.forEach(r => r.lines.forEach(l => { put(T(r.after), l.en); (l.opts || []).forEach(o => put(T(r.after), o.en)) }));
D.GRAMMAR.forEach(g => g.set.forEach(x => put(T(g.after), x.en)));
D.RHYMES.forEach(r => r.lines.forEach(l => put(T(r.after), l.en)));
D.STORIES.forEach(s => { s.pages.forEach(pg => put(T(s.after), pg.en)); s.quiz.forEach(q => put(T(s.after), q.q)) });

/* Уже записанное берём из прошлой сборки, если голоса и настройки те же (FULL=1 — перезаписать всё) */
const META = {VOICE, RU_VOICE, RATE, RU_RATE, BITRATE, LEAD};
let old = {};
for (const f of readdirSync(join(root, 'audio')).filter(f => f.endsWith('.js'))){
  try {
    const prev = vm.runInNewContext(readFileSync(join(root, 'audio', f), 'utf8').replace(/window\./g, 'this.') + ';this', {});
    if (prev.AUDIO_META && JSON.stringify(prev.AUDIO_META) !== JSON.stringify(META)) { old = {}; break }
    Object.assign(old, prev.AUDIO_PACK || {});
  } catch(e){}
}
if (process.env.FULL) old = {};

const tmp = mkdtempSync(join(tmpdir(), 'tiny-audio-'));
const record = (voice, rate, text) => {
  const aiff = join(tmp, 'a.aiff'), m4a = join(tmp, 'a.m4a');
  execFileSync('say', ['-v', voice, '-r', rate, '-o', aiff, LEAD + text]);
  execFileSync('afconvert', [aiff, '-o', m4a, '-f', 'm4af', '-d', 'aac', '-b', BITRATE, '-c', '1']);
  return readFileSync(m4a).toString('base64');
};
const packs = {};
const into = (bucket, k, v) => { (packs[bucket] = packs[bucket] || {})[k] = v };
let n = 0, reused = 0;
for (const [k, {bucket, text}] of bucketOf){
  if (old[k]) { into(bucket, k, old[k]); reused++; continue }
  into(bucket, k, record(VOICE, RATE, text)); n++;
}
// задания по-русски; ru#… — по какому тексту записано задание
for (const [type, text] of Object.entries(D.HINTS)){
  into('core', 'ru#' + type, text);
  if (old['ru:' + type] && old['ru#' + type] === text){ into('core', 'ru:' + type, old['ru:' + type]); reused++; continue }
  into('core', 'ru:' + type, record(RU_VOICE, RU_RATE, text)); n++;
}
rmSync(tmp, { recursive: true, force: true });

/* Файлы звука и список с отметкой версии (по содержимому — меняется, только если звук поменялся) */
const files = {};
let bytes = 0;
for (const [bucket, pack] of Object.entries(packs)){
  const body = '/* Сгенерировано tools/build-audio.mjs — не править вручную */\nwindow.AUDIO_PACK = Object.assign(window.AUDIO_PACK || {}, ' + JSON.stringify(pack) + ');\n';
  writeFileSync(join(root, 'audio', bucket + '.js'), body);
  files[bucket] = bucket + '.js?h=' + createHash('sha1').update(body).digest('hex').slice(0, 10);
  bytes += body.length;
}
const index = '/* Сгенерировано tools/build-audio.mjs — не править вручную */\nwindow.AUDIO_META = ' + JSON.stringify(META) + ';\nwindow.AUDIO_FILES = ' + JSON.stringify(files) + ';\n';
writeFileSync(join(root, 'audio/index.js'), index);
const html = join(root, 'index.html'), h = createHash('sha1').update(index).digest('hex').slice(0, 10);
writeFileSync(html, readFileSync(html, 'utf8').replace(/<script src="audio\/(?:pack|index)\.js[^"]*"( async)?><\/script>/, `<script src="audio/index.js?h=${h}"></script>`));
console.log(`Новых записей: ${n}, взято из прошлой сборки: ${reused}`);
console.log(`Файлов звука: ${Object.keys(files).length}, всего ${(bytes / 1048576).toFixed(1)} МБ; общий файл core — ${(JSON.stringify(packs.core).length / 1048576).toFixed(1)} МБ`);
if (existsSync(join(root, 'audio/pack.js'))) console.log('Старый audio/pack.js больше не нужен — его можно удалить из репозитория');
