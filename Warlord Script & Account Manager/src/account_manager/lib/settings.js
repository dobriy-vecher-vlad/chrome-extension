import { ACCOUNT_MANAGER_SETTINGS_KEY as KEY, PANEL_BACKGROUND_IMAGE_KEY as IMAGE_KEY } from '../../shared/lib/storageKeys.js';

export const WIDTH_MIN = 200;
export const WIDTH_MAX = 400;
export const WIDTH_DEFAULT = 264;

// Фон панели: цвет (null — не задан) и обработка картинки. dim — затемнение в процентах, blur — размытие в пикселях,
// остальное в процентах (100 — без изменений)
// colorOpacity и imageOpacity — непрозрачность цвета и картинки в процентах, backdropBlur — размытие страницы за панелью в пикселях
export const DEFAULT_BACKGROUND = { color: null, colorOpacity: 100, dim: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100, imageOpacity: 100, backdropBlur: 0 };
export const BACKGROUND_RANGES = {
	dim: [0, 90],
	blur: [0, 20],
	brightness: [20, 200],
	contrast: [20, 200],
	saturation: [0, 200],
	colorOpacity: [0, 100],
	imageOpacity: [0, 100],
	backdropBlur: [0, 40],
};

// panel — положение и высота панели в свободном режиме: { x, y, height } в пикселях окна или null, пока её не двигали
export const DEFAULT_SETTINGS = {
	hideAds: true, // убрать рекламный блок в игре и подогнать высоту фрейма (см. page.css и game-frame.js)
	hideSimilarApps: true, // убрать блок «Игры для вас»
	hideGameId: false, // убрать строку с ID под окном игры (внутри фрейма игры), окно игры ниже на 36px
	hideFooter: false, // убрать подвал под игрой
	hideOptionsBar: false, // убрать шапку над игрой
	fixLayoutWidth: true, // исправить нечётную --layout-width ВК (см. layoutWidth.js)
	freeMode: false, // панель не встроена справа от игры, а перетаскивается и меняет высоту
	panelHidden: false, // панель и все правки страницы выключены (вернуть можно только из настроек Warlord Script)
	panelWidth: WIDTH_DEFAULT,
	panelBorder: true, // обводка вокруг панели, когда она нарисована карточкой (свободный режим или фон)
	panelShadow: true, // тень под панелью-карточкой
	showNicknames: true, // ник игрока в строке аккаунта; без него расширение не запрашивает данные игры для списка
	showAvatars: true, // аватарка в строке аккаунта; без неё расширение не запрашивает фото из ВК
	background: DEFAULT_BACKGROUND,
	panel: null,
};

const validPanel = (panel) => (
	panel && [panel.x, panel.y, panel.height].every(Number.isFinite) ? { x: panel.x, y: panel.y, height: panel.height } : null
);

const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
const clamp = (value, [min, max], fallback) => (Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback);

function normalizeBackground(stored) {
	const source = stored && typeof stored === 'object' ? stored : {};
	const background = { color: typeof source.color === 'string' && /^#[0-9a-f]{6}$/i.test(source.color) ? source.color.toLowerCase() : null };
	for (const [key, range] of Object.entries(BACKGROUND_RANGES)) background[key] = clamp(source[key], range, DEFAULT_BACKGROUND[key]);
	return background;
}

// Из хранилища берём только известные поля нужного вида: испорченное или лишнее значение не должно ломать панель
export function normalizeSettings(stored) {
	const source = stored && typeof stored === 'object' ? stored : {};
	return {
		hideAds: bool(source.hideAds, DEFAULT_SETTINGS.hideAds),
		hideSimilarApps: bool(source.hideSimilarApps, DEFAULT_SETTINGS.hideSimilarApps),
		hideGameId: bool(source.hideGameId, DEFAULT_SETTINGS.hideGameId),
		hideFooter: bool(source.hideFooter, DEFAULT_SETTINGS.hideFooter),
		hideOptionsBar: bool(source.hideOptionsBar, DEFAULT_SETTINGS.hideOptionsBar),
		fixLayoutWidth: bool(source.fixLayoutWidth, DEFAULT_SETTINGS.fixLayoutWidth),
		freeMode: bool(source.freeMode, DEFAULT_SETTINGS.freeMode),
		panelHidden: bool(source.panelHidden, DEFAULT_SETTINGS.panelHidden),
		panelWidth: clamp(source.panelWidth, [WIDTH_MIN, WIDTH_MAX], WIDTH_DEFAULT),
		panelBorder: bool(source.panelBorder, DEFAULT_SETTINGS.panelBorder),
		panelShadow: bool(source.panelShadow, DEFAULT_SETTINGS.panelShadow),
		showNicknames: bool(source.showNicknames, DEFAULT_SETTINGS.showNicknames),
		showAvatars: bool(source.showAvatars, DEFAULT_SETTINGS.showAvatars),
		background: normalizeBackground(source.background),
		panel: validPanel(source.panel),
	};
}

export async function loadSettings() {
	try {
		return normalizeSettings((await chrome.storage.local.get(KEY))[KEY]);
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
			if (area === 'local' && changes[KEY]) callback(normalizeSettings(changes[KEY].newValue));
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	} catch {
		return () => {};
	}
}

// Блоки «Оформления»: какие поля настроек у каждого, чтобы сбрасывать их по отдельности (кнопка в конце блока).
// image: true — в блок входит и картинка фона (хранится отдельно от настроек)
export const SETTINGS_GROUPS = {
	page: { fields: ['hideAds', 'hideSimilarApps', 'hideGameId', 'hideFooter', 'hideOptionsBar', 'fixLayoutWidth'] },
	panel: { fields: ['freeMode', 'panel', 'showNicknames', 'showAvatars', 'panelWidth', 'panelBorder', 'panelShadow'] },
	background: { fields: ['background'], image: true },
};

// Значения блока по умолчанию (для сброса)
export function groupDefaults(name) {
	const defaults = {};
	for (const field of SETTINGS_GROUPS[name].fields) {
		defaults[field] = field === 'background' ? { ...DEFAULT_BACKGROUND } : DEFAULT_SETTINGS[field];
	}
	return defaults;
}

// Просвечивает ли страница сквозь панель с таким фоном: цвет и картинка (если они есть) вместе закрывают панель целиком,
// только когда один из них непрозрачный. От этого зависит, имеет ли смысл размытие заднего фона.
export function isSeeThrough(background, hasImage) {
	const color = background.color ? background.colorOpacity / 100 : 0;
	const image = hasImage ? background.imageOpacity / 100 : 0;
	return 1 - (1 - color) * (1 - image) < 0.999;
}

// Картинка фона { data (data:-адрес), luminance (средняя яркость 0..1, по ней выбирается светлый или тёмный текст) } или null
const validImage = (image) => (
	image && typeof image.data === 'string' && image.data.startsWith('data:image/') && Number.isFinite(image.luminance)
		? { data: image.data, luminance: Math.min(1, Math.max(0, image.luminance)) }
		: null
);

export async function loadBackgroundImage() {
	try {
		return validImage((await chrome.storage.local.get(IMAGE_KEY))[IMAGE_KEY]);
	} catch {
		return null;
	}
}

export async function saveBackgroundImage(image) {
	try {
		if (image) await chrome.storage.local.set({ [IMAGE_KEY]: image });
		else await chrome.storage.local.remove(IMAGE_KEY);
	} catch { /* расширение перезагружено */ }
}

export function onBackgroundImageChanged(callback) {
	try {
		const listener = (changes, area) => {
			if (area === 'local' && changes[IMAGE_KEY]) callback(validImage(changes[IMAGE_KEY].newValue));
		};
		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	} catch {
		return () => {};
	}
}
