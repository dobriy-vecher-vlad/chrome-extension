// Сетевые запросы вынесены сюда: из content script они упираются в CORS страницы ВК.

const VK_API_URL = 'https://api.vk.ru/method/users.get';
const VK_API_GROUPS_URL = 'https://api.vk.ru/method/groups.getById';
const VK_API_APPS_URL = 'https://api.vk.ru/method/apps.get';
const RATE_LIMIT = /^(Err\. More than 1 request per second|Too many requests per second\.)/;

const isId = (value) => /^\d{1,12}$/.test(String(value));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Расширение работает только на странице игры. ВК — SPA: при переходе на неё без перезагрузки статический
// content_scripts из manifest не срабатывает, поэтому подставляем скрипт сами. Повторная подстановка безопасна:
// content.js не создаёт вторую копию, а только пробует смонтироваться (и сам проверяет адрес).
// То же со стилями страницы (page.css): статичные из manifest при таком переходе тоже не подключаются.
chrome.webNavigation.onHistoryStateUpdated.addListener(({ tabId, frameId }) => {
	if (frameId !== 0) return;
	chrome.scripting.insertCSS({ target: { tabId }, files: ['page.css'] }).catch(() => {});
	chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => {});
}, { url: [{ hostEquals: 'vk.ru', pathPrefix: '/app5536422' }] });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (sender.id !== chrome.runtime.id) return false;
	handle(message).then(sendResponse, (error) => sendResponse({ ok: false, error: String(error) }));
	return true;
});

async function handle(message) {
	switch (message && message.type) {
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

// Запросы к серверам игры (хаб, udata.php, game.php), только https и только *.geronimo.su.
async function fetchGame({ url }) {
	let parsed;
	try { parsed = new URL(url); } catch { return { ok: false, error: 'bad url' }; }
	if (parsed.protocol !== 'https:' || !(parsed.hostname === 'geronimo.su' || parsed.hostname.endsWith('.geronimo.su'))) {
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
