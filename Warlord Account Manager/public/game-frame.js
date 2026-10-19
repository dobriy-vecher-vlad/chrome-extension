// Внутри фрейма игры (warlord.geronimo.su): прячет первый блок страницы игры (рекламный).
// Включается настройкой «Скрыть рекламный блок» (ключ settings в chrome.storage.local, по умолчанию включена).
// Сначала прячем сразу, не дожидаясь хранилища, чтобы блок не мелькал, и снимаем скрытие, если настройка выключена.

const KEY = 'settings';
const STYLE_ID = 'warlord-account-manager-frame-style';
const CSS = 'body > div:first-of-type:not(#thegame):not(#custom_footer) { display: none !important; }';

function apply(hide) {
	const existing = document.getElementById(STYLE_ID);
	if (!hide) {
		existing?.remove();
		return;
	}
	if (existing) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = CSS;
	(document.head || document.documentElement).append(style);
}

const hides = (settings) => !settings || settings.hideAds !== false;

apply(true);
chrome.storage.local.get(KEY).then((stored) => apply(hides(stored[KEY]))).catch(() => {});
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'local' && changes[KEY]) apply(hides(changes[KEY].newValue));
});
