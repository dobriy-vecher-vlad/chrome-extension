// Внутри фрейма игры (warlord.geronimo.su): прячет первый блок страницы игры (рекламный) и строку с ID под игрой.
// Включается настройками «Скрыть рекламный блок» (по умолчанию включена) и «Скрыть ID под игрой» (ключ settings в chrome.storage.local).
// Сначала прячем сразу, не дожидаясь хранилища, чтобы блок не мелькал, и снимаем скрытие, если настройка выключена.

const KEY = 'settings';
const STYLE_ID = 'warlord-account-manager-frame-style';
const ADS_CSS = 'body > div:first-of-type:not(#thegame):not(#custom_footer) { display: none !important; }';
// строка с ID игрока и кнопка «Нравится» под окном игры
const ID_CSS = '#custom_footer { display: none !important; }';

// Что прячем: без сохранённых настроек (пока они не прочитаны) только рекламный блок, чтобы он не мелькал
function css(settings) {
	if (settings && settings.panelHidden === true) return '';
	const parts = [];
	if (!settings || settings.hideAds !== false) parts.push(ADS_CSS);
	if (settings && settings.hideGameId === true) parts.push(ID_CSS);
	return parts.join('\n');
}

function apply(text) {
	let style = document.getElementById(STYLE_ID);
	if (!text) {
		style?.remove();
		return;
	}
	if (!style) {
		style = document.createElement('style');
		style.id = STYLE_ID;
		(document.head || document.documentElement).append(style);
	}
	if (style.textContent !== text) style.textContent = text;
}

// скрытая панель аккаунтов отключает и эти правки (см. настройку «Скрыть панель аккаунтов»)
apply(css(null));
chrome.storage.local.get(KEY).then((stored) => apply(css(stored[KEY] || null))).catch(() => {});
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'local' && changes[KEY]) apply(css(changes[KEY].newValue || null));
});
