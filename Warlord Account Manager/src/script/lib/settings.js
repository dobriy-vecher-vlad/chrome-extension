// Настройки Warlord Script (отдельно от настроек Warlord Account Manager, см. account_manager/lib/settings.js).
import { SCRIPT_SETTINGS_KEY as KEY } from '../../shared/lib/storageKeys.js';

const LEGACY_KEY = 'dvvSettings'; // где их хранил исходный Warlord Script: localStorage страницы ВК

// версия расширения, показывается рядом с названием вкладки
export const VERSION = (() => {
	try {
		return chrome.runtime.getManifest().version;
	} catch {
		return ''; // расширение перезагружено, пока страница была открыта
	}
})();
export const SERVER_TITLES = ['Эрмун', 'Антарес'];

export const DEFAULT_SETTINGS = {
	showVersion: true,
	selectedServer: 1,
	showBanners: true,
	showServers: true,
	showSkills: true,
	showExtra: true,
	showGuild: true,
	showGuildUpgrades: true,
	showGuildPersonnel: true,
	showGuildEvents: true,
	showGuildDeposits: true,
	showFight: true,
	sortingGuildPersonnel: 1, // 1 — ранг, 2 — урон, 3 — здоровье
};

// Что показывает окно настроек: переключатели блоков и варианты выбора (значение — номер варианта, начиная с 1)
export const SETTINGS_FORM = {
	blocks: [
		{ id: 'showBanners', title: 'Баннеры и статусы', description: 'Блок с баннерами и статусами игрока' },
		{ id: 'showServers', title: 'Сервер', description: 'Блок с быстрым переходом к серверу' },
		{ id: 'showSkills', title: 'Навыки игрока', description: 'Блок с навыками игрока' },
		{ id: 'showExtra', title: 'Характеристики игрока', description: 'Блок с характеристиками игрока' },
		{ id: 'showGuild', title: 'Информация гильдии', description: 'Блок с информацией гильдии игрока' },
		{ id: 'showGuildUpgrades', title: 'Улучшения гильдии', description: 'Блок с улучшениями гильдии игрока' },
		{ id: 'showGuildPersonnel', title: 'Состав гильдии', description: 'Блок с составом гильдии игрока' },
		{ id: 'showGuildEvents', title: 'События гильдии', description: 'Блок с событиями гильдии игрока' },
		{ id: 'showGuildDeposits', title: 'Пополнения гильдии', description: 'Блок с пополнениями гильдии игрока' },
		{ id: 'showFight', title: 'Состояние боя', description: 'Блок с информацией по активному бою игрока' },
	],
	sorting: {
		id: 'sortingGuildPersonnel',
		options: [
			{ title: 'Ранг', description: 'От лидера до рекрута' },
			{ title: 'Урон', description: 'От большего к меньшему' },
			{ title: 'Здоровье', description: 'От большего к меньшему' },
		],
	},
	server: {
		id: 'selectedServer',
		options: [{ title: 'Эрмун', description: 'Первый сервер' }, { title: 'Антарес', description: 'Второй сервер' }],
	},
};

// Только известные поля нужного вида: испорченное значение не должно ломать блок
export function normalize(stored) {
	const source = stored && typeof stored === 'object' ? stored : {};
	const settings = {};
	for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
		settings[key] = typeof fallback === 'boolean'
			? (typeof source[key] === 'boolean' ? source[key] : fallback)
			: (Number.isInteger(source[key]) && source[key] > 0 ? source[key] : fallback);
	}
	if (settings.selectedServer > SERVER_TITLES.length) settings.selectedServer = DEFAULT_SETTINGS.selectedServer;
	if (settings.sortingGuildPersonnel > 3) settings.sortingGuildPersonnel = DEFAULT_SETTINGS.sortingGuildPersonnel;
	return settings;
}

// Настройки исходного расширения (если стояло) подхватываем один раз
function readLegacy() {
	try {
		const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
		if (!legacy || typeof legacy !== 'object') return null;
		return { showVersion: legacy.showVersion, ...(legacy.warlord?.settings || {}) };
	} catch {
		return null;
	}
}

export async function loadSettings() {
	try {
		const stored = (await chrome.storage.local.get(KEY))[KEY];
		if (stored) return normalize(stored);
		const migrated = normalize(readLegacy());
		await chrome.storage.local.set({ [KEY]: migrated });
		return migrated;
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export async function saveSettings(settings) {
	try {
		await chrome.storage.local.set({ [KEY]: settings });
	} catch { /* расширение перезагружено */ }
}
