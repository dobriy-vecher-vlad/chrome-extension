import { isAuthKey } from './storage.js';

// Файл обмена — обычный текст, по аккаунту в строке: `Название,ключ,номер`.
// Это тот же формат, что у списка game_users в старом расширении Warlord Script, поэтому его файл тоже подходит для импорта.
// Строки в кавычках и с запятой в конце (как в game_users) читаются так же.
const LINE = /^\s*['"`]?\s*(.*?)\s*,\s*([0-9a-f]{32})\s*,\s*(\d{1,12})\s*['"`]?\s*,?\s*$/i;

export const EXPORT_FILE_NAME = 'warlord-account-manager-accounts.txt';

// Запятая и перенос строки в названии сломали бы строку файла
const cleanLabel = (value) => String(value || '').replace(/[\r\n,]+/g, ' ').trim();

export function serializeAccounts(accounts, titleOf) {
	return accounts.map((account) => `${cleanLabel(titleOf(account))},${account.authKey},${account.id}`).join('\n') + '\n';
}

// Возвращает { items: [{ id, authKey, label }], bad: число непонятных строк }
export function parseAccounts(text) {
	const items = [];
	let bad = 0;
	for (const line of String(text).replace(/^﻿/, '').split(/\r?\n/)) {
		if (!line.trim()) continue;
		const match = LINE.exec(line);
		if (!match || !isAuthKey(match[2])) {
			bad += 1;
			continue;
		}
		items.push({ id: Number(match[3]), authKey: match[2].toLowerCase(), label: match[1] });
	}
	return { items, bad };
}

// Скачивание текста файлом на компьютер пользователя
