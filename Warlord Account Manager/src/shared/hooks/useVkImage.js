import { useEffect, useState } from 'react';
import { send } from '../lib/messaging.js';

// Картинка из VK API (аватар сообщества, иконка приложения) для ссылок внизу панели.
// Сохранённую показываем сразу, а свежую берём из API, когда известен токен.
// type — тип запроса к background ('vk-group' | 'vk-app'), id — screen_name группы или номер приложения.
// Уже полученные картинки держим и в памяти: меню настроек создаётся заново при каждом возврате из вложенного раздела,
// и без этого аватар сначала пропадал и появлялся снова после чтения из хранилища.
const memory = new Map();
const refreshed = new Set(); // ключи, которые уже обновили из API за эту загрузку страницы: повторно не запрашиваем

export function useVkImage(type, id, token) {
	// отдельный ключ хранилища на каждую картинку: общий объект затирали бы друг у друга параллельные хуки
	const cacheKey = `image:${type}:${id}`;
	const [image, setImageState] = useState(() => memory.get(cacheKey) || '');
	const setImage = (value) => {
		memory.set(cacheKey, value);
		setImageState(value);
	};

	useEffect(() => {
		if (memory.has(cacheKey)) return undefined;
		let cancelled = false;
		(async () => {
			try {
				const stored = await chrome.storage.local.get(cacheKey);
				const cached = stored?.[cacheKey];
				if (!cancelled && cached) setImage(cached);
			} catch { /* расширение перезагружено */ }
		})();
		return () => { cancelled = true; };
	}, [cacheKey]);

	useEffect(() => {
		if (!token || refreshed.has(cacheKey)) return undefined;
		let cancelled = false;
		send({ type, id, token }).then(async (result) => {
			if (cancelled || !result.ok || !result.image) return;
			refreshed.add(cacheKey);
			setImage(result.image);
			try {
				await chrome.storage.local.set({ [cacheKey]: result.image });
			} catch { /* расширение перезагружено */ }
		});
		return () => { cancelled = true; };
	}, [type, id, token, cacheKey]);

	return image;
}
