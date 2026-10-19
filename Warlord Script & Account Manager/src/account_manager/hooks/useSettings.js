import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, onSettingsChanged, saveSettings } from '../lib/settings.js';

// Настройки расширения: читаются из хранилища при старте, меняются через update(поля) и сразу пишутся обратно.
// Изменения из других вкладок подхватываются сами.
export function useSettings() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [ready, setReady] = useState(false);
	const current = useRef(DEFAULT_SETTINGS); // актуальное значение для обработчиков, которые не ждут перерисовки

	const apply = useCallback((next) => {
		current.current = next;
		setSettings(next);
	}, []);

	useEffect(() => {
		loadSettings().then((loaded) => {
			apply(loaded);
			setReady(true);
		});
		// своя же запись возвращается событием: сверяем, чтобы не откатить более свежее значение
		return onSettingsChanged((value) => {
			if (JSON.stringify(value) !== JSON.stringify(current.current)) apply(value);
		});
	}, [apply]);

	const update = useCallback((fields) => {
		const next = { ...current.current, ...fields };
		apply(next);
		saveSettings(next);
	}, [apply]);

	const reset = useCallback(() => {
		apply({ ...DEFAULT_SETTINGS });
	}, [apply]);

	return { settings, ready, update, reset };
}
