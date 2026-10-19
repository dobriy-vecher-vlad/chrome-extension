import { HUB_URL } from '../../shared/lib/gameHub.js';
import { send } from '../../shared/lib/messaging.js';

const APP_ID = 5536422;
const PREFERRED_SERVER = 1; // 1 — Эрмун, 2 — Антарес; если игрока на нём нет, берём первый доступный

// Сервер игры отвечает то JSON, то XML (поля лежат в атрибутах): приводим к обычному объекту.
function xmlToObj(el) {
	const obj = {};
	for (const attr of el.attributes) obj[attr.name] = attr.value;
	for (const child of el.children) {
		// имя тега может совпасть с именем атрибута, тогда дети уходят под ключ с подчёркиванием
		let key = child.nodeName;
		if (key in obj && !Array.isArray(obj[key])) key = `_${key}`;
		(obj[key] ||= []).push(xmlToObj(child));
	}
	return obj;
}

function parseText(text) {
	text = String(text).trim();
	if (!text) return null;
	if (text[0] === '{' || text[0] === '[') {
		try {
			const data = JSON.parse(text);
			return data && data.data ? data.data : data;
		} catch { return null; }
	}
	const doc = new DOMParser().parseFromString(text, 'application/xml');
	if (doc.querySelector('parsererror')) return null;
	return xmlToObj(doc.documentElement);
}

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

async function fetchObj(url) {
	const result = await send({ type: 'fetch', url });
	return result.ok ? parseText(result.text) : null;
}

// Игровые серверы (Эрмун, Антарес), на которых зарегистрирован игрок, выдаёт хаб.
// undefined — хаб недоступен, пустой список — игрок нигде не зарегистрирован.
async function listServers(vkId) {
	const hub = await fetchObj(`${HUB_URL}?api_uid=${vkId}&api_type=vk`);
	if (!hub) return undefined;
	return asArray(hub.s)
		.filter((s) => Number(s.uid) !== 0 && s.url)
		.map((s) => ({
			id: Number(s.id),
			title: String(s.n || `Сервер ${s.id}`),
			url: String(s.url).replace(/^https?:\/\//, '').replace(/\/?$/, '/'),
			// внутренний игровой id игрока на этом сервере: на втором сервере он НЕ равен VK-id,
			// и запросы, где UID — VK-id, сервер молча отклоняет (пустой ответ)
			gameUid: String(s.uid),
		}));
}

// Из списка берём основной сервер, иначе первый доступный.
function pickServer(servers) {
	return servers.find((s) => s.id === PREFERRED_SERVER)
		|| servers[0]
		|| null;
}

// undefined — хаб недоступен, null — игрок нигде не зарегистрирован.
async function findServer(vkId) {
	const servers = await listServers(vkId);
	if (servers === undefined) return undefined;
	return pickServer(servers);
}

// Игрок из ответа сервера (<u .../>) в виде { nick, lvl, dmg, hp }
const toProfile = (u) => ({
	nick: String(u.name || '').trim() || `Player${u.id || ''}`,
	lvl: Number(u.lvl) || 0,
	dmg: Number(u.dmgi) || Number(u.dd) || 0,
	hp: (Number(u.end) + Number(u.endi)) * 15 || 0,
});

// Профиль игрока на сервере, null — профиля нет, undefined — сервер не ответил.
async function fetchGameProfile(server, vkId) {
	const profile = await fetchObj(`https://${server.url}udata.php?user=${vkId}`);
	if (!profile) return undefined;
	const u = asArray(profile.u)[0];
	if (!u) return null;
	return toProfile(u);
}

// Игроки пачкой одним запросом: метод друзей игры (i=7) принимает список vk id и отдаёт тех из них,
// кто зарегистрирован на этом сервере. Запрос подписывается ключом родного аккаунта.
// Возвращает Map(vkId → профиль) или undefined, если сервер не ответил.
const FRIENDS_CHUNK = 50;

async function fetchFriends(server, session, ids) {
	const players = new Map();
	for (let i = 0; i < ids.length; i += FRIENDS_CHUNK) {
		const chunk = ids.slice(i, i + FRIENDS_CHUNK);
		const params = new URLSearchParams({
			api_uid: session.id,
			api_type: 'vk',
			api_id: APP_ID,
			auth_key: session.authKey,
			// UID — игровой id запрашивающего на ЭТОМ сервере (из хаба), а не VK-id: на сервере 2 они разные
			UID: server.gameUid || session.id,
			f_data: `<data>${chunk.map((id) => `<u>${id}</u>`).join('')}</data>`,
			i: 7,
		});
		const data = await fetchObj(`https://${server.url}game.php?${params}`);
		if (!data || data.err_msg) return undefined;
		for (const u of asArray(data.u)) {
			const vkId = Number(u.vkId);
			if (!vkId) continue;
			players.set(vkId, toProfile(u));
		}
	}
	return players;
}

// Статы всех аккаунтов: по одному запросу на каждый сервер игры (два запроса независимо от числа аккаунтов).
// Для аккаунта берём профиль с основного сервера, а если его там нет, с остальных.
// Возвращает { found: Map(vkId → профиль), missing: [vkId] } или undefined, если игровые серверы не ответили.
// В missing попадают только те, кого точно нет ни на одном сервере (если какой-то сервер молчал, не судим).
export async function loadGameStats(session, ids) {
	const servers = await listServers(session.id);
	if (!servers || !servers.length) return undefined;
	const main = pickServer(servers);
	const order = [main, ...servers.filter((s) => s !== main)];
	// сервер пускает не чаще 1 запроса в секунду, фоновая часть сама выдерживает паузу
	const results = [];
	for (const server of order) results.push(await fetchFriends(server, session, ids));
	if (results.every((players) => !players)) return undefined;
	const found = new Map();
	// профили на каждом сервере, где игрок есть: форма правки показывает их без новых запросов
	const byServer = new Map();
	for (const id of ids) {
		const players = results.find((r) => r?.has(id));
		if (players) found.set(id, players.get(id));
		const onServers = [];
		order.forEach((server, index) => {
			const game = results[index]?.get(id);
			if (game) onServers.push({ id: server.id, title: server.title, game });
		});
		byServer.set(id, onServers);
	}
	const silent = results.some((players) => !players);
	return { found, byServer, missing: silent ? [] : ids.filter((id) => !found.has(id)) };
}

// Превью для окна добавления и редактирования: профиль ВК и профили игрока на всех серверах игры.
// vk — { name, photo } или null; servers — серверы, где есть игрок, каждый с профилем (game);
// server — сервер по умолчанию (его статы показываем в списке); unavailable — ни один сервер не ответил.
export async function loadPreview(vkId, token) {
	const [users, servers] = await Promise.all([
		token ? loadVkProfiles([vkId], token) : [],
		listServers(vkId),
	]);
	const user = users[0];
	const vk = user ? { name: `${user.first_name} ${user.last_name}`.trim(), photo: user.photo_100 } : null;
	if (servers === undefined) return { vk, servers: [], server: null, unavailable: true };
	// Игровой сервер пускает не чаще 1 запроса в секунду, поэтому профили запрашиваем по очереди
	const profiles = [];
	for (const server of servers) {
		const game = await fetchGameProfile(server, vkId);
		profiles.push({ ...server, game: game || null, failed: game === undefined });
	}
	return {
		vk,
		servers: profiles,
		server: pickServer(servers),
		unavailable: profiles.length > 0 && profiles.every((s) => s.failed),
	};
}

// Проверка пары «id + ключ»: возвращает { server } или { error }.
// Если сервер уже известен (выбран в окне), хаб повторно не опрашиваем.
export async function checkCredentials(id, authKey, knownServer) {
	const server = knownServer || await findServer(id);
	if (server === undefined) return { error: 'Не удалось связаться с игровым сервером' };
	if (server === null) return { error: 'Игрок не зарегистрирован в игре' };
	const check = await send({ type: 'fetch', url: `https://${server.url}game.php?api_uid=${id}&api_type=vk&api_id=${APP_ID}&auth_key=${authKey}` });
	if (!check.ok) return { error: 'Не удалось связаться с игровым сервером' };
	const data = parseText(check.text);
	if (!data || data.err_msg || data.err || data.error || !asArray(data.u).length) {
		return { error: 'Не удалось авторизоваться под введёнными данными' };
	}
	return { server };
}

export async function loadVkProfiles(ids, token) {
	const result = await send({ type: 'vk-users', ids, token });
	return result.ok ? result.users : [];
}
