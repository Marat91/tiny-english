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
const VOICE = process.env.VOICE || 'Samantha', RATE = process.env.RATE || '150';

const chars = readdirSync(join(root, 'js/characters')).filter(f => f.endsWith('.js')).map(f => 'js/characters/' + f);
const code = ['js/data.js', 'js/characters.js', ...chars].map(f => readFileSync(join(root, f), 'utf8')).join('\n;\n');
const { LETTERS, TOPICS, PRAISE, CHARACTERS, HINTS } = vm.runInNewContext(code + '\n;({LETTERS, TOPICS, PRAISE, CHARACTERS, HINTS})');
const RU_VOICE = process.env.RU_VOICE || 'Milena', RU_RATE = process.env.RU_RATE || '170';

const texts = new Set();
LETTERS.forEach(l => { texts.add(l.u); texts.add(l.word) });
TOPICS.forEach(t => t.lessons.flat().forEach(w => texts.add(w.en)));
PRAISE.forEach(p => texts.add(p.en));
CHARACTERS.forEach(c => texts.add(c.hello));
["Let's play!"].forEach(t => texts.add(t));

const tmp = mkdtempSync(join(tmpdir(), 'tiny-audio-'));
const pack = {};
let n = 0, bytes = 0;
for (const text of texts){
  const aiff = join(tmp, 'a.aiff'), m4a = join(tmp, 'a.m4a');
  execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', aiff, text]);
  execFileSync('afconvert', [aiff, '-o', m4a, '-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1']);
  const buf = readFileSync(m4a);
  pack[text.toLowerCase()] = buf.toString('base64');
  n++; bytes += buf.length;
}
// задания по-русски
for (const [type, text] of Object.entries(HINTS)){
  const aiff = join(tmp, 'r.aiff'), m4a = join(tmp, 'r.m4a');
  execFileSync('say', ['-v', RU_VOICE, '-r', RU_RATE, '-o', aiff, text]);
  execFileSync('afconvert', [aiff, '-o', m4a, '-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1']);
  const buf = readFileSync(m4a);
  pack['ru:' + type] = buf.toString('base64');
  n++; bytes += buf.length;
}
rmSync(tmp, { recursive: true, force: true });

writeFileSync(join(root, 'audio/pack.js'),
  '/* Сгенерировано tools/build-audio.mjs — не править вручную */\nwindow.AUDIO_PACK = ' + JSON.stringify(pack) + ';\n');
console.log(`Записано ${n} фраз, ${(bytes / 1024).toFixed(0)} КБ звука → audio/pack.js`);
