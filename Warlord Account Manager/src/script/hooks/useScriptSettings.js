import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '../lib/settings.js';

// Настройки Warlord Script: null, пока не загружены. update(поля) сразу сохраняет изменения.
export function useScriptSettings() {
	const [settings, setSettings] = useState(null);
	useEffect(() => {
		let alive = true;
		loadSettings().then((loaded) => alive && setSettings(loaded));
		return () => { alive = false; };
	}, []);
	const update = useCallback((fields) => {
		setSettings((current) => {
			const next = { ...current, ...fields };
			saveSettings(next);
			return next;
		});
	}, []);
	return [settings, update];
}
