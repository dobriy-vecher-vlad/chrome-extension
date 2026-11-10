import { useCallback, useEffect, useRef, useState } from 'react';
import {
	DEFAULT_SETTINGS, loadBackgroundImage, loadSettings, normalizeSettings, onBackgroundImageChanged, onSettingsChanged, saveBackgroundImage, saveSettings,
} from '../lib/settings.js';

// Настройки расширения: читаются из хранилища при старте, меняются через update(поля) и сразу пишутся обратно.
// Изменения из других вкладок подхватываются сами. Картинка фона панели (image) лежит отдельно от настроек.
export function useSettings() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [image, setImageState] = useState(null);
	const [ready, setReady] = useState(false);
	const current = useRef(DEFAULT_SETTINGS); // актуальное значение для обработчиков, которые не ждут перерисовки
	const currentImage = useRef(null);
	const written = useRef([]); // что мы сами записали и ещё не получили обратно событием хранилища

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
		// Своя же запись возвращается событием. При частых записях (движок ползунка) событие старой записи приходит, когда
		// в панели уже новое значение: сверка только с текущим откатила бы его на кадр назад. Поэтому свои записи помним
		// и пропускаем; с текущим значением сравниваем только то, что записали не мы.
		const offSettings = onSettingsChanged((value) => {
			const json = JSON.stringify(value);
			const own = written.current.indexOf(json);
			if (own >= 0) {
				written.current.splice(own, 1); // убираем только вернувшуюся запись: порядок событий не гарантирован
				return;
			}
			written.current = [];
			if (json !== JSON.stringify(current.current)) apply(value);
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
		written.current = [...written.current, JSON.stringify(normalizeSettings(next))].slice(-50);
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

	// Очистка оформления: значения по умолчанию и в панели, и в хранилище (reset выше меняет только панель). Общие настройки
	// (скрытие панели, подмена Game.js) не оформление и остаются как были
	const clear = useCallback(() => {
		const { panelHidden, replaceGame } = current.current;
		update({ ...DEFAULT_SETTINGS, panelHidden, replaceGame });
		setImage(null);
	}, [update, setImage]);

	return { settings, image, ready, update, updateBackground, setImage, reset, clear };
}
