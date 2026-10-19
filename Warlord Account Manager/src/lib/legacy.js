// Старое расширение Warlord Script рисует на странице панель с кнопками аккаунтов. Данные аккаунта лежат в атрибуте
// кнопки: onclick="loadWarlordUser('ключ','номер')", а название — в тексте кнопки. Страницу мы читаем только
// как DOM (скрипты старого расширения нам недоступны), и ничего у него не просим.
const BUTTONS = '#wd-helper div.button[onclick]';
const CALL = /loadWarlordUser\(\s*['"]([0-9a-f]{32})['"]\s*,\s*['"](\d{1,12})['"]\s*\)/i;

// [{ id, authKey, label }] — пусто, если старого расширения на странице нет
export function scanLegacyAccounts() {
	const items = [];
	for (const button of document.querySelectorAll(BUTTONS)) {
		const match = CALL.exec(button.getAttribute('onclick') || '');
		if (!match) continue;
		items.push({ id: Number(match[2]), authKey: match[1].toLowerCase(), label: (button.textContent || '').trim() });
	}
	return items;
}
