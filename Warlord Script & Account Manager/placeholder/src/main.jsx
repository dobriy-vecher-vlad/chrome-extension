import { createRoot } from 'react-dom/client';
import { watchDom } from '../../src/shared/lib/domObserver.js';
import { Block } from './Block.jsx';
import { getStyles, readTokens } from './pageStyles.js';

// Заглушка вместо Warlord Script: на странице профиля vk.ru вместо характеристик игрока показывает блок с кнопкой
// «Обновить расширение», которая ведёт на новое расширение в Chrome Web Store. ВК — SPA: колонка профиля может исчезнуть и
// появиться снова (другой профиль), поэтому блок следит за страницей, как блок Warlord Script: появилась колонка — вставляем
// блок первым в неё, ушли с профиля или перешли на другой — убираем и вставляем заново.

const HOST_ID = 'warlord-script-placeholder-host';
const NEW_EXTENSION_HOST_ID = 'warlord-script-host'; // блок нового расширения: если он уже на странице, заглушка не нужна

const findColumn = () => document.querySelector('#page_body .Profile__column');

let instance = null; // { host, root, column, path }

function unmount() {
	if (!instance) return;
	instance.root.unmount();
	instance.host.remove();
	instance = null;
}

function mount(column) {
	// остатки прежней копии скрипта (расширение обновили при открытой странице)
	document.getElementById(HOST_ID)?.remove();

	const host = document.createElement('div');
	host.id = HOST_ID;
	const shadow = host.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [getStyles().sheet];
	const container = document.createElement('div');
	shadow.append(container);

	column.prepend(host);
	const root = createRoot(container);
	root.render(<Block readTokens={() => readTokens(column)} />);
	instance = { host, root, column, path: location.pathname };
}

function sync() {
	const column = findColumn();
	if (!column || document.getElementById(NEW_EXTENSION_HOST_ID)) {
		unmount();
		return;
	}
	if (instance && instance.host.isConnected && instance.column === column && instance.path === location.pathname) return;
	unmount();
	mount(column);
}

if (!window.__warlordScriptPlaceholder) {
	window.__warlordScriptPlaceholder = true;
	watchDom(sync);
	sync();
}
