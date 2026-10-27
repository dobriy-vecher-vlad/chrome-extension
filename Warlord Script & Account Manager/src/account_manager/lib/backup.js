import { normalizeSettings } from './settings.js';

// Файлы экспорта оформления и «всего вместе». Аккаунты отдельно лежат в текстовом файле (см. transfer.js); в «всё вместе» их
// текст вложен как есть, поэтому читается тем же разбором.
export const APPEARANCE_FILE_NAME = 'warlord-account-manager-appearance.json';
export const BACKUP_FILE_NAME = 'warlord-account-manager-backup.json';

const APPEARANCE_TYPE = 'warlord-account-manager-appearance';
const BACKUP_TYPE = 'warlord-account-manager-backup';
const MAX_IMAGE_LENGTH = 8 * 1024 * 1024; // символов в data:-адресе картинки

// В файл не идут скрытие панели и её положение в окне: первое выключило бы панель при импорте, второе зависит от экрана
function appearancePart(settings, image) {
	const { panelHidden, panel, ...rest } = settings; // eslint-disable-line no-unused-vars
	return { settings: rest, backgroundImage: image || null };
}

export function serializeAppearance(settings, image) {
	return `${JSON.stringify({ type: APPEARANCE_TYPE, version: 1, ...appearancePart(settings, image) }, null, 2)}\n`;
}

export function serializeBackup(accountsText, settings, image) {
	return `${JSON.stringify({ type: BACKUP_TYPE, version: 1, accounts: accountsText, appearance: appearancePart(settings, image) }, null, 2)}\n`;
}

function readJson(text) {
	try {
		const data = JSON.parse(String(text).replace(/^﻿/, ''));
		return data && typeof data === 'object' ? data : null;
	} catch {
		return null;
	}
}

const validImage = (image) => (
	image && typeof image.data === 'string' && image.data.startsWith('data:image/') && image.data.length <= MAX_IMAGE_LENGTH && Number.isFinite(image.luminance)
		? { data: image.data, luminance: Math.min(1, Math.max(0, image.luminance)) }
		: null
);

// Оформление из прочитанного объекта: { settings (проверенные, остальное по умолчанию), image } или null
function appearanceFrom(part) {
	if (!part || typeof part !== 'object' || !part.settings || typeof part.settings !== 'object') return null;
	return { settings: normalizeSettings(part.settings), image: validImage(part.backgroundImage) };
}

// Файл оформления (подходит и файл «всё вместе»: берётся его оформление)
export function parseAppearance(text) {
	const data = readJson(text);
	if (!data) return null;
	if (data.type === APPEARANCE_TYPE) return appearanceFrom(data);
	if (data.type === BACKUP_TYPE) return appearanceFrom(data.appearance);
	return null;
}

// Файл «всё вместе»: { accountsText, appearance } или null
export function parseBackup(text) {
	const data = readJson(text);
	if (!data || data.type !== BACKUP_TYPE) return null;
	const appearance = appearanceFrom(data.appearance);
	if (typeof data.accounts !== 'string' || !appearance) return null;
	return { accountsText: data.accounts, appearance };
}
