// Старое расширение Warlord Script рисует на странице панель с кнопками аккаунтов, но у многих оно переписано: другие
// классы и id, зато каркас кода тот же. Данные аккаунта лежат в атрибуте кнопки: onclick="имяФункции('ключ','номер')",
// а название — в её тексте. Поэтому не опираемся на классы и имя функции: просматриваем элементы с атрибутом onclick и
// берём те, где есть пара «ключ из 32 символов, номер профиля» в кавычках. Страницу мы читаем только как DOM
// (скрипты старого расширения нам недоступны), и ничего у него не просим.
const CALL = /\(\s*['"]([0-9a-f]{32})['"]\s*,\s*['"](\d{1,12})['"]\s*\)/i;

// Элементы старой панели с данными аккаунтов в порядке на странице
function legacyElements() {
	const found = [];
	const seen = new Set();
	for (const element of document.querySelectorAll('[onclick]')) {
		const match = CALL.exec(element.getAttribute('onclick') || '');
		if (!match) continue;
		const id = Number(match[2]);
		if (seen.has(id)) continue;
		seen.add(id);
		found.push({ element, id, authKey: match[1].toLowerCase() });
	}
	return found;
}

// [{ id, authKey, label }] в порядке на странице — пусто, если старого расширения на ней нет
export function scanLegacyAccounts() {
	return legacyElements().map(({ element, id, authKey }) => ({ id, authKey, label: (element.textContent || '').trim().slice(0, 40) }));
}

// Прячет панель старого расширения (page.css), если у неё другие классы, чем у оригинала: помечает ближайший общий контейнер
// всех кнопок аккаунтов. Если он слишком велик или содержит игру и нашу панель (кнопки разбросаны по странице), ничего не трогаем.
export function markLegacyPanel() {
	const found = legacyElements().map(({ element }) => element);
	if (!found.length) return;
	let container = found[0];
	for (const element of found.slice(1)) {
		while (container && !container.contains(element)) container = container.parentElement;
	}
	if (!container || container === document.body || container === document.documentElement) return;
	if (container.contains(document.getElementById('warlord-account-manager-host'))) return;
	if (container.querySelector('iframe, #apps, [class*="LayoutWrapper"]') || container.querySelectorAll('*').length > 300) return;
	container.setAttribute('data-warlord-account-manager-legacy-panel', '');
}
