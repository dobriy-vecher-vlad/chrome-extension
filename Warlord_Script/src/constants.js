const script = {
	id: 'warlord',
	title: 'Warlord',
	version: '3.0.0',
	statuses: 'https://dobriy-vecher-vlad.github.io/warlord/wl_status.json',
	logos: [
		'https://dobriy-vecher-vlad.github.io/warlord/media/label_wl.jpg',
		'https://dobriy-vecher-vlad.github.io/warlord/media/label_inv.jpg',
		'https://dobriy-vecher-vlad.github.io/warlord/media/label_dl.jpg',
		'https://dobriy-vecher-vlad.github.io/warlord/media/label_tt.jpg',
	],
	group: {
		title: 'WARLORD: База Знаний',
		logo: 'https://dobriy-vecher-vlad.github.io/warlord/media/label_wl.jpg',
		link: 'https://vk.com/wiki.warlord',
	},
	settings: {
		selectedServer: 1,
		showBanners: true,
		showServers: true,
		showSkills: true,
		showExtra: true,
		showGuild: true,
		showGuildUpgrades: true,
		showGuildPersonnel: true,
		showGuildEvents: true,
		showGuildDeposits: true,
		showFight: true,
		sortingGuildPersonnel: 1,
		constructor: {
			title: 'Settings',
			columns: [[{
				top: 'Отображаемые блоки',
				checkboxes: [{
					id: 'showBanners',
					title: 'Баннеры и статусы',
					description: 'Блок с баннерами и статусами игрока',
				}, {
					id: 'showServers',
					title: 'Сервер',
					description: 'Блок с быстрым переходом к серверу',
				}, {
					id: 'showSkills',
					title: 'Навыки игрока',
					description: 'Блок с навыками игрока',
				}, {
					id: 'showExtra',
					title: 'Характеристики игрока',
					description: 'Блок с характеристиками игрока',
				}, {
					id: 'showGuild',
					title: 'Информация гильдии',
					description: 'Блок с информацией гильдии игрока',
				}, {
					id: 'showGuildUpgrades',
					title: 'Улучшения гильдии',
					description: 'Блок с улучшениями гильдии игрока',
				}, {
					id: 'showGuildPersonnel',
					title: 'Состав гильдии',
					description: 'Блок с составом гильдии игрока',
				}, {
					id: 'showGuildEvents',
					title: 'События гильдии',
					description: 'Блок с событиями гильдии игрока',
				}, {
					id: 'showGuildDeposits',
					title: 'Пополнения гильдии',
					description: 'Блок с пополнениями гильдии игрока',
				}, {
					id: 'showFight',
					title: 'Состояние боя',
					description: 'Блок с информацией по активному бою игрока',
				}],
			}], [{
				top: 'Сортировка состава',
				radios: [{
					id: 'sortingGuildPersonnel',
					title: 'Ранг',
					description: 'От лидера до рекрута',
				}, {
					id: 'sortingGuildPersonnel',
					title: 'Урон',
					description: 'От большего к меньшему',
				}, {
					id: 'sortingGuildPersonnel',
					title: 'Здоровье',
					description: 'От большего к меньшему',
				}],
			}, {
				top: 'Сервер игры',
				radios: [{
					id: 'selectedServer',
					title: 'Эрмун',
					description: 'geronimo.su/warlord_vk',
				}, {
					id: 'selectedServer',
					title: 'Антарес',
					description: 'geronimo.su/warlord_vk2',
				}],
			}]],
		},
	},
};
const manifest = {
	// Required
	manifest_version: 3,
	name: `${script.title} Script (beta)`,
	version: script.version,

	// Recommended
	action: {
		deafaul_icon: 'img/icon.png',
		defalut_title: `${script.title} Script`,
	},
	description: `Расширение для ВКонтакте, которое позволяет смотреть характеристики игроков игры «${script.title}».`,
	icons: {
		16: 'img/icon.png',
		48: 'img/icon-48.png',
		128: 'img/icon-128.png',
	},

	// Optional
	author: script.group.link,
	content_scripts: [{
		matches: ['*://vk.com/*', '*://vk.ru/*'],
		js: ['script.js'],
	}],
	host_permissions: ['*://tmp1-fb.geronimo.su/*'],
	version_name: '',
	update_url: 'https://clients2.google.com/service/update2/crx',
};

module.exports = { script, manifest };