const script = {
	id: 'warlord',
	title: 'Warlord',
	version: '3.0.0',
	settings: {
		showBanners: true,
		server: 1,
	},
};
const manifest = {
	action: {
		deafaul_icon: 'img/icon.png',
		defalut_title: `${script.title} Script`,
	},
	content_scripts: [{
		matches: ['*://vk.com/*'],
		js: ['script.js'],
	}],
	description: `Расширение для ВКонтакте, которое позволяет смотреть характеристики игроков игры «${script.title}».`,
	icons: {
		16: 'img/icon.png',
		48: 'img/icon-48.png',
		128: 'img/icon-128.png',
	},
	manifest_version: 3,
	name: `${script.title} Script`,
	host_permissions: ['*://tmp1-fb.geronimo.su/*'],
	update_url: 'https://clients2.google.com/service/update2/crx',
	version: script.version,
};

module.exports = { script, manifest };