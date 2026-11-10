import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';
import { zipSync } from 'fflate';
import { purgeVkuiCss } from '../../scripts/purgeCss.mjs';

// Сборка заглушки так же, как у основного расширения: build/ целиком генерируется, public/ копируется как есть, content.js
// собирается из src/, а архив для публикации лежит в build/. Зависимости (esbuild, React, VKUI) берутся из node_modules
// основного проекта (папка выше), поэтому отдельная установка не нужна.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'build');
const ZIP = 'build.zip';

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(join(ROOT, 'public'), OUT, { recursive: true });

// Собственный CSS (src/*.css) перед вшиванием строкой сжимаем: в нём комментарии. vkui.css уже сжат
const minifyOwnCss = {
	name: 'minify-own-css',
	setup(b) {
		b.onLoad({ filter: /placeholder[\\/]src[\\/].*\.css$/ }, async ({ path }) => {
			const { code } = await transform(await readFile(path, 'utf8'), { loader: 'css', minify: true, target: 'chrome110' });
			return { contents: code, loader: 'text' };
		});
	},
};

// vkui.css — стили всех компонентов VKUI, заглушке нужна только кнопка. Пока purgeSource (собранный JS) не известен, файл
// отдаётся целиком, а после пробной сборки из него вырезаются правила классов, которых в JS нет (см. scripts/purgeCss.mjs)
let purgeSource = null;
const vkuiCss = {
	name: 'vkui-css',
	setup(b) {
		b.onLoad({ filter: /vkui[\\/]dist[\\/]vkui\.css$/ }, async ({ path }) => {
			const css = await readFile(path, 'utf8');
			return { contents: purgeSource === null ? css : purgeVkuiCss(css, purgeSource), loader: 'text' };
		});
	},
};

const options = {
	absWorkingDir: ROOT,
	entryPoints: { content: 'src/main.jsx' },
	outdir: OUT,
	bundle: true,
	format: 'iife',
	target: 'chrome110',
	jsx: 'automatic',
	// CSS подключаем строкой: стили живут в Shadow DOM, а не в странице ВК
	loader: { '.css': 'text' },
	plugins: [minifyOwnCss, vkuiCss],
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	minify: true,
	legalComments: 'none',
	logLevel: 'info',
};

// Все файлы папки: { 'путь/внутри/архива': содержимое }. Пути через «/», как требует zip
async function collect(dir, prefix = '') {
	const files = {};
	for (const name of await readdir(dir)) {
		const path = join(dir, name);
		const entry = posix.join(prefix, name);
		if ((await stat(path)).isDirectory()) Object.assign(files, await collect(path, entry));
		else files[entry] = new Uint8Array(await readFile(path));
	}
	return files;
}

// Сначала пробная сборка без стилей VKUI: по ней видно, какие классы компонентов используются на самом деле
purgeSource = '';
const trial = await build({ ...options, minify: false, write: false, logLevel: 'silent' });
purgeSource = trial.outputFiles.map((file) => file.text).join('\n');
await build(options);

// Архив для публикации: внутри сами файлы расширения, без родительской папки build. Лежит в build/
const files = await collect(OUT);
await writeFile(join(OUT, ZIP), zipSync(files, { level: 9 }));
console.log(`placeholder/build/${ZIP}: ${Object.keys(files).length} файлов`);
