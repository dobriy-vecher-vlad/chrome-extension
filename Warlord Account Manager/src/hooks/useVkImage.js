import { useEffect, useState } from 'react';
import { send } from '../lib/messaging.js';


// Картинка из VK API (аватар сообщества, иконка приложения) для ссылок внизу панели.
// Сохранённую показываем сразу, а свежую берём из API, когда известен токен.
// type — тип запроса к background ('vk-group' | 'vk-app'), id — screen_name группы или номер приложения.
export function useVkImage(type, id, token) {
	// отдельный ключ хранилища на каждую картинку: общий объект затирали бы друг у друга параллельные хуки
	const cacheKey = `image:${type}:${id}`;
	const [image, setImage] = useState('');

	useEffect(() => {
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
		if (!token) return undefined;
		let cancelled = false;
		send({ type, id, token }).then(async (result) => {
			if (cancelled || !result.ok || !result.image) return;
			setImage(result.image);
			try {
				await chrome.storage.local.set({ [cacheKey]: result.image });
			} catch { /* расширение перезагружено */ }
		});
		return () => { cancelled = true; };
	}, [type, id, token, cacheKey]);

	return image;
}
