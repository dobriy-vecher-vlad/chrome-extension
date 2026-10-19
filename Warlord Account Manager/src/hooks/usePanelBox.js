import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clampBox, clampPosition, defaultBox, fitBox, MIN_HEIGHT, EMBEDDED_STYLE, freeStyle, placeHost } from '../lib/panelHost.js';

// Положение и высота панели. Во встроенном режиме хост стоит справа от игры (стиль задаёт content.jsx), в свободном
// фиксирован в окне: тянем за верхнюю полоску, высоту меняем за нижнюю. Результат сохраняем, когда отпустили кнопку мыши.
// saved — сохранённые { x, y, height } или null; save(box) — запись в настройки; snap(height) — подгонка высоты панели
// под сетку (чтобы список аккаунтов вмещал целое число строк).
//
// Положение вычисляется прямо при отрисовке из сохранённого значения (своего состояния нет, оно только на время
// перетаскивания), а стиль хоста выставляется до первой отрисовки браузером (useLayoutEffect). Поэтому панель сразу
// появляется там, где её оставили, а не прыгает со стандартного места.
export function usePanelBox(host, enabled, saved, save, snap) {
	const [drag, setDrag] = useState(null); // положение, пока панель тянут
	const [, setViewport] = useState(0); // размер окна изменился: положение нужно пересчитать
	const snapRef = useRef(snap);
	snapRef.current = snap;
	// высота не больше, чем осталось до нижнего края окна, и подогнана под сетку
	const snapBox = (b) => ({ ...b, height: snapRef.current(Math.min(b.height, Math.max(MIN_HEIGHT, window.innerHeight - b.y))) });
	const box = snapBox(drag || fitBox(saved || defaultBox()));
	const boxRef = useRef(box);
	boxRef.current = box;
	const saveRef = useRef(save);
	saveRef.current = save;

	// переключение режима и перемещение хоста
	useLayoutEffect(() => {
		if (enabled) {
			host.dataset.free = '1';
			host.style.cssText = freeStyle(box);
		} else {
			delete host.dataset.free;
			host.style.cssText = EMBEDDED_STYLE;
		}
		placeHost(host);
	}, [host, enabled, box.x, box.y]);

	// окно сузили: панель не должна остаться за его краем
	useEffect(() => {
		if (!enabled) return undefined;
		const onResize = () => setViewport((n) => n + 1);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [enabled]);

	const begin = (mode) => (event) => {
		if (event.button !== 0) return;
		event.preventDefault();
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);
		const start = { x: event.clientX, y: event.clientY, box: boxRef.current };
		let latest = start.box;
		const move = (e) => {
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			latest = mode === 'move'
				? { ...clampPosition({ x: start.box.x + dx, y: start.box.y + dy }), height: start.box.height }
				: snapBox(clampBox({ ...start.box, height: start.box.height + dy }));
			setDrag(latest);
		};
		const end = () => {
			target.removeEventListener('pointermove', move);
			target.removeEventListener('pointerup', end);
			target.removeEventListener('pointercancel', end);
			// сохранённое значение и конец перетаскивания применяются одним обновлением: панель не дёргается
			if (latest !== start.box) saveRef.current(latest);
			setDrag(null);
		};
		target.addEventListener('pointermove', move);
		target.addEventListener('pointerup', end);
		target.addEventListener('pointercancel', end);
	};

	return {
		box,
		moveProps: { onPointerDown: begin('move') },
		resizeProps: { onPointerDown: begin('resize') },
	};
}
