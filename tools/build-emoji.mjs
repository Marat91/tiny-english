// Объёмные картинки вместо эмодзи телефона. Берёт из набора Microsoft Fluent Emoji 3D (лицензия MIT)
// только те эмодзи, что встречаются в игре, и кладёт их в img/e/<код>.webp; список — в js/emoji.js.
// Набор картинок скачивается отдельно (один раз):
//   mkdir -p /tmp/emoji3d && cd /tmp/emoji3d && npm pack @lobehub/fluent-emoji-3d@1.1.0 && tar -xzf lobehub-fluent-emoji-3d-1.1.0.tgz
// Запуск из папки проекта:
//   EMOJI_SRC=/tmp/emoji3d/package/assets node tools/build-emoji.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.env.EMOJI_SRC;
if (!src || !existsSync(src)) { console.error('Укажите папку с картинками: EMOJI_SRC=…/package/assets'); process.exit(1) }

const files = ['index.html', ...readdirSync(join(root, 'js')).filter(f => f.endsWith('.js') && f !== 'emoji.js').map(f => 'js/' + f),
  ...readdirSync(join(root, 'js/characters')).map(f => 'js/characters/' + f)];
const text = files.map(f => readFileSync(join(root, f), 'utf8')).join('\n');

const isEmoji = /\p{Extended_Pictographic}|⃣/u;
const code = g => [...g].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-');
const have = new Set(readdirSync(src).map(f => f.replace(/\.webp$/, '')));
const out = join(root, 'img/e');
mkdirSync(out, { recursive: true });

const found = new Set(), missing = new Set();
for (const { segment: g } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)){
  if (!isEmoji.test(g)) continue;
  const c = code(g), plain = c.replace(/-fe0f/g, '');
  /* в наборе код бывает с fe0f (знак «показать как эмодзи») и без него */
  const file = have.has(c) ? c : have.has(plain) ? plain : have.has(c + '-fe0f') ? c + '-fe0f' : null;
  if (file) found.add(file); else missing.add(g);
}
let bytes = 0;
for (const f of found){ copyFileSync(join(src, f + '.webp'), join(out, f + '.webp')); bytes += statSync(join(out, f + '.webp')).size }
writeFileSync(join(root, 'js/emoji.js'),
  '/* Сгенерировано tools/build-emoji.mjs — не править вручную. Какие эмодзи есть объёмными картинками в img/e */\nconst EMOJI3D = new Set(' + JSON.stringify([...found].sort()) + ');\n');
console.log(`Картинок: ${found.size}, ${(bytes / 1024).toFixed(0)} КБ → img/e`);
if (missing.size) console.log('Нет в наборе (останутся обычными эмодзи):', [...missing].join(' '));
