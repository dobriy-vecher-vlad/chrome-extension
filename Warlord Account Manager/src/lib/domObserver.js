// Один MutationObserver на всю страницу для всех, кому нужно следить за DOM ВК (он SPA и постоянно перерисовывается).
// Подписчики вызываются не чаще раза за пачку изменений. Наблюдатель включается с первым подписчиком и выключается
// с последним.
const subscribers = new Set();
let observer = null;
let scheduled = false;

function flush() {
	scheduled = false;
	for (const callback of [...subscribers]) callback();
}

function onMutation() {
	if (scheduled) return;
	scheduled = true;
	setTimeout(flush, 30); // не rAF: в фоновой вкладке он не вызывается
}

// Возвращает функцию отписки
export function watchDom(callback) {
	subscribers.add(callback);
	if (!observer) {
		observer = new MutationObserver(onMutation);
		observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
	}
	return () => {
		subscribers.delete(callback);
		if (!subscribers.size && observer) {
			observer.disconnect();
			observer = null;
		}
	};
}
