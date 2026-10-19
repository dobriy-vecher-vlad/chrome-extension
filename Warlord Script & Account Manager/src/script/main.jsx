import { createRoot } from 'react-dom/client';
import { watchDom } from '../shared/lib/domObserver.js';
import { ScriptBlock } from './components/ScriptBlock.jsx';
import { createLayer, getStyles, readTokens } from './lib/pageHost.js';

// Warlord Script: блок характеристик игрока на странице профиля vk.ru. Скрипт подставляет background, когда probe.js увидел профиль.
// ВК — SPA: колонка профиля может исчезнуть и появиться снова (другой профиль), поэтому блок следит за страницей:
// появилась колонка — вставляем блок первым в неё, ушли с профиля или перешли на другой — убираем и вставляем заново.

const HOST_ID = 'warlord-script-host';
const LAYER_ID = 'warlord-script-layer';

const findColumn = () => document.querySelector('#page_body .Profile__column');

let instance = null; // { host, layerHost, root, column, path }

function unmount() {
	if (!instance) return;
	instance.root.unmount();
	instance.host.remove();
	instance.layerHost.remove();
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

	const { layerHost, layer } = createLayer(LAYER_ID);

	column.prepend(host);
	const root = createRoot(container);
	const path = location.pathname;
	// цвета блок берёт у колонки профиля
	root.render(<ScriptBlock layer={layer} path={path} readTokens={() => readTokens(column)} />);
	instance = { host, layerHost, root, column, path };
}

function sync() {
	const column = findColumn();
	if (!column) {
		unmount();
		return;
	}
	if (instance && instance.host.isConnected && instance.column === column && instance.path === location.pathname) return;
	unmount();
	mount(column);
}

if (!window.__warlordScript) {
	window.__warlordScript = true;
	watchDom(sync);
	sync();
}
