import { ACCOUNT_MANAGER_SETTINGS_KEY as KEY } from './storageKeys.js';

// Скрыта ли панель аккаунтов на странице игры (поле panelHidden в её настройках). Её выключает сама панель, а вернуть можно
// только отсюда: из настроек Warlord Script. Остальные поля настроек панели не трогаем.
export async function loadPanelHidden() {
	try {
		return (await chrome.storage.local.get(KEY))[KEY]?.panelHidden === true;
	} catch {
		return false;
	}
}

export async function savePanelHidden(hidden) {
	try {
		const stored = (await chrome.storage.local.get(KEY))[KEY];
		await chrome.storage.local.set({ [KEY]: { ...(stored && typeof stored === 'object' ? stored : {}), panelHidden: hidden } });
	} catch { /* расширение перезагружено */ }
}
