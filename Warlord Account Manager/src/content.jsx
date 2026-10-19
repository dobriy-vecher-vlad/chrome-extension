import { createRoot } from 'react-dom/client';
import vkuiCss from '@vkontakte/vkui/dist/vkui.css';
import ownCss from './styles.css';
import { App } from './App.jsx';
import { isGamePage } from './lib/gamePage.js';

// Расширение работает только на странице игры vk.ru/app5536422 и больше нигде.
// manifest подключает скрипт при обычной загрузке этой страницы, а background.js подставляет его заново, когда внутри ВК
// (он SPA) перешли на неё без перезагрузки. Уходим со страницы — панель убирается целиком, наблюдатели отключаются.

let instance = null; // { host, root, observer }

function unmount() {
	if (!instance) return;
	instance.observer.disconnect();
	instance.root.unmount();
	instance.host.remove();
	instance = null;
}

function mount() {
	if (instance || !isGamePage()) return;

	// Интерфейс живёт в Shadow DOM: стили VKUI и ВК не влияют друг на друга.
	// Хост ставим в тот же блок страницы, где раньше жила панель, справа от окна игры.
	const host = document.createElement('div');
	host.id = 'wam-host';
	host.hidden = true;
	host.style.cssText = [
		'position: absolute',
		'top: calc(var(--spa-layout-header-height) + var(--page-block-offset))',
		'left: calc(100% + 6px - 16px)',
		'width: 264px',
	].join(';');

	const shadow = host.attachShadow({ mode: 'open' });
	const style = document.createElement('style');
	// в Shadow DOM нет :root, токены тем VKUI вешаются на :host
	style.textContent = vkuiCss.replace(/:root/g, ':host') + ownCss;
	const container = document.createElement('div');
	shadow.append(style, container);

	const root = createRoot(container);
	root.render(<App host={host} />);

	// ВК перерисовывает страницу без перезагрузки: возвращаем хост на место, а если ушли со страницы игры — убираем всё
	let scheduled = false;
	const check = () => {
		scheduled = false;
		if (!instance) return;
		if (!isGamePage()) {
			unmount();
			return;
		}
		if (!host.isConnected) document.querySelector('[class*="LayoutWrapper__body"]')?.append(host);
	};
	const observer = new MutationObserver(() => {
		if (scheduled) return;
		scheduled = true;
		setTimeout(check, 30); // не rAF: в фоновой вкладке он не вызывается
	});
	observer.observe(document.documentElement, { childList: true, subtree: true });

	instance = { host, root, observer };
	check();
}

// Повторная подстановка скрипта (SPA-переход на страницу игры) не создаёт вторую копию, а только пробует смонтироваться
if (window.__wam) {
	window.__wam.mount();
} else {
	window.__wam = { mount };
	mount();
}
