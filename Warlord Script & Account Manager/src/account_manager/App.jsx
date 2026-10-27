import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdaptivityProvider, Alert, AppRoot, ConfigProvider, Tappable, useModalManager } from '@vkontakte/vkui';
import { Icon20Add, Icon20MoreHorizontal, Icon28SettingsOutline } from '@vkontakte/icons';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AccountRow, AccountSkeletonRow, accountTitle, SeparatorRow } from './components/AccountRow.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { Toasts } from '../shared/components/Toasts.jsx';
import { ManagerContext } from './ManagerContext.js';
import { useAccounts } from './hooks/useAccounts.js';
import { useColorScheme } from '../shared/hooks/useColorScheme.js';
import { useGameFrame } from './hooks/useGameFrame.js';
import { useLegacyImport } from './hooks/useLegacyImport.js';
import { usePanelBox } from './hooks/usePanelBox.js';
import { useSettings } from './hooks/useSettings.js';
import { fixLayoutWidth } from './lib/layoutWidth.js';
import { MIN_HEIGHT } from './lib/panelHost.js';
import { groupDefaults, isSeeThrough, SETTINGS_GROUPS } from './lib/settings.js';
import { loadLegacyNoticed, saveLegacyNoticed } from './lib/storage.js';

const ROW_HEIGHT = 30; // высота строки панели, см. .WarlordAccountManagerPanel__row в styles.css

// Подпись панели в цветовой схеме для заданного фона: тёмный фон — светлый текст и наоборот. null — фона нет, схема страницы.
const luminanceOfColor = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Влезает ли список в высоту avail целым числом элементов. Строки аккаунтов по 30px, разделители по 19px, поэтому
// кратность одной высоте строки не годится: берём наибольшую сумму высот первых элементов, не превышающую avail
// (хотя бы первый элемент). 'none' — помещается весь список, ограничивать его не нужно.
function fitList(heights, avail) {
	let sum = 0;
	let best = heights[0] ?? 0;
	for (const height of heights) {
		sum += height;
		if (sum > avail) return best;
		best = sum;
	}
	return 'none';
}

// #rrggbb и непрозрачность 0..1 → rgba(...)
const hexToRgba = (hex, alpha) => {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function Manager({ host, layer, settingsApi, pageScheme }) {
	const frame = useGameFrame();
	const { settings, image, update: updateSettings, updateBackground, setImage, reset: resetSettings } = settingsApi;
	const manager = useAccounts({ nicknames: settings.showNicknames, avatars: settings.showAvatars });
	const { ready, onFrameSrc, importAccounts } = manager;
	const free = settings.freeMode;
	const { background } = settings;
	const hasBackground = Boolean(background.color || image);

	// Высота списка подгоняется так, чтобы последний видимый элемент не обрезался пополам: и во встроенном режиме (потолок
	// считает CSS, мы уточняем его до границы элемента), и в свободном (высота панели подгоняется при перетаскивании за нижнюю
	// полоску). Для этого измеряются высоты элементов списка и высота всего остального в панели (панель минус список).
	const panelRef = useRef(null);
	const listRef = useRef(null);
	const heightsRef = useRef([]);
	const heightsKey = useRef('');
	const [chrome, setChrome] = useState(150);
	const [listMax, setListMax] = useState(null); // потолок высоты списка во встроенном режиме: число или 'none'
	const [, setFitTick] = useState(0); // размер окна или список изменились: подгонку нужно пересчитать
	const snapHeight = (height) => {
		const heights = heightsRef.current;
		if (!heights.length) return height;
		const available = height - chrome;
		const total = heights.reduce((sum, item) => sum + item, 0);
		// запас сверх списка отдаём целыми строками, как и раньше
		if (available >= total) return chrome + total + Math.floor((available - total) / ROW_HEIGHT) * ROW_HEIGHT;
		const fit = fitList(heights, available);
		return chrome + (fit === 'none' ? total : fit);
	};
	const { box, moveProps, resizeProps } = usePanelBox(host, free, settings.panel, (panel) => updateSettings({ panel }), snapHeight, settings.panelWidth);
	useLayoutEffect(() => {
		const panel = panelRef.current;
		const list = listRef.current;
		if (!panel || !list) return;
		const heights = [...list.children].map((item) => item.offsetHeight);
		heightsRef.current = heights;
		const measured = panel.offsetHeight - list.offsetHeight;
		if (measured > 0 && measured !== chrome) setChrome(measured);
		const key = heights.join(',');
		if (key !== heightsKey.current) {
			heightsKey.current = key;
			if (free) setFitTick((tick) => tick + 1);
		}
		if (free) {
			if (listMax !== null) setListMax(null);
			return;
		}
		// встроенный режим: потолок панели считает CSS (окно минус шапка и отступы), берём его готовым
		const panelMax = parseFloat(getComputedStyle(panel).maxHeight);
		if (!Number.isFinite(panelMax)) return;
		const next = fitList(heights, panelMax - measured);
		if (next !== listMax) setListMax(next);
	});
	useEffect(() => {
		const onResize = () => setFitTick((tick) => tick + 1);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	// Настройки оформления страницы. Менеджер монтируется, когда сохранённые настройки уже загружены, и пока панель не скрыта
	// (см. App): скрытая панель не правит страницу. Атрибуты на <html> включают правила из page.css, а внутри самого фрейма
	// игры рекламный блок скрывает game-frame.js (он читает ту же настройку из хранилища).
	const pageFlags = [
		['data-warlord-account-manager-compact-game-page', settings.hideAds],
		['data-warlord-account-manager-hide-similar-apps', settings.hideSimilarApps],
		['data-warlord-account-manager-hide-game-id', settings.hideGameId],
		['data-warlord-account-manager-hide-footer', settings.hideFooter],
		['data-warlord-account-manager-hide-options-bar', settings.hideOptionsBar],
	];
	const flagsKey = pageFlags.map(([, on]) => (on ? 1 : 0)).join('');
	useEffect(() => {
		const enabled = pageFlags.filter(([, on]) => on).map(([name]) => name);
		for (const name of enabled) document.documentElement.setAttribute(name, '');
		return () => enabled.forEach((name) => document.documentElement.removeAttribute(name));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flagsKey]);

	// метка «панель включена»: по ней page.css прячет панель старого расширения
	useEffect(() => {
		document.documentElement.setAttribute('data-warlord-account-manager-active', '');
		return () => document.documentElement.removeAttribute('data-warlord-account-manager-active');
	}, []);

	useEffect(() => {
		if (!settings.fixLayoutWidth) return undefined;
		return fixLayoutWidth();
	}, [settings.fixLayoutWidth]);

	// Включая свободный режим, панель остаётся там, где стояла: положение берём у встроенной колонки
	const setFreeMode = (on) => {
		if (on && !settings.panel) {
			const rect = host.getBoundingClientRect();
			const height = Math.max(MIN_HEIGHT * 1.2, Math.min(rect.height, window.innerHeight - rect.top - 16));
			updateSettings({ freeMode: true, panel: { x: Math.round(rect.left), y: Math.round(rect.top), height: Math.round(height) } });
		} else {
			updateSettings({ freeMode: on });
		}
	};

	// Пока открыто окно настроек, колонка остаётся поверх затемнения: в подложке окна вырезается «дырка» по рамке панели
	// (clip-path, см. styles.css). Путь считается в пикселях окна и пересчитывается, когда панель двигают, меняют ей размер
	// или окно прокручивают и меняют по размеру.
	const holeRef = useRef(null);
	holeRef.current = () => {
		const panel = panelRef.current;
		if (!panel) return;
		const rect = panel.getBoundingClientRect();
		const width = rect.width - (card ? 0 : 20); // у встроенной панели справа пустое поле под шестерёнку
		let value = 'none';
		if (!host.hidden && width > 0 && rect.height > 0) {
			const r = card ? 12 : 6;
			const [x, y, w, h] = [rect.left, rect.top, width, rect.height].map((n) => Math.round(n * 10) / 10);
			const hole = `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
			value = `path(evenodd, 'M0 0H${window.innerWidth}V${window.innerHeight}H0Z ${hole}')`;
		}
		layer.style.setProperty('--warlord-account-manager-hole', value);
	};
	useLayoutEffect(() => holeRef.current());
	useEffect(() => {
		const update = () => holeRef.current();
		const observer = new ResizeObserver(update);
		if (panelRef.current) observer.observe(panelRef.current);
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
			layer.style.removeProperty('--warlord-account-manager-hole');
		};
	}, [layer]);

	// Тосты справа снизу: подтверждают действия, результат которых иначе неочевиден
	// (копирование, добавление, сохранение, удаление, смена аккаунта) и сообщают об ошибках. См. shared/components/Toasts.jsx.
	const [toast, setToast] = useState(null);
	const notify = (text, kind = 'success') => setToast({ id: Date.now() + Math.random(), text, kind });
	const clearToast = (id) => setToast((current) => (current && current.id === id ? null : current));

	// ошибки смены аккаунта (нет нужных параметров в адресе игры) приходят как notice
	useEffect(() => {
		if (manager.notice) notify(manager.notice, 'error');
	}, [manager.notice]);

	// Подтверждение удаления — Alert из VKUI. Показываем его здесь, на уровне панели, а не внутри окна «Настройки»:
	// окно анимируется, а position: fixed внутри анимируемого блока ведёт себя неверно.
	// onClosed обязателен: в нём убираем Alert из дерева, иначе повторное открытие сломается. Убираем только свой Alert
	// (по key): новый Alert может уже заменить прежний, и его закрытие старого не должно его снести.
	const [alert, setAlert] = useState(null); // { key, element }
	const showAlert = (build, { keepCurrent = false } = {}) => {
		const key = Date.now() + Math.random();
		const closed = () => setAlert((current) => (current && current.key === key ? null : current));
		setAlert((current) => (keepCurrent && current ? current : { key, element: build(closed, key) }));
	};
	const confirmRemove = (account, onRemoved) => {
		showAlert((onClosed, key) => (
			<Alert
				key={key}
				onClosed={onClosed}
				dismissLabel="Отмена"
				actions={[
					{ title: 'Отмена', mode: 'cancel' },
					{
						title: 'Удалить',
						mode: 'destructive',
						action: () => {
							manager.remove(account.id);
							onRemoved?.();
							notify('Аккаунт удалён');
						},
					},
				]}
				title="Удалить аккаунт?"
				description={`«${accountTitle(account)}» пропадёт из списка. Игровой аккаунт при этом не удаляется: его можно добавить снова.`}
			/>
		));
	};

	// Бесшовный переход со старого расширения Warlord Script: его аккаунты забираем из его панели на странице
	// и один раз сообщаем, что старое расширение больше не нужно.
	const onLegacyFound = async (items) => {
		const { added } = importAccounts(items);
		if (!added && await loadLegacyNoticed()) return;
		saveLegacyNoticed();
		showAlert((onClosed, key) => (
			<Alert
				key={key}
				onClosed={onClosed}
				actions={[{ title: 'Понятно', mode: 'default' }]}
				title="Аккаунты перенесены"
				description={`${added
					? `Из старого расширения перенесено аккаунтов: ${added}.`
					: 'Все аккаунты из старого расширения уже есть в списке.'} Теперь старую версию Warlord Script с панелью аккаунтов можно удалить: список хранится в этом расширении, а панель старого мы скрыли.`}
			/>
		), { keepCurrent: true });
	};
	useLegacyImport(ready, onLegacyFound);

	// Очистка всех данных: аккаунты, настройки и кэш. Подтверждение, как и удаление аккаунта, показываем на уровне панели.
	const confirmClear = () => {
		showAlert((onClosed, key) => (
			<Alert
				key={key}
				onClosed={onClosed}
				dismissLabel="Отмена"
				actions={[
					{ title: 'Отмена', mode: 'cancel' },
					{
						title: 'Очистить',
						mode: 'destructive',
						action: async () => {
							await manager.clearAll();
							resetSettings();
							notify('Данные очищены');
						},
					},
				]}
				title="Очистить все данные?"
				description="Список аккаунтов, названия, порядок и настройки панели будут удалены. Останется только аккаунт, под которым вы сейчас в ВК. Игровые аккаунты при этом не удаляются: их можно добавить снова. Данные Warlord Script не затрагиваются."
			/>
		));
	};

	// Сброс одного блока «Оформления» к значениям по умолчанию (кнопка в конце блока)
	const resetGroup = (name, message) => {
		updateSettings(groupDefaults(name));
		if (SETTINGS_GROUPS[name].image) setImage(null);
		notify(message);
	};

	// Импорт оформления из файла: настройки подставляются целиком, кроме скрытия панели и положения панели в окне
	// (они остаются как есть: файл с чужого экрана не должен спрятать панель или унести её за край окна)
	const importAppearance = ({ settings: next, image: nextImage }) => {
		updateSettings({ ...next, panelHidden: settings.panelHidden, panel: settings.panel });
		setImage(nextImage);
	};

	// Скрытие панели: она исчезает вместе с окном настроек и всеми правками страницы игры, а вернуть её можно только
	// из настроек Warlord Script (на странице профиля). Поэтому сначала подтверждение.
	const confirmHidePanel = () => {
		showAlert((onClosed, key) => (
			<Alert
				key={key}
				onClosed={onClosed}
				dismissLabel="Отмена"
				actions={[
					{ title: 'Отмена', mode: 'cancel' },
					{ title: 'Скрыть', mode: 'destructive', action: () => updateSettings({ panelHidden: true }) },
				]}
				title="Скрыть панель аккаунтов?"
				description="Панель пропадёт со страницы игры, а вместе с ней отключатся и все правки страницы: реклама, «Игры для вас», подвал, шапка, ширина. Вернуть её можно будет только в настройках Warlord Script на странице профиля."
			/>
		));
	};

	// Окно «Настройки» открывает менеджер модальных окон VKUI. Оно одно, а разделы и форма аккаунта — виды этого окна:
	// переход между ними меняет только содержимое и ничего не мигает (см. SettingsModal).
	const [modals, modalHolder] = useModalManager({ noFocusToDialog: true });
	const openSettings = () => modals.openCustomModalPage({ id: 'settings', component: SettingsModal });
	const openAccountForm = (form) => modals.openCustomModalPage({
		id: 'settings',
		component: SettingsModal,
		additionalProps: { initial: { name: 'form', ...form } },
	});

	// Колонка видна на странице игры: ставим её сразу по адресу, пока ВК ещё рисует свои скелетоны
	// (иначе она «выпрыгивает» через полсекунды, когда появится фрейм). Не раньше, чем загружен список.
	// useLayoutEffect: показываем в том же кадре, в котором usePanelBox уже поставил хост на место (см. там).
	useLayoutEffect(() => {
		host.hidden = !(frame.present || frame.expected) || !ready;
	}, [host, frame.present, frame.expected, ready]);

	useEffect(() => {
		if (ready && frame.src) onFrameSrc(frame.src);
	}, [ready, frame.src, onFrameSrc]);

	// Панель рисуется карточкой в свободном режиме и когда задан фон (во втором случае без ручек перетаскивания и высоты).
	// Цвет текста подбирается под яркость фона: схема VKUI для самой панели переопределяется классом
	const card = free || hasBackground;
	// Без своего цвета картинка рисуется на прозрачной панели (сквозь неё видна страница), с цветом — поверх цвета
	// Фон целиком рисует слой внутри панели (цвет, картинка, затемнение), сама панель под ним прозрачная: иначе её собственный
	// непрозрачный фон просвечивал бы сквозь полупрозрачный цвет или картинку. Размытие страницы за панелью имеет смысл,
	// когда панель просвечивает: цвет не полностью непрозрачный или цвета нет.
	const glass = hasBackground;
	const seeThrough = hasBackground && isSeeThrough(background, Boolean(image));
	let scheme = null;
	if (hasBackground) {
		const pageLuminance = pageScheme === 'dark' ? 0.1 : 0.95;
		const colorAlpha = background.colorOpacity / 100;
		const underImage = background.color ? colorAlpha * luminanceOfColor(background.color) + (1 - colorAlpha) * pageLuminance : pageLuminance;
		const opacity = background.imageOpacity / 100;
		const base = image
			? opacity * Math.min(1, image.luminance * (background.brightness / 100)) + (1 - opacity) * underImage
			: underImage;
		scheme = base * (1 - background.dim / 100) < 0.5 ? 'dark' : 'light';
	}
	const panelClassName = [
		'WarlordAccountManagerPanel',
		free && 'WarlordAccountManagerPanel--free',
		card && 'WarlordAccountManagerPanel--card',
		card && !settings.panelBorder && 'WarlordAccountManagerPanel--borderless',
		card && !settings.panelShadow && 'WarlordAccountManagerPanel--shadowless',
		glass && 'WarlordAccountManagerPanel--glass',
		!settings.showAvatars && 'WarlordAccountManagerPanel--noAvatars',
		scheme && `vkui--vkCom--${scheme}`,
	].filter(Boolean).join(' ');
	const panelStyle = {
		...(free ? { height: `${box.height}px` } : null),
		// размытие страницы за панелью (только на прозрачной панели)
		...(seeThrough && background.backdropBlur > 0 ? { backdropFilter: `blur(${background.backdropBlur}px)`, WebkitBackdropFilter: `blur(${background.backdropBlur}px)` } : null),
	};

	return (
		<ManagerContext.Provider value={{ manager, confirmRemove, confirmClear, alertOpen: Boolean(alert), notify, appearance: { settings, image, update: updateSettings, updateBackground, setImage, setFreeMode, confirmHidePanel, resetGroup, importAppearance } }}>
			<div
				ref={panelRef}
				className={panelClassName}
				style={panelStyle}
			>
				{hasBackground && (
					<div className="WarlordAccountManagerPanel__background" style={background.color ? { backgroundColor: hexToRgba(background.color, background.colorOpacity / 100) } : undefined} aria-hidden="true">
						{image && (
							<div
								className="WarlordAccountManagerPanel__backgroundImage"
								style={{
									backgroundImage: `url("${image.data}")`,
									opacity: background.imageOpacity / 100,
									filter: `blur(${background.blur}px) brightness(${background.brightness}%) contrast(${background.contrast}%) saturate(${background.saturation}%)`,
								}}
							/>
						)}
						{background.dim > 0 && <div className="WarlordAccountManagerPanel__backgroundDim" style={{ background: `rgba(0, 0, 0, ${background.dim / 100})` }} />}
					</div>
				)}
				{/* свободный режим: верхняя полоска, за которую панель перетаскивают */}
				{free && (
					<div className="WarlordAccountManagerPanel__dragHandle" title="Перетащить панель" {...moveProps}>
						<Icon20MoreHorizontal />
					</div>
				)}
				<ul
					ref={listRef}
					className="WarlordAccountManagerPanel__list"
					style={listMax === null ? undefined : { maxHeight: listMax === 'none' ? 'none' : `${listMax}px` }}
				>
					{/* сохранённых аккаунтов ещё нет, а данные грузятся (первый запуск): заглушка вместо пустоты, как скелетоны ВК */}
					{manager.accounts.length === 0 && manager.loading && <AccountSkeletonRow showAvatar={settings.showAvatars} />}
					{manager.accounts.map((item) => (item.separator ? <SeparatorRow key={item.id} /> : (
						<AccountRow
							key={item.id}
							account={item}
							current={item.id === manager.currentId}
							loading={manager.loading}
							showAvatar={settings.showAvatars}
							showNickname={settings.showNicknames}
							showSettings={!card}
							onSelect={(target) => {
								// игра перезагружается секунду-две и без отклика непонятно, сработал ли клик
								const result = manager.switchTo(target);
								if (result === 'reloaded') notify('Обновляем игру');
								else if (result) notify(`Открываем игру под «${accountTitle(target)}»`);
							}}
							onEdit={(target) => openAccountForm({ mode: 'edit', accountId: target.id })}
						/>
					)))}
					{/* «Добавить аккаунт» — последняя строка того же списка: прокручивается вместе с аккаунтами */}
					<li className="WarlordAccountManagerPanel__item">
						<Tappable className="WarlordAccountManagerPanel__row" onClick={() => openAccountForm({ mode: 'add' })}>
							<span className="WarlordAccountManagerPanel__rowIcon"><Icon20Add /></span>
							<span className="WarlordAccountManagerPanel__rowText"><span className="WarlordAccountManagerPanel__rowName">Добавить аккаунт</span></span>
						</Tappable>
					</li>
				</ul>
				<div className="WarlordAccountManagerPanel__separator" />
				<Tappable className="WarlordAccountManagerPanel__row" onClick={openSettings}>
					<span className="WarlordAccountManagerPanel__rowIcon"><Icon28SettingsOutline width={20} height={20} /></span>
					<span className="WarlordAccountManagerPanel__rowText"><span className="WarlordAccountManagerPanel__rowName">Настройки</span></span>
				</Tappable>
				{modalHolder}
				{alert?.element}
				{createPortal(<Toasts toast={toast} onGone={clearToast} />, layer)}
				{free && <div className="WarlordAccountManagerPanel__resizeHandle" title="Изменить высоту" {...resizeProps} />}
			</div>
		</ManagerContext.Provider>
	);
}

export function App({ host, layer }) {
	const colorScheme = useColorScheme();
	// Настройки читает сама оболочка: панель монтируется, только когда они загружены и она не скрыта. Скрытая панель ничего не
	// делает: не ходит в сеть, не правит страницу и не следит за ней. Включить её обратно можно из настроек Warlord Script.
	const settingsApi = useSettings();
	const hidden = !settingsApi.ready || settingsApi.settings.panelHidden;
	useLayoutEffect(() => {
		if (hidden) host.hidden = true;
	}, [host, hidden]);
	// верхний слой (окна, подтверждения, уведомления) живёт в отдельном хосте и получает ту же тему
	useLayoutEffect(() => {
		layer.className = `WarlordAccountManagerLayer WarlordAccountManager vkui--vkCom--${colorScheme}`;
	}, [layer, colorScheme]);
	return (
		// в режиме embedded VKUI не вешает классы токенов темы сам, поэтому делаем это здесь
		<div className={`WarlordAccountManager vkui--vkCom--${colorScheme}`}>
			<ConfigProvider platform="vkcom" colorScheme={colorScheme}>
				<AdaptivityProvider>
					{/* scroll="contain": пока открыто окно, VKUI блокирует прокрутку. По умолчанию он делает это на <html> самой страницы ВК
						(position: fixed + top), что ломает шапку и раскладку ВК. С contain блокировка касается только нашего контейнера. */}
					<AppRoot mode="embedded" scroll="contain" portalRoot={layer} disableParentTransformForPositionFixedElements>
						<ErrorBoundary>
							{!hidden && <Manager host={host} layer={layer} settingsApi={settingsApi} pageScheme={colorScheme} />}
						</ErrorBoundary>
					</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>
		</div>
	);
}
