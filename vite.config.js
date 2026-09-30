import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const IMG_DIR = path.resolve(import.meta.dirname, 'public/img');

// <img data-img="facade-night"> -> добавляет src и srcset по файлам public/img/facade-night-{w}.webp
function responsiveImages() {
  return {
    name: 'responsive-images',
    transformIndexHtml(html) {
      const files = fs.readdirSync(IMG_DIR);
      return html.replace(/data-img="([\w-]+)"/g, (m, name) => {
        const widths = files
          .map((f) => f.match(new RegExp(`^${name}-(\\d+)\\.webp$`)))
          .filter(Boolean)
          .map((x) => Number(x[1]))
          .sort((a, b) => a - b);
        if (!widths.length) throw new Error(`Нет изображения: ${name}`);
        const mid = widths.find((w) => w >= 1600) ?? widths.at(-1);
        const srcset = widths.map((w) => `img/${name}-${w}.webp ${w}w`).join(', ');
        return `src="img/${name}-${mid}.webp" srcset="${srcset}" data-full="img/${name}-${widths.at(-1)}.webp"`;
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [responsiveImages()],
  build: { assetsInlineLimit: 0 },
});
