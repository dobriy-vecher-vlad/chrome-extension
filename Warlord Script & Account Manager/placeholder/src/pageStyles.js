import vkuiCss from '@vkontakte/vkui/dist/vkui.css';
import placeholderCss from './styles.css';

// Таблица стилей блока. Разбирается один раз за жизнь страницы, а не при каждой вставке (ВК — SPA, блок вставляется заново
// при переходах между профилями). В Shadow DOM нет :root, токены тем VKUI вешаются на :host.
let styles = null;
export function getStyles() {
	if (styles) return styles;
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(vkuiCss.replace(/:root/g, ':host') + placeholderCss);
	// Цвета блок берёт у самой страницы ВК (у неё свои значения токенов VKUI, своя тема), поэтому нужны их имена
	const tokenNames = [...sheet.cssRules]
		.filter((rule) => rule.selectorText && rule.selectorText.includes(':host'))
		.flatMap((rule) => [...rule.style])
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
