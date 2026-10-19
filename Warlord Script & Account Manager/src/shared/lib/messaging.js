// Обмен с service worker (background.js): оттуда ходим в сеть, из страницы ВК это упирается в CORS.

export function send(message) {
	return new Promise((resolve) => {
		try {
			chrome.runtime.sendMessage(message, (response) => {
				if (chrome.runtime.lastError || !response) resolve({ ok: false, error: chrome.runtime.lastError?.message || 'empty' });
				else resolve(response);
			});
		} catch (error) {
			// расширение перезагрузили, пока страница была открыта
			resolve({ ok: false, error: String(error) });
		}
	});
}
