// Перед публикацией на GitHub Pages убираем серверные файлы:
// PHP там не выполняется, а config.php с вебхуком Битрикс24 оказался бы в открытом доступе.
import fs from 'node:fs';
for (const f of ['config.php', 'send.php', '.htaccess']) fs.rmSync(`dist/${f}`, { force: true });
fs.writeFileSync('dist/.nojekyll', '');
