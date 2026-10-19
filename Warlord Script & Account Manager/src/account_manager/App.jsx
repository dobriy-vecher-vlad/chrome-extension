import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdaptivityProvider, Alert, AppRoot, ConfigProvider, Tappable, useModalManager } from '@vkontakte/vkui';
import { Icon20Add, Icon20MoreHorizontal, Icon28SettingsOutline } from '@vkontakte/icons';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AccountRow, AccountSkeletonRow, accountTitle } from './components/AccountRow.jsx';
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
import { loadLegacyNoticed, saveLegacyNoticed } from './lib/storage.js';

const ROW_HEIGHT = 30; // высота строки панели, см. .WarlordAccountManagerPanel__row в styles.css

function Manager({ host, layer }) {
	const frame = useGameFrame();
	const manager = useAccounts();
	const { ready, onFrameSrc, importAccounts } = manager;
	const { settings, ready: settingsReady, update: updateSettings, reset: resetSettings } = useSettings();
	const free = settings.freeMode;

	// Высота панели в свободном режиме подгоняется так, чтобы список аккаунтов вмещал целое число строк (30px), как и во
	// встроенном (см. .WarlordAccountManagerPanel__list в styles.css). Для этого нужна высота всего остального в панели: она измеряется (панель
	// минус список) и не зависит от высоты списка.
	const panelRef = useRef(null);
	const listRef = useRef(null);
	const [chrome, setChrome] = useState(150);
	const snapHeight = (height) => chrome + Math.max(1, Math.floor((height - chrome) / ROW_HEIGHT)) * ROW_HEIGHT;
	const { box, moveProps, resizeProps } = usePanelBox(host, free, settings.panel, (panel) => updateSettings({ panel }), snapHeight);
	useLayoutEffect(() => {
		if (!free || !panelRef.current || !listRef.current) return;
		const measured = panelRef.current.offsetHeight - listRef.current.offsetHeight;
		if (measured > 0 && measured !== chrome) setChrome(measured);
	});

	// Настройки оформления. Применяются только после загрузки сохранённых, чтобы страница не мигала значениями по умолчанию.
	// Атрибут на <html> включает правила высоты фрейма игры из page.css, а внутри самого фрейма рекламный блок скрывает game-frame.js
	// (он читает ту же настройку из хранилища).
	useEffect(() => {
		if (!settingsReady || !settings.hideAds) return undefined;
		document.documentElement.setAttribute('data-warlord-account-manager-compact-game-page', '');
		return () => document.documentElement.removeAttribute('data-warlord-account-manager-compact-game-page');
	}, [settingsReady, settings.hideAds]);

	useEffect(() => {
		if (!settingsReady || !settings.fixLayoutWidth) return undefined;
		return fixLayoutWidth();
	}, [settingsReady, settings.fixLayoutWidth]);

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
	// (иначе она «выпрыгивает» через полсекунды, когда появится фрейм). Не раньше, чем загружены список и настройки.
	// useLayoutEffect: показываем в том же кадре, в котором usePanelBox уже поставил хост на место (см. там).
	useLayoutEffect(() => {
		host.hidden = !(frame.present || frame.expected) || !ready || !settingsReady;
	}, [host, frame.present, frame.expected, ready, settingsReady]);

	useEffect(() => {
		if (ready && frame.src) onFrameSrc(frame.src);
	}, [ready, frame.src, onFrameSrc]);

	return (
		<ManagerContext.Provider value={{ manager, confirmRemove, confirmClear, alertOpen: Boolean(alert), notify, appearance: { settings, update: updateSettings, setFreeMode } }}>
			<div
				ref={panelRef}
				className={free ? 'WarlordAccountManagerPanel WarlordAccountManagerPanel--free' : 'WarlordAccountManagerPanel'}
				style={free ? { height: `${box.height}px` } : undefined}
			>
				{/* свободный режим: верхняя полоска, за которую панель перетаскивают */}
				{free && (
					<div className="WarlordAccountManagerPanel__dragHandle" title="Перетащить панель" {...moveProps}>
						<Icon20MoreHorizontal />
					</div>
				)}
				<ul ref={listRef} className="WarlordAccountManagerPanel__list">
					{/* сохранённых аккаунтов ещё нет, а данные грузятся (первый запуск): заглушка вместо пустоты, как скелетоны ВК */}
					{manager.accounts.length === 0 && manager.loading && <AccountSkeletonRow />}
					{manager.accounts.map((item) => (
						<AccountRow
							key={item.id}
							account={item}
							current={item.id === manager.currentId}
							loading={manager.loading}
							onSelect={(target) => {
								// игра перезагружается секунду-две и без отклика непонятно, сработал ли клик
								if (manager.switchTo(target)) notify(`Открываем игру под «${accountTitle(target)}»`);
							}}
							onEdit={(target) => openAccountForm({ mode: 'edit', accountId: target.id })}
						/>
					))}
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
							<Manager host={host} layer={layer} />
						</ErrorBoundary>
					</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>
		</div>
	);
}
