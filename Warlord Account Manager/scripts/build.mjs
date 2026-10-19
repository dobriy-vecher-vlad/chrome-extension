import { watch as watchFiles } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { build, context, transform } from 'esbuild';
import { zipSync } from 'fflate';

const isWatch = process.argv.includes('--watch');
const OUT = 'build';
const ZIP = 'build.zip';

// 1. build/ целиком генерируется: если папка есть, чистим её, иначе создаём
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// 2. Статичные файлы расширения (манифест, background, стили, иконки) лежат в public/ и копируются как есть,
// content.js собирается из src/
await cp('public', OUT, { recursive: true });

// Собственные CSS (src/*.css) перед вшиванием строкой сжимаем: в них много комментариев. vkui.css уже сжат
const minifyOwnCss = {
	name: 'minify-own-css',
	setup(b) {
		b.onLoad({ filter: /[\\/]src[\\/].*\.css$/ }, async ({ path }) => {
			const { code } = await transform(await readFile(path, 'utf8'), { loader: 'css', minify: !isWatch, target: 'chrome110' });
			return { contents: code, loader: 'text' };
		});
	},
};

const options = {
	entryPoints: ['src/content.jsx'],
	outfile: `${OUT}/content.js`,
	bundle: true,
	format: 'iife',
	target: 'chrome110',
	jsx: 'automatic',
	// CSS подключаем строкой: стили живут в Shadow DOM, а не в странице ВК
	loader: { '.css': 'text' },
	plugins: [minifyOwnCss],
	define: { 'process.env.NODE_ENV': JSON.stringify(isWatch ? 'development' : 'production') },
	minify: !isWatch,
	sourcemap: isWatch ? 'inline' : false,
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

if (isWatch) {
	const ctx = await context(options);
	await ctx.watch();
	// правки в public/ (манифест, background.js, иконки) тоже подхватываем: копируем заново, content.js не трогаем
	let timer;
	watchFiles('public', { recursive: true }, () => {
		clearTimeout(timer);
		timer = setTimeout(() => cp('public', OUT, { recursive: true }).then(() => console.log('public/ скопирована')), 100);
	});
	console.log('watching…');
} else {
	await build(options);

	// 3. Архив для публикации: внутри сами файлы расширения, без родительской папки build. Лежит в build/
	const files = await collect(OUT);
	await writeFile(join(OUT, ZIP), zipSync(files, { level: 9 }));
	console.log(`${OUT}/${ZIP}: ${Object.keys(files).length} файлов`);
}
