import { XMLParser } from 'fast-xml-parser';
import { HUB_URL } from '../../shared/lib/gameHub.js';
import { send } from '../../shared/lib/messaging.js';
import { VERSION } from './settings.js';
import BOSSES from '../data/bosses.json';

// Данные игрока для блока характеристик: запросы к серверам игры и разбор ответов.
// Формат ответов и поля разбираются так же, как в исходном Warlord Script: от этого зависит всё, что показывает блок.

export const STATUSES_URL = 'https://dobriy-vecher-vlad.github.io/warlord/wl_status.json';
export const PATH_IMAGES = 'https://dobriy-vecher-vlad.github.io/warlord-helper/media/images/';
const BAD_NAME = 'Я - Клоун';
const RATE_LIMIT_RETRIES = 10;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
const isObject = (value) => typeof value === 'object' && !Array.isArray(value);

const parser = new XMLParser({
	preserveOrder: false,
	attributeNamePrefix: '',
	attributesGroupName: false,
	ignoreAttributes: false,
	removeNSPrefix: true,
	allowBooleanAttributes: true,
	parseTagValue: true,
	parseAttributeValue: true,
	trimValues: true,
	cdataPropName: false,
	commentPropName: false,
});

// Ответ сервера: JSON или XML (в кавычках атрибутов бывают символы, ломающие разбор, их экранируем).
// Запрос идёт через background: из страницы ВК он упирается в CORS.
export async function getData(link) {
	for (let attempt = 0; attempt < RATE_LIMIT_RETRIES; attempt++) {
		const result = await send({ type: 'fetch', url: link.replace(/%2B/g, '+').replace(/%3D/g, '=') });
		if (!result.ok) {
			if (result.error === 'rate limit') {
				await wait(1000);
				continue;
			}
			return null;
		}
		try {
			let data;
			try {
				data = JSON.parse(result.text);
			} catch {
				const escaped = result.text.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3) => `"${(p3 || p2 || '').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
				data = parser.parse(escaped);
			}
			return data && data.data ? data.data : data;
		} catch {
			return null;
		}
	}
	return null;
}

// Объявление «Устаревшая версия»: версия расширения не совпадает с актуальной из файла статусов (пустой список, если совпадает
// или актуальная не указана)
const outdatedVersion = (latest) => (latest && VERSION && VERSION !== String(latest)
	? [{ header: 'Устаревшая версия', subheader: `Вы используете ${VERSION}, актуальная ${latest}` }]
	: []);

const calcTag = (name) => {
	if (name) {
		const search = /^(.+?) /.exec(name.replace(/{|}|\[|]|-|_/g, ' ').replace(/ +/g, ' ').replace(/^\s/g, ''));
		name = search?.[1]?.length < 5 ? search[1] : '';
	}
	return (name || '').slice(0, 3);
};

// Пустые значения (в том числе нули) из игрока убираются, как в исходном расширении
const removeEmptyObject = (object) => {
	for (const prop of Object.getOwnPropertyNames(object)) {
		const value = object[prop];
		if (value == false || value == null || String(value) === 'NaN' || (Array.isArray(value) && value.includes(NaN))) delete object[prop];
	}
	return object;
};

const clanDate = (value) => Number(value.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2) - 1, Number(p1)).getTime()));

export function parseUser(user = {}, statuses = false) {
	user = {
		id: Number(user.id), // номер игрового профиля
		vkId: Number(user.vkId) || Number(user.id), // номер профиля
		exp: Number(user.exp), // опыт
		lvl: Number(user.lvl), // уровень
		name: user.name || user.n, // имя
		avatar: Number(user.aid), // аватар
		room: Number(user.room), // задний фон
		date: [Number(user.bd) * 1000, Number(user.l_t) * 1000, Number(user.clan_d) * 1000], // [первый вход, последний вход, участие в гильдии]
		hp: Number(user.end) + Number(user.endi), // выносливость
		dmg: Number(user.dmgi) || Number(user.dd), // урон
		guild: Number(user.clan_id) || false, // номер гильдии
		rang: Number(user.clan_r) || false, // ранг в гильдии
		premium: Number(user.va) === 1, // наличие премиума
		location: Number(user.loc), // номер активной локации
		pet: Number(user.pet) || false, // номер питомца
		skills: [Number(user.end), Number(user.s1), Number(user.s2), Number(user.s3), Number(user.s4)], // выносливость, свирепый удар, блок щитом, невидимый удар, мастер целитель
		league: Number(user.al), // номер лиги арены
		cups: Number(user.ap), // кубки арены
		chest: Number(user.a_c) || false, // сундук арены
		...user.constants,
	};
	user.name = (user.name || '').replace(/\s/g, '').length ? user.name.trim() : `Player${user.id}`;
	if (statuses) {
		user.name = statuses.nickBLOCK.includes(user.vkId) ? BAD_NAME : user.name;
		user.name = Object.keys(statuses.nickCUSTOM).map((key) => parseInt(key)).includes(user.vkId) ? statuses.nickCUSTOM[user.vkId] : user.name;
		user.isVerified = statuses.statusGREEN.includes(user.vkId);
		user.isAdmin = statuses.scriptADMIN.includes(user.vkId);
		user.isBad = statuses.statusRED.includes(user.vkId) || statuses.statusORANGE.includes(user.vkId) || statuses.statusYELLOW.includes(user.vkId);
	}
	user.isGeneral = user.rang === 2;
	user.isLeader = user.rang === 1;
	user.tag = calcTag(user.name);
	return removeEmptyObject(user);
}

function parseFight(fight = {}, statuses = false) {
	if (Number(fight.dmg) === 0) return false;
	fight = {
		boss: {
			id: Number(fight.eid),
			name: fight.name,
			dmg: Number(fight.dmg),
			hp: Number(fight.mhp),
		},
		id: Number(fight.fid),
		hp: Number(fight.hp),
		members: asArray(fight.users),
		creator: {},
		limit: 0,
		timeout: Number(fight.time) * 1000,
	};
	fight.members = fight.members.map((user) => parseUser(user, statuses));
	fight.creator = fight.members[0];
	fight.limit = fight.boss.id === 291 ? 175 : 300;
	return fight;
}

const listOf = (value) => (value && value.length ? value : [...isObject(value) ? [value] : value]);

function parseClan(clan = {}, statuses = false) {
	clan.mmbrs = { u: listOf(clan?.mmbrs?.u || []) };
	clan.inv = { u: listOf(clan?.inv?.u || []) };
	clan.hist = { h: listOf(clan?.hist?.h || []) };
	clan.info1 = { c: listOf(clan?.info1?.c || []) };
	clan.info7 = { c: listOf(clan?.info7?.c || []) };
	const history = (type) => clan.hist.h.filter((hist) => Number(hist?.t) === type);
	clan = {
		id: Number(clan.id), // номер
		name: clan.name, // название
		lvl: Number(clan.lvl) + 2, // уровень
		leader: Number(clan.leader), // номер лидера
		invitations: clan.inv.u.length, // количество приглашений
		actions: {
			create: history(4).map((hist) => ({ time: clanDate(hist.d) })), // создание гильдии
			members: history(0).map((hist) => ({ id: Number(hist.v1), time: clanDate(hist.d) })), // новый участник
			bosses: history(23).map((hist) => ({ id: Number(hist.v2), time: clanDate(hist.d) })), // боссы
			wars: {
				to: history(18).map((hist) => ({
					id: Number(hist.v2),
					guild: Number(hist.v1) !== 0, // гильдия
					title: hist.v4, // название
					win: Number(hist.v3) !== 0, // победа
					time: clanDate(hist.d),
				})), // нападение
				from: history(19).map((hist) => ({
					id: Number(hist.v2),
					guild: Number(hist.v1) !== 0,
					title: hist.v4,
					win: Number(hist.v3) === 0,
					time: clanDate(hist.d),
				})), // оборона
			}, // боевые действия
			upgrades: history(17).map((hist) => ({ id: Number(hist.v2), lvl: Number(hist.v3), time: clanDate(hist.d) })), // улучшения
			treasury: {
				day: [...clan.info1.c], // день
				week: [...clan.info7.c], // неделя
			}, // пополнение казны
		}, // действия активности
		academy: [Number(clan.u1), Number(clan.u2), Number(clan.u3), Number(clan.u4), Number(clan.u5), Number(clan.u6)], // академия
		treasury: [Number(clan.m1), Number(clan.m3)], // казна
		guard: [Number(clan.wu1), Number(clan.wu2)], // стража
		ram: [Number(clan.wu3), Number(clan.wu4)], // таран
		builds: clan.bldngs.b.map((item) => Number(item.lvl)), // постройки
		members: clan.mmbrs.u, // участники
	};
	clan.members = clan.members.map((user) => parseUser(user, statuses));
	const deposits = (list) => list.map((hist) => {
		const user = clan.members.find((member) => member.id === Number(hist.id));
		if (user) return { user, currency: Number(hist.t), amount: Number(hist.v) };
		return undefined;
	}).filter(Boolean);
	clan.actions.treasury.day = deposits(clan.actions.treasury.day);
	clan.actions.treasury.week = deposits(clan.actions.treasury.week);
	clan.leader = clan.members.find((user) => user.id === clan.leader) || 0;
	return clan;
}

function parseClanWar(war = {}, statuses = false) {
	const units = asArray(war?.u);
	const side = (number) => units.filter((user) => user.side == number).map((user) => (user.type == 5
		? { id: user.id, name: user.n, aid: user.ava, constants: { dmg: user.dd } }
		: { ...BOSSES.find((boss) => boss.id == user.id), dmg: user.dd, bot: true }));
	const attackers = units.filter((user) => user.side == 1 && user.type == 5).length;
	const members = [side(1), side(2)].map((list) => list.map((user) => (!user.bot ? parseUser(user, statuses) : user)));
	return {
		id: Number(war.id), // номер
		name: war.en, // название
		involved: attackers, // количество людей в набеге
		treasury: [Number(war.l1), Number(war.l3)], // казна
		reward: [Math.floor(Number(war.l1) / attackers), Math.floor(Number(war.l3) / attackers)], // награда на одного участника
		members, // участники
	};
}

// Загрузка всего, что показывает блок. onHint — подсказка о текущем шаге, settings — какие секции включены.
// При ошибке бросает LoadError: у неё есть сообщение и список остальных серверов игрока (если успели получить).
export class LoadError extends Error {
	constructor(message, servers = null) {
		super(message);
		this.servers = servers;
	}
}

export async function loadPlayer({ from, to, server: serverId, settings, onHint }) {
	let otherServers = null;
	const fail = (message) => { throw new LoadError(message, otherServers); };
	onHint('Получаем номер профиля');
	if (!from && to) from = to;
	if (!to && from) to = from;
	if (!from || !to) fail('Ошибка при получении номера профиля');
	// файл статусов (github.io) и список серверов (сервер игры) не зависят друг от друга: запрашиваем одновременно
	onHint('Получаем статусы и сервер');
	let [status, hub] = await Promise.all([
		getData(`${STATUSES_URL}?${+new Date()}`),
		getData(`${HUB_URL}?api_uid=${to}&api_type=vk`),
	]);
	if (!status || typeof status !== 'object') fail('Ошибка при получении статусов');
	if (status.statusBLOCK.includes(from)) fail('Для вас доступ к скрипту ограничен');
	if (status.statuses[serverId - 1].statusINVISIBLE.includes(to) && from !== to && !status.statuses[serverId - 1].scriptADMIN.includes(from)) fail('Информация игрока скрыта');
	status = {
		...status.statuses[serverId - 1],
		scriptUPDATE: status.scriptUPDATE, // актуальная версия расширения
		api_vk_id: status.api_vk_id,
		api_id: status.api_id,
		api_vk_auth_key: status.api_vk_auth_key,
		api_vk_sslt: status.api_vk_sslt,
	};
	if (!hub?.s) fail('Ошибка при выборе сервера игры');
	let servers = [];
	for (const item of asArray(hub.s)) {
		if (Number(item.uid) !== 0) {
			servers.push({
				id: Number(item.id),
				title: item.n,
				link: item.url,
				user: parseUser({ name: item.un, lvl: item.ulvl, id: item.uid, vkId: to }, status),
			});
		}
	}
	const server = servers.find((item) => item.id === Number(serverId));
	servers = servers.filter((item) => item !== server);
	otherServers = servers;
	if (!server) fail('Игрок не зарегистрирован на сервере');
	onHint('Получаем информацию игрока');
	let profile = await getData(`https://${server.link}udata.php?user=${to}`);
	if (/зарегистрирован/.exec(profile)) fail('Игрок не зарегистрирован на сервере');
	if (!profile?.u) fail('Ошибка при чтении данных персонажа');
	const gameUrl = (query) => `https://${server.link}game.php?api_uid=${status.api_vk_id}&UID=${status.api_vk_uid}&api_type=vk&api_id=${status.api_id}&auth_key=${status.api_vk_auth_key}&${query}&sslt=${status.api_vk_sslt}`;
	// Данные набега нужны только в подсказке к событию, поэтому их запрашиваем по требованию, когда на событие навели курсор
	// (раньше все набеги загружались сразу, по запросу на каждый: из-за ограничения сервера в один запрос в секунду это занимало
	// десятки секунд). Результат запоминается.
	const wars = new Map();
	const loadWar = (id) => {
		if (!wars.has(id)) {
			wars.set(id, getData(gameUrl(`i=106&t=${id}`)).then((data) => {
				const war = data?.cwar ? parseClanWar(data.cwar, status) : null;
				return war?.id ? war : null;
			}).catch(() => null)); // подсказка покажет, что данные набега не загрузились
		}
		return wars.get(id);
	};
	let clan = false;
	if (settings.showGuild || settings.showGuildUpgrades || settings.showGuildPersonnel || settings.showGuildEvents || settings.showGuildDeposits) {
		if (Number(profile.u.clan_id) !== 0) {
			onHint('Получаем информацию гильдии');
			const clanData = await getData(gameUrl(`i=49&t1=${profile.u.clan_id}`));
			if (!clanData?.clan) fail('Ошибка при чтении данных гильдии');
			clan = parseClan(clanData.clan, status);
		}
	}
	onHint('Получаем информацию боя');
	const fight = profile.fight ? parseFight(profile.fight, status) : false;
	profile = parseUser(profile.u, status);
	const banners = [
		...status.statusRED.includes(to) ? [{
			header: 'Замечен в суде',
			subheader: 'Посмотри запись в суде и будь осторожен с ним',
			link: `https://vk.ru/wall-133931816?q=${to}`,
			image: 'https://i.yapx.ru/MPz2R.gif',
		}] : [],
		...status.statusGREEN.includes(to) ? [{
			header: 'Порядочный игрок',
			subheader: 'Доверенное и подтверждённое лицо',
			image: 'https://i.yapx.ru/MP0H1.gif',
		}] : [],
		...status.statusORANGE.includes(to) ? [{
			header: 'Замечен в суде, но претензии сняты',
			subheader: 'Посмотри запись в суде и будь осторожен с ним',
			link: `https://vk.ru/wall-133931816?q=${to}`,
			image: 'https://i.yapx.ru/MP0OL.gif',
		}] : [],
		...status.statusYELLOW.includes(to) ? [{
			header: 'Неадекватное поведение',
			subheader: 'Избегай контакта с ним',
			image: 'https://i.yapx.ru/MP0Wz.gif',
		}] : [],
		...status.statusAnimate[to] ? [{ image: status.statusAnimate[to].href }] : [],
		...(profile.guild && status.statusGUILD[profile.guild] && !status.statusGUILD_ban.includes(to)) ? [{ image: status.statusGUILD[profile.guild] }] : [],
	];
	return {
		profile,
		clan,
		fight,
		servers,
		loadWar,
		// Если версия расширения не совпадает с актуальной из файла статусов, первым объявлением сообщаем об этом
		statuses: { actions: [...outdatedVersion(status.scriptUPDATE), ...status?.actions || []], banners },
	};
}
