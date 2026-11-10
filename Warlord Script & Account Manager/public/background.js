// Сетевые запросы вынесены сюда: из content script они упираются в CORS страницы ВК.

const RATE_LIMIT = /^(Err\. More than 1 request per second|Too many requests per second\.)/;

// Подмена Game.js: статический набор правил «game» (rules.json). Включён он или нет, решает настройка replaceGame панели аккаунтов
// (ключ settings в chrome.storage.local): состояние набора правил хранит сам браузер, поэтому его сверяем и при каждом запуске
// service worker, и при обновлении расширения (после него набор возвращается к значению из манифеста), и при смене настройки.
const GAME_RULESET = 'game';
const SETTINGS_KEY = 'settings';

async function syncGameOverride(settings) {
	const wanted = !(settings && settings.replaceGame === false);
	const enabled = (await chrome.declarativeNetRequest.getEnabledRulesets()).includes(GAME_RULESET);
	if (wanted === enabled) return;
	await chrome.declarativeNetRequest.updateEnabledRulesets(wanted ? { enableRulesetIds: [GAME_RULESET] } : { disableRulesetIds: [GAME_RULESET] });
}
const syncGameOverrideFromStorage = () => chrome.storage.local.get(SETTINGS_KEY).then((stored) => syncGameOverride(stored[SETTINGS_KEY])).catch(() => {});
syncGameOverrideFromStorage();
chrome.runtime.onInstalled.addListener(syncGameOverrideFromStorage);
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'local' && changes[SETTINGS_KEY]) syncGameOverride(changes[SETTINGS_KEY].newValue).catch(() => {});
});

const isId = (value) => /^\d{1,12}$/.test(String(value));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Расширение работает только на странице игры. ВК — SPA: при переходе на неё без перезагрузки статический
// content_scripts из manifest не срабатывает, поэтому подставляем скрипт сами. Повторная подстановка безопасна:
// content.js не создаёт вторую копию, а только пробует смонтироваться (и сам проверяет адрес). Стили страницы (page.css)
// он подключает и убирает сам, вместе с панелью.
// История страницы меняется часто, а content.js тяжёлый (React и VKUI). Поэтому сначала спрашиваем уже загруженную копию
// (она в том же изолированном мире, что и подставляемый скрипт) и подставляем файл, только если копии ещё нет.
chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, frameId }) => {
	if (frameId !== 0) return;
	try {
		const [{ result: loaded } = {}] = await chrome.scripting.executeScript({
			target: { tabId },
			func: () => {
				if (!window.__warlordAccountManager) return false;
				window.__warlordAccountManager.mount();
				return true;
			},
		});
		if (!loaded) await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
	} catch { /* вкладка закрыта или ушла со страницы игры */ }
}, { url: [{ hostEquals: 'vk.ru', pathPrefix: '/app5536422' }, { hostEquals: 'vk.ru', pathPrefix: '/games/app5536422' }] });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (sender.id !== chrome.runtime.id) return false;
	handle(message, sender).then(sendResponse, (error) => sendResponse({ ok: false, error: String(error) }));
	return true;
});

async function handle(message, sender) {
	switch (message && message.type) {
		case 'script-inject': return scriptInject(sender);
		case 'script-ids': return scriptIds(sender);
		case 'vk-wiki': return vkWiki(message, sender);
		case 'vk-users': return vkUsers(message);
		case 'vk-group': return vkGroup(message);
		case 'vk-app': return vkApp(message);
		case 'fetch': return fetchGame(message);
		default: return { ok: false, error: 'unknown message' };
	}
}

// ---- ВКонтакте API ----
// Запросы к api.vk.ru идут только отсюда (только панель аккаунтов: имена и аватарки, значки группы и приложения в её окне).
// Чтобы не дёргать API лишний раз:
// - ответы кэшируются в chrome.storage.local (ключ vkCache): профили на 6 часов, картинки группы и приложения на сутки,
//   а неудавшийся запрос картинки не повторяется 10 минут;
// - одинаковые запросы, идущие одновременно, делят один вызов;
// - все вызовы идут по одному через общую очередь, не чаще двух в секунду, и не больше 20 за 5 минут;
// - после ошибок лимитов («слишком много запросов», «флуд», капча, неверный токен) и сетевых сбоев ВК не опрашивается вовсе,
//   пока не пройдёт пауза (хранится в chrome.storage.session, поэтому переживает перезапуск service worker).
const VK_API_URL = 'https://api.vk.ru/method/';
const VK_API_VERSION = '5.131';
const VK_CACHE_KEY = 'vkCache';
const VK_PAUSE_KEY = 'vkPause';
const USER_TTL = 6 * 60 * 60 * 1000;
const IMAGE_TTL = 24 * 60 * 60 * 1000;
const FAILED_IMAGE_TTL = 10 * 60 * 1000;
const USERS_IN_CACHE = 500;
const VK_GAP = 500; // пауза между вызовами, мс
const VK_BUDGET = { calls: 20, window: 5 * 60 * 1000 };
// пауза после ошибки по её коду: 6 — слишком много запросов в секунду, 9 — флуд-контроль, 29 — лимит метода, 14 — капча,
// 5 — неверный токен, 10 — внутренняя ошибка ВК
const VK_PAUSES = { 6: 10 * 1000, 9: 5 * 60 * 1000, 29: 30 * 60 * 1000, 14: 60 * 60 * 1000, 5: 5 * 60 * 1000, 10: 60 * 1000 };
const NETWORK_PAUSE = 30 * 1000;

class VkError extends Error {}

const vkInflight = new Map();
const vkCalls = []; // время последних вызовов
let vkQueue = Promise.resolve();
let vkLastCallAt = 0;

// Общий вызов для одинаковых запросов, идущих одновременно
function shared(key, load) {
	if (!vkInflight.has(key)) vkInflight.set(key, load().finally(() => vkInflight.delete(key)));
	return vkInflight.get(key);
}

async function vkPause(ms) {
	try {
		const until = Date.now() + ms;
		const stored = (await chrome.storage.session.get(VK_PAUSE_KEY))[VK_PAUSE_KEY] || 0;
		if (until > stored) await chrome.storage.session.set({ [VK_PAUSE_KEY]: until });
	} catch { /* хранилище недоступно: пауза не запомнится */ }
}

async function vkPauseLeft() {
	try {
		return Math.max(0, ((await chrome.storage.session.get(VK_PAUSE_KEY))[VK_PAUSE_KEY] || 0) - Date.now());
	} catch {
		return 0;
	}
}

// Один вызов метода API через очередь. Бросает VkError, если вызывать нельзя или ВК вернул ошибку
function vkRequest(method, params) {
	const run = async () => {
		if (await vkPauseLeft() > 0) throw new VkError('pause');
		const since = Date.now() - VK_BUDGET.window;
		while (vkCalls.length && vkCalls[0] < since) vkCalls.shift();
		if (vkCalls.length >= VK_BUDGET.calls) throw new VkError('budget');
		const wait = vkLastCallAt + VK_GAP - Date.now();
		if (wait > 0) await sleep(wait);
		vkLastCallAt = Date.now();
		vkCalls.push(vkLastCallAt);
		let data;
		try {
			const response = await fetch(`${VK_API_URL}${method}?${new URLSearchParams({ ...params, v: VK_API_VERSION })}`, { signal: AbortSignal.timeout(15000) });
			data = await response.json();
		} catch {
			await vkPause(NETWORK_PAUSE);
			throw new VkError('network');
		}
		if (data && data.error) {
			const code = Number(data.error.error_code);
			if (VK_PAUSES[code]) await vkPause(VK_PAUSES[code]);
			throw new VkError(`vk ${code}`);
		}
		if (!data || data.response === undefined) throw new VkError('empty');
		return data.response;
	};
	const result = vkQueue.then(run, run);
	vkQueue = result.catch(() => {});
	return result;
}

// Кэш: { users: { id: { id, first_name, last_name, photo_100?, t } }, images: { 'group:имя': { name, image, t, failed? } } }
const readVkCache = async () => {
	const cache = (await chrome.storage.local.get(VK_CACHE_KEY))[VK_CACHE_KEY];
	return { users: { ...cache?.users }, images: { ...cache?.images } };
};
// Правки кэша идут по очереди: чтение и запись не должны перемешиваться у одновременных вызовов
let vkCacheChain = Promise.resolve();
function updateVkCache(mutate) {
	const run = async () => {
		const cache = await readVkCache();
		mutate(cache);
		const entries = Object.entries(cache.users);
		if (entries.length > USERS_IN_CACHE) {
			entries.sort((x, y) => y[1].t - x[1].t);
			cache.users = Object.fromEntries(entries.slice(0, USERS_IN_CACHE));
		}
		await chrome.storage.local.set({ [VK_CACHE_KEY]: cache });
	};
	const result = vkCacheChain.then(run, run);
	vkCacheChain = result.catch(() => {});
	return result;
}

async function fetchUsers(ids, token, withPhotos) {
	const params = { user_ids: ids.join(','), access_token: token };
	if (withPhotos) params.fields = 'photo_100'; // без аватарок поле не запрашиваем: ответ короче
	const response = await vkRequest('users.get', params);
	if (!Array.isArray(response)) throw new VkError('empty');
	await updateVkCache((cache) => {
		const t = Date.now();
		const found = new Set();
		for (const user of response) {
			found.add(String(user.id));
			const before = cache.users[user.id];
			cache.users[user.id] = {
				id: user.id,
				first_name: user.first_name,
				last_name: user.last_name,
				photo_100: withPhotos ? user.photo_100 || '' : before?.photo_100,
				t,
			};
		}
		// профиль, которого ВК не отдал (удалён), не запрашиваем снова до конца срока
		for (const id of ids) if (!found.has(String(id))) cache.users[id] = { id: Number(id), first_name: '', last_name: '', photo_100: '', t };
	});
}

async function vkUsers({ ids, token, photos = true }) {
	if (!Array.isArray(ids) || !ids.length || !ids.every(isId)) return { ok: false, error: 'bad params' };
	const withPhotos = photos !== false;
	const unique = [...new Set(ids.map(String))];
	let cache = await readVkCache();
	const fresh = (entry) => entry && Date.now() - entry.t < USER_TTL && (!withPhotos || entry.photo_100 !== undefined);
	const missing = unique.filter((id) => !fresh(cache.users[id]));
	if (missing.length && token) {
		try {
			await shared(`users:${withPhotos}:${missing.join(',')}`, () => fetchUsers(missing, token, withPhotos));
			cache = await readVkCache();
		} catch { /* ВК не ответил или просит подождать: отдаём то, что уже есть в кэше, пусть и устаревшее */ }
	}
	const users = unique.map((id) => cache.users[id]).filter((entry) => entry && entry.first_name)
		.map(({ id, first_name, last_name, photo_100 }) => ({ id, first_name, last_name, ...(photo_100 ? { photo_100 } : {}) }));
	return users.length || !missing.length ? { ok: true, users } : { ok: false, error: 'vk api error' };
}

// Картинка сообщества или приложения (для ссылок внизу панели): kind и id дают ключ кэша, load достаёт { name, image } из ВК
async function vkImage(kind, id, token, load) {
	const key = `${kind}:${id}`;
	const entry = (await readVkCache()).images[key];
	const age = entry ? Date.now() - entry.t : Infinity;
	if (entry && age < (entry.failed ? FAILED_IMAGE_TTL : IMAGE_TTL)) {
		return entry.failed ? { ok: false, error: 'vk api error' } : { ok: true, name: entry.name, image: entry.image };
	}
	const stale = entry && !entry.failed ? { ok: true, name: entry.name, image: entry.image } : { ok: false, error: 'vk api error' };
	if (!token) return stale;
	try {
		const value = await shared(key, load);
		await updateVkCache((cache) => { cache.images[key] = { ...value, t: Date.now() }; });
		return { ok: true, ...value };
	} catch {
		// пауза ВК или сбой: устаревшую картинку отдаём, а сам запрос откладываем, чтобы не повторять его при каждом открытии окна
		// устаревшая картинка остаётся, но свежей считается только FAILED_IMAGE_TTL
		await updateVkCache((cache) => { cache.images[key] = stale.ok ? { ...entry, t: Date.now() - IMAGE_TTL + FAILED_IMAGE_TTL } : { t: Date.now(), failed: true }; }).catch(() => {});
		return stale;
	}
}

// Аватар сообщества (для ссылки на группу в панели)
async function vkGroup({ id: screenName, token }) {
	if (!/^[\w.]{2,64}$/.test(String(screenName))) return { ok: false, error: 'bad params' };
	return vkImage('group', screenName, token, async () => {
		const response = await vkRequest('groups.getById', { group_id: screenName, access_token: token });
		// в зависимости от версии API ответ — массив или объект с полем groups
		const group = Array.isArray(response) ? response[0] : response?.groups?.[0];
		if (!group) throw new VkError('empty');
		return { name: group.name, image: group.photo_100 };
	});
}

// Иконка приложения: apps.get отдаёт её в полях icon_75, icon_139, icon_150, icon_278
async function vkApp({ id, token }) {
	if (!isId(id)) return { ok: false, error: 'bad params' };
	return vkImage('app', id, token, async () => {
		const response = await vkRequest('apps.get', { app_id: id, access_token: token });
		const app = response?.items?.[0];
		if (!app) throw new VkError('empty');
		return { name: app.title, image: app.icon_139 || app.icon_150 || app.icon_75 };
	});
}

// Warlord Script (script.js) тяжёлый, поэтому в страницы ВК он не вставляется заранее: лёгкий probe.js следит
// за страницей и просит вставить блок, когда на ней появляется профиль. Вставляем только с vk.ru.
const isVkSender = (sender) => {
	try {
		return Boolean(sender.tab) && new URL(sender.url).origin === 'https://vk.ru';
	} catch {
		return false;
	}
};

async function scriptInject(sender) {
	if (!isVkSender(sender)) return { ok: false, error: 'bad sender' };
	await chrome.scripting.executeScript({ target: { tabId: sender.tab.id }, files: ['script.js'] });
	return { ok: true };
}

// Номера профилей лежат в переменных самой страницы ВК (window.vk.id — кто смотрит, window.cur.oid — чей профиль),
// из изолированного мира расширения они не видны, поэтому читаем их в мире страницы.
async function scriptIds(sender) {
	if (!isVkSender(sender)) return { ok: false, error: 'bad sender' };
	const [{ result }] = await chrome.scripting.executeScript({
		target: { tabId: sender.tab.id },
		world: 'MAIN',
		func: () => ({ from: Number(window.vk && window.vk.id) || 0, to: Number(window.cur && window.cur.oid) || 0 }),
	});
	return { ok: true, from: result.from, to: result.to };
}

// Запись ВК (?w=wall…) из блока: ссылка внутри Shadow DOM не доходит до обработчика кликов страницы, поэтому открываем
// её тем же вызовом, что делает сама страница (showWiki), без перехода на другую страницу.
async function vkWiki({ w }, sender) {
	if (!isVkSender(sender) || !/^[\w-]{1,64}$/.test(String(w))) return { ok: false, error: 'bad params' };
	const [{ result }] = await chrome.scripting.executeScript({
		target: { tabId: sender.tab.id },
		world: 'MAIN',
		args: [String(w)],
		func: (id) => {
			if (typeof window.showWiki !== 'function') return false;
			window.showWiki({ w: id }, false, null);
			return true;
		},
	});
	return { ok: Boolean(result) };
}

// Запросы к серверам игры (хаб, udata.php, game.php) и к файлу статусов игроков, только https и только свои адреса.
const GAME_HOSTS = ['geronimo.su', 'dobriy-vecher-vlad.github.io'];
const isGameHost = (hostname) => GAME_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
async function fetchGame({ url }) {
	let parsed;
	try { parsed = new URL(url); } catch { return { ok: false, error: 'bad url' }; }
	if (parsed.protocol !== 'https:' || !isGameHost(parsed.hostname)) {
		return { ok: false, error: 'host not allowed' };
	}
	// Сервер пускает не чаще 1 запроса в секунду
	for (let attempt = 0; attempt < 4; attempt++) {
		const response = await fetch(parsed.href, { signal: AbortSignal.timeout(15000), redirect: 'error' });
		if (!response.ok) return { ok: false, error: `http ${response.status}` };
		const text = await response.text();
		if (RATE_LIMIT.test(text.trim())) {
			await sleep(1000);
			continue;
		}
		return { ok: true, text };
	}
	return { ok: false, error: 'rate limit' };
}
