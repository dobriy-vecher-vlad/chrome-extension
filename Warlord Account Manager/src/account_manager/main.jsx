import { createRoot } from 'react-dom/client';
import vkuiCss from '@vkontakte/vkui/dist/vkui.css';
import sharedCss from '../shared/styles.css';
import ownCss from './styles.css';
import pageCss from './page.css';
import { App } from './App.jsx';
import { watchDom } from '../shared/lib/domObserver.js';
import { isGamePage } from './lib/gamePage.js';
import { EMBEDDED_STYLE, LAYER_STYLE, placeHost } from './lib/panelHost.js';

// Расширение работает только на странице игры vk.ru/app5536422 и больше нигде.
// manifest подключает скрипт при обычной загрузке этой страницы, а background.js подставляет его заново, когда внутри ВК
// (он SPA) перешли на неё без перезагрузки. Уходим со страницы — панель и стили страницы (page.css) убираются целиком,
// наблюдатель отключается.

// Таблица стилей: VKUI это сотни килобайт CSS, поэтому разбираем её один раз за жизнь страницы, а не при каждой вставке панели
// (панель вставляется заново при каждом возврате на страницу игры без перезагрузки). В Shadow DOM нет :root, токены тем VKUI
// вешаются на :host.
let cachedSheet = null;
function getSheet() {
	if (!cachedSheet) {
		cachedSheet = new CSSStyleSheet();
		cachedSheet.replaceSync(vkuiCss.replace(/:root/g, ':host') + sharedCss + ownCss);
	}
	return cachedSheet;
}

let instance = null; // { host, layerHost, pageStyle, root, unwatch }

function unmount() {
	if (!instance) return;
	instance.unwatch();
	instance.root.unmount();
	instance.host.remove();
	instance.layerHost.remove();
	instance.pageStyle.remove();
	instance = null;
}

function mount() {
	if (instance || !isGamePage()) return;

	// Хост и стили прежней копии скрипта остаются на странице, если расширение обновили или перезагрузили, пока она была открыта
	// (старая копия уже не работает, а новая о ней не знает): убираем их, чтобы панель не задваивалась.
	document.querySelectorAll('#warlord-account-manager-host, #warlord-account-manager-layer, #warlord-account-manager-page-style').forEach((node) => node.remove());

	// Стили страницы ВК (высота фрейма игры, скрытие панели старого расширения) живут ровно столько же, сколько панель,
	// а не остаются в странице после ухода с игры, как остался бы CSS из manifest или insertCSS.
	const pageStyle = document.createElement('style');
	pageStyle.id = 'warlord-account-manager-page-style';
	pageStyle.textContent = pageCss;
	document.head.append(pageStyle);

	// Интерфейс живёт в Shadow DOM: стили VKUI и ВК не влияют друг на друга.
	// Хост ставим в тот же блок страницы, где раньше жила панель, справа от окна игры.
	const host = document.createElement('div');
	host.id = 'warlord-account-manager-host';
	host.hidden = true;
	host.style.cssText = EMBEDDED_STYLE; // в свободном режиме положение задаёт сама панель (см. usePanelBox)

	// Стили общие для панели и верхнего слоя: одна таблица на оба Shadow DOM, см. getSheet
	const sheet = getSheet();
	const shadow = host.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [sheet];
	const container = document.createElement('div');
	shadow.append(container);

	// Второй хост, прямо в <body>, для всего, что должно перекрывать страницу: окна, подтверждения, уведомления.
	// Панель стоит внутри блока страницы ВК, и её окна наследовали порядок наложения этого блока (шапка ВК оказывалась
	// поверх затемнения, а чат справа внизу и уведомления под ним). Здесь собственный верхний слой: нулевого размера,
	// содержимое (position: fixed) рисуется относительно окна.
	const layerHost = document.createElement('div');
	layerHost.id = 'warlord-account-manager-layer';
	layerHost.style.cssText = LAYER_STYLE;
	const layerShadow = layerHost.attachShadow({ mode: 'open' });
	layerShadow.adoptedStyleSheets = [sheet];
	const layer = document.createElement('div');
	layerShadow.append(layer);
	document.body.append(layerHost);

	const root = createRoot(container);
	root.render(<App host={host} layer={layer} />);

	// ВК перерисовывает страницу без перезагрузки: возвращаем хост на место, а если ушли со страницы игры — убираем всё
	const check = () => {
		if (!instance) return;
		if (!isGamePage()) {
			unmount();
			return;
		}
		placeHost(host);
		if (!layerHost.isConnected) document.body.append(layerHost);
	};
	const unwatch = watchDom(check);

	instance = { host, layerHost, pageStyle, root, unwatch };
	check();
}

// Повторная подстановка скрипта (SPA-переход на страницу игры) не создаёт вторую копию, а только пробует смонтироваться
if (window.__warlordAccountManager) {
	window.__warlordAccountManager.mount();
} else {
	window.__warlordAccountManager = { mount };
	mount();
}
