const KEY = 'accounts';

export const isAuthKey = (value) => /^[0-9a-f]{32}$/i.test(value);

// В списке рядом с аккаунтами бывают разделители: { id: 'separator:…', separator: true }. Номера у них нет,
// поэтому там, где нужны только аккаунты, их отфильтровывают (isSeparator).
export const isSeparator = (item) => Boolean(item && item.separator);

export const newSeparator = () => ({ id: `separator:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, separator: true });

// Храним только то, что вводит человек, и дешёвый кэш для первого показа. Статы (DMG, HP) и адреса серверов
// при каждом открытии игры берутся заново, поэтому не сохраняются и не успевают устареть.
export const toStored = (item) => (
	isSeparator(item)
		? { id: item.id, separator: true }
		: { id: item.id, authKey: item.authKey, label: item.label, name: item.name, photo: item.photo, nick: item.nick }
);

export async function loadAccounts() {
	try {
		const stored = (await chrome.storage.local.get(KEY))[KEY];
		return (Array.isArray(stored) ? stored : []).filter((a) => a && ((a.separator === true && typeof a.id === 'string') || (a.id && isAuthKey(a.authKey || ''))));
	} catch {
		return [];
	}
}

export async function saveAccounts(accounts) {
	try {
		await chrome.storage.local.set({ [KEY]: accounts.map(toStored) });
	} catch { /* расширение перезагружено */ }
}

// Подписка на изменения списка в хранилище; callback получает новое значение. Возвращает функцию отписки.
// Событие приходит и той вкладке, которая сама записала список, поэтому получатель сверяет значение со своим.
export function onAccountsChanged(callback) {
	try {
		const listener = (changes, area) => {
			if (area === 'local' && changes[KEY]) callback(changes[KEY].newValue);
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	} catch {
		return () => {};
	}
}

// Сообщение «старое расширение можно удалить» показываем один раз, а не при каждой загрузке страницы
const LEGACY_NOTICE_KEY = 'legacyNoticed';

export async function loadLegacyNoticed() {
	try {
		return Boolean((await chrome.storage.local.get(LEGACY_NOTICE_KEY))[LEGACY_NOTICE_KEY]);
	} catch {
		return false;
	}
}

export async function saveLegacyNoticed() {
	try {
		await chrome.storage.local.set({ [LEGACY_NOTICE_KEY]: true });
	} catch { /* расширение перезагружено */ }
}
