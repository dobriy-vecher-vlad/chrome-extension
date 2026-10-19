// Лёгкий наблюдатель за страницами vk.ru. Warlord Script (script.js) тяжёлый (React и VKUI), поэтому в страницы
// он вставляется не заранее: когда на странице появляется профиль, этот скрипт просит background вставить блок.
// ВК — SPA, профиль может появиться без перезагрузки, поэтому следим за DOM, пока профиля нет.
if (!window.__warlordScriptProbe) {
	window.__warlordScriptProbe = true;
	let requested = false;
	let scheduled = false;

	const request = () => {
		requested = true;
		observer.disconnect();
		try {
			chrome.runtime.sendMessage({ type: 'script-inject' }, (response) => {
				// не удалось: пробуем снова, когда страница изменится
				if (chrome.runtime.lastError || !response || !response.ok) {
					requested = false;
					observer.observe(document.documentElement, { childList: true, subtree: true });
				}
			});
		} catch { /* расширение перезагружено */ }
	};

	const check = () => {
		scheduled = false;
		if (!requested && document.querySelector('#page_body .Profile__column')) request();
	};

	const observer = new MutationObserver(() => {
		if (scheduled) return;
		scheduled = true;
		setTimeout(check, 200);
	});
	observer.observe(document.documentElement, { childList: true, subtree: true });
	check();
}
