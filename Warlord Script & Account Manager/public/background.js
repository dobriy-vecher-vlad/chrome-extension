// Сетевые запросы вынесены сюда: из content script они упираются в CORS страницы ВК.

const VK_API_URL = 'https://api.vk.ru/method/users.get';
const VK_API_GROUPS_URL = 'https://api.vk.ru/method/groups.getById';
const VK_API_APPS_URL = 'https://api.vk.ru/method/apps.get';
const RATE_LIMIT = /^(Err\. More than 1 request per second|Too many requests per second\.)/;

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
}, { url: [{ hostEquals: 'vk.ru', pathPrefix: '/app5536422' }] });

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

async function vkUsers({ ids, token }) {
	if (!token || !Array.isArray(ids) || !ids.length || !ids.every(isId)) {
		return { ok: false, error: 'bad params' };
	}
	const params = new URLSearchParams({
		user_ids: ids.join(','),
		fields: 'photo_100',
		access_token: token,
		v: '5.131'
	});
	const response = await fetch(`${VK_API_URL}?${params}`);
	const data = await response.json();
	if (!data || !Array.isArray(data.response)) return { ok: false, error: 'vk api error' };
	return { ok: true, users: data.response };
}

// Аватар сообщества (для ссылки на группу в панели)
async function vkGroup({ id: screenName, token }) {
	if (!token || !/^[\w.]{2,64}$/.test(String(screenName))) return { ok: false, error: 'bad params' };
	const params = new URLSearchParams({ group_id: screenName, access_token: token, v: '5.131' });
	const response = await fetch(`${VK_API_GROUPS_URL}?${params}`);
	const data = await response.json();
	// в зависимости от версии API ответ — массив или объект с полем groups
	const group = Array.isArray(data?.response) ? data.response[0] : data?.response?.groups?.[0];
	if (!group) return { ok: false, error: 'vk api error' };
	return { ok: true, name: group.name, image: group.photo_100 };
}

// Иконка приложения: apps.get отдаёт её в полях icon_75, icon_139, icon_150, icon_278
async function vkApp({ id, token }) {
	if (!token || !isId(id)) return { ok: false, error: 'bad params' };
	const params = new URLSearchParams({ app_id: id, access_token: token, v: '5.131' });
	const response = await fetch(`${VK_API_APPS_URL}?${params}`);
	const data = await response.json();
	const app = data?.response?.items?.[0];
	if (!app) return { ok: false, error: 'vk api error' };
	return { ok: true, name: app.title, image: app.icon_139 || app.icon_150 || app.icon_75 };
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
		const response = await fetch(parsed.href, { signal: AbortSignal.timeout(15000) });
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
