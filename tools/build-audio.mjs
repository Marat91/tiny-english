// Записывает озвучку всех английских слов из js/data.js и персонажей в один файл audio/pack.js.
// Работает только на Mac (использует системный голос).  Запуск из папки проекта:
//   node tools/build-audio.mjs
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
const { LETTERS, TOPICS, PRAISE, CHARACTERS, HINTS, PHRASES, EXTRA, READ, DIALOGS, STORIES, GRAMMAR, RHYMES } = vm.runInNewContext(code + "\n;({LETTERS, TOPICS, PRAISE, CHARACTERS, HINTS, PHRASES, EXTRA, READ, DIALOGS, STORIES, GRAMMAR, RHYMES})");

const texts = new Set();
// буквы диктуем строчными: одиночную заглавную голос читает как «capital A»
LETTERS.forEach(l => { texts.add(l.l); texts.add(l.word) });
TOPICS.forEach(t => t.lessons.flat().forEach(w => texts.add(w.en)));
PHRASES.forEach(ph => ph.set.forEach(x => texts.add(x.en)));
PRAISE.forEach(p => texts.add(p.en));
EXTRA.forEach(t => texts.add(t));
READ.flat().forEach(x => texts.add(x.en));
DIALOGS.forEach(d => d.set.forEach(x => { texts.add(x.q); texts.add(x.en) }));
GRAMMAR.forEach(g => g.set.forEach(x => texts.add(x.en)));
RHYMES.forEach(r => r.lines.forEach(l => texts.add(l.en)));
STORIES.forEach(s => { s.pages.forEach(pg => texts.add(pg.en)); s.quiz.forEach(q => texts.add(q.q)) });
CHARACTERS.forEach(c => texts.add(c.hello));
["Let's play!"].forEach(t => texts.add(t));

/* Уже записанное берём из прошлой сборки, если голоса и настройки те же (FULL=1 — перезаписать всё) */
const META = {VOICE, RU_VOICE, RATE, RU_RATE, BITRATE, LEAD};
let old = {};
try {
  const prev = vm.runInNewContext(readFileSync(join(root, 'audio/pack.js'), 'utf8').replace(/window\./g, 'this.') + ';this', {});
  if (!process.env.FULL && JSON.stringify(prev.AUDIO_META) === JSON.stringify(META)) old = prev.AUDIO_PACK || {};
} catch(e){}
const tmp = mkdtempSync(join(tmpdir(), 'tiny-audio-'));
const pack = {};
let reused = 0;
let n = 0, bytes = 0;
for (const text of texts){
  if (old[text.toLowerCase()]){ pack[text.toLowerCase()] = old[text.toLowerCase()]; reused++; continue }
  const aiff = join(tmp, 'a.aiff'), m4a = join(tmp, 'a.m4a');
  execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', aiff, LEAD + text]);
  execFileSync('afconvert', [aiff, '-o', m4a, '-f', 'm4af', '-d', 'aac', '-b', BITRATE, '-c', '1']);
  const buf = readFileSync(m4a);
  pack[text.toLowerCase()] = buf.toString('base64');
  n++; bytes += buf.length;
}
// задания по-русски
for (const [type, text] of Object.entries(HINTS)){
  // ru#… — по какому тексту записано задание
  if (old['ru:' + type] && old['ru#' + type] === text){ pack['ru:' + type] = old['ru:' + type]; pack['ru#' + type] = text; reused++; continue }
  pack['ru#' + type] = text;
  const aiff = join(tmp, 'r.aiff'), m4a = join(tmp, 'r.m4a');
  execFileSync('say', ['-v', RU_VOICE, '-r', RU_RATE, '-o', aiff, LEAD + text]);
  execFileSync('afconvert', [aiff, '-o', m4a, '-f', 'm4af', '-d', 'aac', '-b', BITRATE, '-c', '1']);
  const buf = readFileSync(m4a);
  pack['ru:' + type] = buf.toString('base64');
  n++; bytes += buf.length;
}
rmSync(tmp, { recursive: true, force: true });

writeFileSync(join(root, 'audio/pack.js'),
  '/* Сгенерировано tools/build-audio.mjs — не править вручную */\nwindow.AUDIO_META = ' + JSON.stringify(META) + ';\nwindow.AUDIO_PACK = ' + JSON.stringify(pack) + ';\n');
console.log(`Новых записей: ${n}, взято из прошлой сборки: ${reused}`);
console.log(`Записано ${n} фраз, ${(bytes / 1024).toFixed(0)} КБ звука → audio/pack.js`);
