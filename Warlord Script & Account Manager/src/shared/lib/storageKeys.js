// Ключ настроек Warlord Script в chrome.storage: панель аккаунтов при очистке своих данных его не трогает
export const SCRIPT_SETTINGS_KEY = 'scriptSettings';

// Настройки панели аккаунтов. Warlord Script читает и меняет из них только panelHidden (вернуть скрытую панель)
export const ACCOUNT_MANAGER_SETTINGS_KEY = 'settings';
// Картинка фона панели { data, luminance } хранится отдельно от настроек: она большая, а настройки пишутся при каждом движении панели
export const PANEL_BACKGROUND_IMAGE_KEY = 'panelBackgroundImage';
