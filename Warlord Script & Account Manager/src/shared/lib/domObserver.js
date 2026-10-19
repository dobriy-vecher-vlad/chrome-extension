// Один MutationObserver на всю страницу для всех, кому нужно следить за DOM ВК (он SPA и постоянно перерисовывается).
// Подписчики вызываются не чаще раза за пачку изменений. Наблюдатель включается с первым подписчиком и выключается
// с последним. По умолчанию следим только за появлением и удалением элементов; изменения атрибута src (смена адреса фрейма
// игры) нужны не всем, поэтому включаются, только если о них попросили (watchSrc).
const subscribers = new Set();
let observer = null;
let watchingSrc = false;
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

const observe = () => observer.observe(document.documentElement, watchingSrc
	? { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] }
	: { childList: true, subtree: true });

// Возвращает функцию отписки
export function watchDom(callback, { watchSrc = false } = {}) {
	subscribers.add(callback);
	if (!observer) {
		observer = new MutationObserver(onMutation);
		watchingSrc = watchSrc;
		observe();
	} else if (watchSrc && !watchingSrc) {
		watchingSrc = true;
		observe(); // повторный вызов заменяет параметры наблюдения
	}
	return () => {
		subscribers.delete(callback);
		if (!subscribers.size && observer) {
			observer.disconnect();
			observer = null;
			watchingSrc = false;
		}
	};
}
