import { useEffect, useRef } from 'react';
import { watchDom } from '../../shared/lib/domObserver.js';
import { markLegacyPanel, scanLegacyAccounts } from '../lib/legacyPanel.js';

const WATCH_MS = 30000;

// Ищет на странице панель старого расширения Warlord Script и один раз передаёт найденные аккаунты в onFound.
// Старый скрипт рисует панель с задержкой (около 5 секунд после загрузки), поэтому какое-то время следим за DOM.
// Если за WATCH_MS панели не появилось, старого расширения нет, и слежение отключается.
export function useLegacyImport(enabled, onFound) {
	const callback = useRef(onFound);
	callback.current = onFound;

	useEffect(() => {
		if (!enabled) return undefined;
		let done = false;
		let unwatch = () => {};
		const stop = setTimeout(() => unwatch(), WATCH_MS);
		const read = () => {
			if (done) return;
			const found = scanLegacyAccounts();
			if (!found.length) return;
			done = true;
			unwatch();
			markLegacyPanel();
			callback.current(found);
		};
		unwatch = watchDom(read);
		read();
		return () => {
			done = true;
			unwatch();
			clearTimeout(stop);
		};
	}, [enabled]);
}
