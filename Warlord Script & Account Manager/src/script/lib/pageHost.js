import vkuiCss from '@vkontakte/vkui/dist/vkui.css';
import sharedCss from '../../shared/styles.css';
import scriptCss from '../styles.css';

// Общее для всех мест, где Warlord Script рисует интерфейс на странице ВК (блок на профиле и его подсказки).

// Таблица стилей общая для всех Shadow DOM скрипта. Разбирается один раз за жизнь страницы, а не при каждой вставке
// (ВК — SPA, при переходах между страницами интерфейс вставляется заново). В Shadow DOM нет :root, токены тем VKUI вешаются на :host.
let styles = null;
export function getStyles() {
	if (styles) return styles;
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(vkuiCss.replace(/:root/g, ':host') + sharedCss + scriptCss);
	// Цвета скрипт берёт у самой страницы ВК (у неё свои значения токенов VKUI, своя тема), поэтому нужны их имена
	const tokenNames = [...sheet.cssRules]
		.filter((rule) => rule.selectorText && rule.selectorText.includes(':host'))
		.flatMap((rule) => [...rule.style])
		// подсветка при наведении и нажатии у исходного расширения своя (см. styles.css), поэтому её токены не берём
		.filter((name) => /^--vkui--(color|colors_scheme|elevation|gradient)/.test(name) && !name.startsWith('--vkui--color_transparent'));
	styles = { sheet, tokenNames: [...new Set(tokenNames)] };
	return styles;
}

// Значения токенов цвета VKUI у элемента страницы ВК
export function readTokens(element) {
	const computed = getComputedStyle(element);
	const tokens = {};
	for (const name of getStyles().tokenNames) {
		const value = computed.getPropertyValue(name).trim();
		if (value) tokens[name] = value;
	}
	return tokens;
}

const LAYER_STYLE = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483000';

// Верхний слой в <body> для подсказок, окон и уведомлений: внутри блоков страницы их перекрывали бы соседние элементы.
// Возвращает { layerHost, layer } — хост в странице и элемент внутри его Shadow DOM, куда рисуется содержимое.
export function createLayer(id) {
	document.getElementById(id)?.remove(); // остатки прежней копии скрипта (расширение обновили при открытой странице)
	const layerHost = document.createElement('div');
	layerHost.id = id;
	layerHost.style.cssText = LAYER_STYLE;
	const shadow = layerHost.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [getStyles().sheet];
	const layer = document.createElement('div');
	shadow.append(layer);
	document.body.append(layerHost);
	return { layerHost, layer };
}
