// Баг ВК: на теге <html> висит инлайном --layout-width (например 1165px), и при изменении ширины окна он не пересчитывается.
// С нечётным значением раскладка страницы получает полпикселя, поэтому округляем его вниз до чётного: 1165px → 1164px.
// Работает только пока панель на странице игры (см. main.jsx), при уходе возвращаем значение ВК как было.
const PROP = '--layout-width';

const evenDown = (value) => Math.floor(value / 2) * 2;

export function fixLayoutWidth() {
	const root = document.documentElement;
	let original = null; // значение, которое выставил ВК, пока мы его подменяем
	let applied = null; // то, что выставили мы

	const fix = () => {
		const current = root.style.getPropertyValue(PROP).trim();
		if (current === applied) return; // это наше значение, ВК его не менял
		const match = /^(\d+(?:\.\d+)?)px$/.exec(current);
		original = null;
		applied = null;
		if (!match) return;
		const width = Number(match[1]);
		const even = evenDown(width);
		if (even === width) return;
		original = current;
		applied = `${even}px`;
		root.style.setProperty(PROP, applied);
	};

	const observer = new MutationObserver(fix);
	observer.observe(root, { attributes: true, attributeFilter: ['style'] });
	fix();

	return () => {
		observer.disconnect();
		// возвращаем значение ВК, только если после нас его никто не менял
		if (applied !== null && root.style.getPropertyValue(PROP).trim() === applied) root.style.setProperty(PROP, original);
	};
}
