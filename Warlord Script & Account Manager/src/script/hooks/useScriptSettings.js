import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSettings, saveSettings } from '../lib/settings.js';

// Настройки Warlord Script: null, пока не загружены. update(поля) сразу сохраняет изменения.
export function useScriptSettings() {
	const [settings, setSettings] = useState(null);
	const current = useRef(null); // актуальное значение для update: запись в хранилище не должна жить внутри функции setState
	useEffect(() => {
		let alive = true;
		loadSettings().then((loaded) => {
			if (!alive) return;
			current.current = loaded;
			setSettings(loaded);
		});
		return () => { alive = false; };
	}, []);
	const update = useCallback((fields) => {
		// до загрузки менять нечего: иначе в хранилище ушёл бы объект из одного поля, а остальное сбросилось бы на значения по умолчанию
		if (!current.current) return;
		const next = { ...current.current, ...fields };
		current.current = next;
		setSettings(next);
		saveSettings(next);
	}, []);
	return [settings, update];
}
