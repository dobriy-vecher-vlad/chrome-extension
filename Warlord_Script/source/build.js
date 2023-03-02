const archiver = require('archiver');
const colors = require('colors');
const fs = require('fs-extra');
const tryCatch = (action = () => {}, silent = false) => {
	try {
		action();
	} catch (error) {
		!silent&&console.log(colors.red(error.message));
	}
};
const date = new Date().toLocaleString("ru", {
	timezone: 'UTC',
	year: 'numeric',
	month: 'numeric',
	day: 'numeric'
}).replace(/(\d*).(\d*).(\d*)/g, '$1.$2.$3');
const getFiles = async(dir, totalFiles) => {
	totalFiles = totalFiles || [];
	let files = fs.readdirSync(dir);
	for (let key in files) {
		let name = `${dir}/${files[key]}`;
		fs.statSync(name).isDirectory() ? getFiles(name, totalFiles) : totalFiles.push(name);
	}
	return totalFiles;
};
const appDirectory = fs.realpathSync(process.cwd());
const paths = {
	appPath: appDirectory,
	appBuild: appDirectory + '\\build',
	appSrc: appDirectory + '\\src',
	scriptBuild: appDirectory + '\\script',
	scriptSource: appDirectory + '\\source',
};
const { manifest } = require(`${paths.appSrc}\\constants`);
const archive = archiver('zip');
(() => tryCatch(async() => {
	let build = 0;
	console.log('Creating script build...');
	tryCatch(() => fs.mkdirSync(paths.scriptBuild), true);
	tryCatch(() => fs.emptyDirSync(paths.scriptBuild));
	tryCatch(() => fs.mkdirSync(`${paths.scriptBuild}\\img`));
	for (const image of ['icon', 'icon-48', 'icon-128', 'icon-250']) fs.copyFileSync(`${paths.scriptSource}\\img\\${image}.png`, `${paths.scriptBuild}\\img\\${image}.png`);
	const files = await getFiles(paths.appBuild) || [];
	for (const file of files.filter(key => /(\.js|\.css)$/.exec(key)).map(key => ({
		path: key,
		name: /.*\/(.*)/.exec(key)[1],
		type: ['css', 'js'].map(type => key.includes(`.${type}`) ? type : '').join(''),
	}))) {
		build = /\.(.*)\./.exec(file.name)[1];
		tryCatch(() => fs.writeFileSync(`${paths.scriptBuild}/${({ css: 'style.css', js: 'script.js' })[file.type]}`, ''));
		tryCatch(() => fs.copyFileSync(file.path, `${paths.scriptBuild}/${({ css: 'style.css', js: 'script.js' })[file.type]}`));
	}
	tryCatch(() => fs.rmSync(paths.appBuild, { recursive: true, force: true }));
	manifest.version_name = `${manifest.version} (${build})`;
	tryCatch(() => fs.writeFileSync(`${paths.scriptBuild}\\manifest.json`, JSON.stringify(manifest, null, '\t')));
	console.log(colors.green('Compiled successfully.'));
	console.log();
	console.log('Creating script zip...');
	let stream = fs.createWriteStream(`${paths.appPath}/build.zip`);
	archive.directory(paths.scriptBuild, false);
	archive.pipe(stream);
	stream.on('close', () => {
		tryCatch(() => fs.renameSync(`${paths.appPath}/build.zip`, `${paths.scriptBuild}/build.zip`));
		console.log(colors.green('Compiled successfully.'));
	});
	archive.finalize();
}))();