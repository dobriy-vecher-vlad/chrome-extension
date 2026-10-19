import { useEffect, useState } from 'react';
import { watchDom } from '../../shared/lib/domObserver.js';
import { isGamePage } from '../lib/gamePage.js';

const GAME_FRAME_SELECTOR = '#app_5536422_container iframe';

export const getGameFrame = () => document.querySelector(GAME_FRAME_SELECTOR);

// Есть ли на странице фрейм игры и какой у него сейчас src. ВК — SPA, поэтому следим за DOM.
// expected — это страница игры по адресу, даже если фрейм ещё не нарисован: в первую секунду ВК сам показывает скелетоны,
// и колонку нужно ставить сразу, а не «выпрыгивать» потом.
export function useGameFrame() {
	const [state, setState] = useState({ present: false, src: '', expected: false });
	useEffect(() => {
		const read = () => {
			const frame = getGameFrame();
			const next = { present: Boolean(frame), src: frame?.getAttribute('src') || '', expected: isGamePage() };
			setState((prev) => (prev.present === next.present && prev.src === next.src && prev.expected === next.expected ? prev : next));
		};
		read();
		return watchDom(read, { watchSrc: true });
	}, []);
	return state;
}
