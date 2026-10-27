// Хост панели (элемент с Shadow DOM) и его положение на странице ВК. Два режима:
// - встроенный: колонка справа от игры внутри блока страницы, позиция считается от него;
// - свободный: панель фиксирована в окне, её можно перетаскивать и менять по высоте.
// Ширина панели настраивается (см. settings.js), по умолчанию 264.
import { WIDTH_DEFAULT } from './settings.js';

export const MIN_HEIGHT = 200;

const KEEP_VISIBLE = 80; // сколько панели остаётся в окне, если её утащили к краю

export const embeddedStyle = (width = WIDTH_DEFAULT) => [
	'position: absolute',
	'top: calc(var(--spa-layout-header-height) + var(--page-block-offset))',
	'left: calc(100% + 6px - 16px)',
	`width: ${width}px`,
].join(';');

// Верхний слой для окон, подтверждений и уведомлений (см. main.jsx): выше всего на странице ВК, включая чат справа внизу
export const LAYER_STYLE = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483000';

// Панель в свободном режиме: выше шапки ВК (z-index 1000), но под верхним слоем
export const freeStyle = ({ x, y }, width = WIDTH_DEFAULT) => `position: fixed; z-index: 1000; left: ${x}px; top: ${y}px; width: ${width}px`;

// Положение: целиком в окне по горизонтали, по вертикали не дальше KEEP_VISIBLE от нижнего края
export function clampPosition({ x, y }, width = WIDTH_DEFAULT) {
	return {
		x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - width)),
		y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - KEEP_VISIBLE)),
	};
}

// Мягкая подгонка (положение в окне, высота не меньше минимума): высоту под нижний край окна ограничивает CSS,
// и при возврате панели вверх она снова становится прежней
export const fitBox = ({ x, y, height }, width = WIDTH_DEFAULT) => ({ ...clampPosition({ x, y }, width), height: Math.max(MIN_HEIGHT, height) });

// Жёсткая подгонка: ещё и высота не больше, чем осталось до нижнего края окна (для изменения высоты мышью)
export function clampBox({ x, y, height }, width = WIDTH_DEFAULT) {
	const position = clampPosition({ x, y }, width);
	return { ...position, height: Math.min(Math.max(MIN_HEIGHT, height), Math.max(MIN_HEIGHT, window.innerHeight - position.y)) };
}

export const defaultBox = (width = WIDTH_DEFAULT) => clampBox({ x: window.innerWidth - width - 24, y: 80, height: 480 }, width);

// Куда в DOM страницы ставить хост в текущем режиме (null — страница ещё не нарисовала нужный блок)
function hostParent(host) {
	return host.dataset.free ? document.body : document.querySelector('[class*="LayoutWrapper__body"]');
}

// Ставит хост на своё место, если он оказался не там (ВК перерисовал страницу или сменился режим)
export function placeHost(host) {
	const parent = hostParent(host);
	if (parent && host.parentElement !== parent) parent.append(host);
}
