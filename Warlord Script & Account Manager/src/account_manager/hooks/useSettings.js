import { useCallback, useEffect, useRef, useState } from 'react';
import {
	DEFAULT_SETTINGS, loadBackgroundImage, loadSettings, onBackgroundImageChanged, onSettingsChanged, saveBackgroundImage, saveSettings,
} from '../lib/settings.js';

// Настройки расширения: читаются из хранилища при старте, меняются через update(поля) и сразу пишутся обратно.
// Изменения из других вкладок подхватываются сами. Картинка фона панели (image) лежит отдельно от настроек.
export function useSettings() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [image, setImageState] = useState(null);
	const [ready, setReady] = useState(false);
	const current = useRef(DEFAULT_SETTINGS); // актуальное значение для обработчиков, которые не ждут перерисовки
	const currentImage = useRef(null);

	const apply = useCallback((next) => {
		current.current = next;
		setSettings(next);
	}, []);
	const applyImage = useCallback((next) => {
		currentImage.current = next;
		setImageState(next);
	}, []);

	useEffect(() => {
		Promise.all([loadSettings(), loadBackgroundImage()]).then(([loaded, loadedImage]) => {
			apply(loaded);
			applyImage(loadedImage);
			setReady(true);
		});
		// своя же запись возвращается событием: сверяем, чтобы не откатить более свежее значение
		const offSettings = onSettingsChanged((value) => {
			if (JSON.stringify(value) !== JSON.stringify(current.current)) apply(value);
		});
		const offImage = onBackgroundImageChanged((value) => {
			if (JSON.stringify(value) !== JSON.stringify(currentImage.current)) applyImage(value);
		});
		return () => {
			offSettings();
			offImage();
		};
	}, [apply, applyImage]);

	const update = useCallback((fields) => {
		const next = { ...current.current, ...fields };
		apply(next);
		saveSettings(next);
	}, [apply]);

	// частичное изменение фона: updateBackground({ dim: 30 })
	const updateBackground = useCallback((fields) => {
		update({ background: { ...current.current.background, ...fields } });
	}, [update]);

	const setImage = useCallback((next) => {
		applyImage(next);
		saveBackgroundImage(next);
	}, [applyImage]);

	const reset = useCallback(() => {
		apply({ ...DEFAULT_SETTINGS });
		applyImage(null);
	}, [apply, applyImage]);

	return { settings, image, ready, update, updateBackground, setImage, reset };
}
