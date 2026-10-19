// Вырезает из сжатого vkui.css правила классов компонентов, которых нет в собранном JS.
// vkui.css — это стили всех компонентов VKUI (около 390 КБ), а расширению нужна небольшая часть. В JS-коде VKUI имена классов
// записаны готовыми строками (vkuiButton__host, vkuiButton__sizeM…), поэтому достаточно найти их в собранном бандле.
// Правила без классов компонентов (токены тем, общие стили) остаются как есть.

// Расширение использует только темы vkCom и iOS (см. ConfigProvider в account_manager/App.jsx и script/components/ScriptBlock.jsx), токены темы vkBase (android)
// не нужны, но остаются в :root как значения по умолчанию
const UNUSED_THEME = '.vkui--vkBase--';
const COMPONENT_CLASS = /\.(vkui[A-Za-z0-9]*__[A-Za-z0-9_-]+)/g;

// Индекс парной закрывающей скобки для фигурной скобки в позиции open (строки в кавычках пропускаются)
function closingBrace(css, open) {
	let depth = 0;
	for (let i = open; i < css.length; i++) {
		const char = css[i];
		if (char === '"' || char === "'") {
			for (i++; i < css.length && css[i] !== char; i++) if (css[i] === '\\') i++;
		} else if (char === '{') {
			depth++;
		} else if (char === '}' && --depth === 0) {
			return i;
		}
	}
	throw new Error('Несбалансированные скобки в CSS');
}

// Разделяет список селекторов по запятым вне скобок (:is(a, b), :not(a, b))
function splitSelectors(selector) {
	const parts = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < selector.length; i++) {
		const char = selector[i];
		if (char === '(' || char === '[') depth++;
		else if (char === ')' || char === ']') depth--;
		else if (char === ',' && depth === 0) {
			parts.push(selector.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(selector.slice(start));
	return parts;
}

function purgeRules(css, used) {
	let output = '';
	let index = 0;
	while (index < css.length) {
		const open = css.indexOf('{', index);
		if (open === -1) {
			output += css.slice(index);
			break;
		}
		const close = closingBrace(css, open);
		const prelude = css.slice(index, open);
		const body = css.slice(open + 1, close);
		index = close + 1;

		if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
			const inner = purgeRules(body, used);
			if (inner) output += `${prelude}{${inner}}`;
		} else if (prelude.startsWith('@')) {
			output += `${prelude}{${body}}`; // @keyframes и прочее: решается ниже
		} else {
			const kept = splitSelectors(prelude).filter((selector) => !selector.includes(UNUSED_THEME) && [...selector.matchAll(COMPONENT_CLASS)].every((match) => used.has(match[1])));
			if (kept.length) output += `${kept.join(',')}{${body}}`;
		}
	}
	return output;
}

// Анимации, на которые не осталось ссылок, тоже убираем
function purgeKeyframes(css) {
	const keyframes = [...css.matchAll(/@keyframes ([\w-]+)\{/g)];
	let result = css;
	for (const [, name] of keyframes) {
		const start = result.indexOf(`@keyframes ${name}{`);
		const end = closingBrace(result, result.indexOf('{', start));
		const rest = result.slice(0, start) + result.slice(end + 1);
		if (!rest.includes(name)) result = rest;
	}
	return result;
}

// bundle — собранный JS (строка), в котором ищем имена классов
export function purgeVkuiCss(css, bundle) {
	const used = new Set(bundle.match(/vkui[A-Za-z0-9]*__[A-Za-z0-9_-]+/g));
	return purgeKeyframes(purgeRules(css, used));
}
