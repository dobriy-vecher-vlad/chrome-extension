import { useEffect, useRef } from 'react';
import { scanLegacyAccounts } from '../lib/legacy.js';

const WATCH_MS = 30000;

// Ищет на странице панель старого расширения Warlord Script и один раз передаёт найденные аккаунты в onFound.
// Старый скрипт рисует панель с задержкой (около 5 секунд после загрузки), поэтому какое-то время следим за DOM.
// Если за WATCH_MS панели не появилось, старого расширения нет, и наблюдатель отключается.
export function useLegacyImport(enabled, onFound) {
	const callback = useRef(onFound);
	callback.current = onFound;

	useEffect(() => {
		if (!enabled) return undefined;
		let done = false;
		let scheduled = false;
		const observer = new MutationObserver(() => {
			if (scheduled) return;
			scheduled = true;
			setTimeout(read, 30); // не rAF: в фоновой вкладке он не вызывается
		});
		function read() {
			scheduled = false;
			if (done) return;
			const found = scanLegacyAccounts();
			if (!found.length) return;
			done = true;
			observer.disconnect();
			callback.current(found);
		}
		observer.observe(document.documentElement, { childList: true, subtree: true });
		read();
		const stop = setTimeout(() => observer.disconnect(), WATCH_MS);
		return () => {
			done = true;
			observer.disconnect();
			clearTimeout(stop);
		};
	}, [enabled]);
}
