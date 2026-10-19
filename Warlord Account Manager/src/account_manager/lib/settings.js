const KEY = 'settings';

// panel — положение и высота панели в свободном режиме: { x, y, height } в пикселях окна или null, пока её не двигали
export const DEFAULT_SETTINGS = {
	hideAds: true, // убрать рекламный блок в игре и подогнать высоту фрейма (см. page.css и game-frame.js)
	fixLayoutWidth: true, // исправить нечётную --layout-width ВК (см. layoutWidth.js)
	freeMode: false, // панель не встроена справа от игры, а перетаскивается и меняет высоту
	panel: null,
};

const validPanel = (panel) => (
	panel && [panel.x, panel.y, panel.height].every(Number.isFinite) ? { x: panel.x, y: panel.y, height: panel.height } : null
);

// Из хранилища берём только известные поля нужного вида: испорченное или лишнее значение не должно ломать панель
function normalize(stored) {
	const source = stored && typeof stored === 'object' ? stored : {};
	return {
		hideAds: typeof source.hideAds === 'boolean' ? source.hideAds : DEFAULT_SETTINGS.hideAds,
		fixLayoutWidth: typeof source.fixLayoutWidth === 'boolean' ? source.fixLayoutWidth : DEFAULT_SETTINGS.fixLayoutWidth,
		freeMode: typeof source.freeMode === 'boolean' ? source.freeMode : DEFAULT_SETTINGS.freeMode,
		panel: validPanel(source.panel),
	};
}

export async function loadSettings() {
	try {
		return normalize((await chrome.storage.local.get(KEY))[KEY]);
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export async function saveSettings(settings) {
	try {
		await chrome.storage.local.set({ [KEY]: settings });
	} catch { /* расширение перезагружено */ }
}

// Подписка на изменения настроек из других вкладок. Возвращает функцию отписки.
export function onSettingsChanged(callback) {
	try {
		const listener = (changes, area) => {
			if (area === 'local' && changes[KEY]) callback(normalize(changes[KEY].newValue));
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	} catch {
		return () => {};
	}
}
