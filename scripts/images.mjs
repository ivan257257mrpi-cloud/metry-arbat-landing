// Готовит изображения для сайта: исходники из media/ -> public/img/*.webp в нескольких ширинах.
// Запуск: npm run images
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'media');
const OUT = path.join(ROOT, 'public', 'img');

const PHOTO = [800, 1600, 2400];
const PLAN = [1000, 2000];

// Все файлы из media/<папка>/<имя>.png превращаются в public/img/<имя>-<ширина>.webp
const GROUPS = { renders: PHOTO, before: PHOTO, arbat: PHOTO, plans: PLAN };

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

let done = 0;
for (const [dir, widths] of Object.entries(GROUPS)) {
  for (const file of await fs.readdir(path.join(SRC, dir))) {
    const name = path.parse(file).name;
    let input = await fs.readFile(path.join(SRC, dir, file));
    // у планировок обрезаем пустые поля вокруг схемы
    if (dir === 'plans') {
      input = await sharp(input).trim({ background: '#e7e7e7', threshold: 40 })
        .extend({ top: 40, bottom: 40, left: 40, right: 40, background: '#e7e7e7' }).flatten({ background: '#e7e7e7' }).png().toBuffer();
    }
    for (const w of widths) {
      await sharp(input)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: dir === 'plans' ? 90 : 78, effort: 5, alphaQuality: 90 })
        .toFile(path.join(OUT, `${name}-${w}.webp`));
    }
    done++;
    console.log(`✓ ${dir}/${name}`);
  }
}

// Логотип и иконка сайта лежат в media/brand и копируются без изменений
for (const file of await fs.readdir(path.join(SRC, 'brand'))) {
  await fs.copyFile(path.join(SRC, 'brand', file), path.join(OUT, file));
}

console.log(`Готово: ${done} изображений`);
