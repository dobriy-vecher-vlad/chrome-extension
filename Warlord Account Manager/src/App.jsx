import { useEffect, useState } from 'react';
import { AdaptivityProvider, Alert, AppRoot, Avatar, ConfigProvider, Tappable, useModalManager } from '@vkontakte/vkui';
import { Icon20Add, Icon20ServicesOutline, Icon20Users3Outline, Icon28SettingsOutline } from '@vkontakte/icons';
import { AccountRow, AccountSkeletonRow, accountTitle } from './components/AccountRow.jsx';
import { AccountsModal } from './components/AccountsModal.jsx';
import { Toasts } from './components/Toast.jsx';
import { ManagerContext } from './context.js';
import { useAccounts } from './hooks/useAccounts.js';
import { useColorScheme } from './hooks/useColorScheme.js';
import { useGameFrame } from './hooks/useGameFrame.js';
import { useLegacyImport } from './hooks/useLegacyImport.js';
import { useVkImage } from './hooks/useVkImage.js';
import { loadLegacyNoticed, saveLegacyNoticed } from './lib/storage.js';

// Сообщество проекта: ссылка внизу панели, как избранная группа в левом меню ВК
const GROUP = { screenName: 'wiki.warlord', title: 'WARLORD: База Знаний', url: 'https://vk.ru/wiki.warlord' };

// Приложение-помощник: пока иконка не загрузилась, показываем общую иконку «сервисов»
const HELPER = { appId: 7787242, title: 'Warlord Helper', url: 'https://vk.ru/app7787242' };

function Manager({ host }) {
	const frame = useGameFrame();
	const manager = useAccounts();
	const groupPhoto = useVkImage('vk-group', GROUP.screenName, manager.token);
	const helperIcon = useVkImage('vk-app', HELPER.appId, manager.token);
	const { ready, onFrameSrc, importAccounts } = manager;

	// Тосты справа снизу: подтверждают действия, результат которых иначе неочевиден
	// (копирование, добавление, сохранение, удаление, смена аккаунта) и сообщают об ошибках. См. Toast.jsx.
	const [toast, setToast] = useState(null);
	const notify = (text, kind = 'success') => setToast({ id: Date.now() + Math.random(), text, kind });
	const clearToast = (id) => setToast((current) => (current && current.id === id ? null : current));

	// ошибки смены аккаунта (нет нужных параметров в адресе игры) приходят как notice
	useEffect(() => {
		if (manager.notice) notify(manager.notice, 'error');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [manager.notice]);

	// Подтверждение удаления — Alert из VKUI. Показываем его здесь, на уровне панели, а не внутри окна «Аккаунты»:
	// окно анимируется, а position: fixed внутри анимируемого блока ведёт себя неверно.
	// onClosed обязателен: в нём убираем Alert из дерева, иначе повторное открытие сломается.
	const [alert, setAlert] = useState(null);
	const confirmRemove = (account, onRemoved) => {
		if (alert) return;
		setAlert(
			<Alert
				onClosed={() => setAlert(null)}
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
			/>,
		);
	};

	// Бесшовный переход со старого расширения Warlord Script: его аккаунты забираем из его панели на странице
	// и один раз сообщаем, что старое расширение больше не нужно.
	const onLegacyFound = async (items) => {
		const { added } = importAccounts(items);
		if (!added && await loadLegacyNoticed()) return;
		saveLegacyNoticed();
		setAlert((current) => current || (
			<Alert
				onClosed={() => setAlert(null)}
				actions={[{ title: 'Понятно', mode: 'default' }]}
				title="Аккаунты перенесены"
				description={`${added
					? `Из старого расширения перенесено аккаунтов: ${added}.`
					: 'Все аккаунты из старого расширения уже есть в списке.'} Теперь Warlord Script можно удалить: список хранится в этом расширении, а панель старого мы скрыли.`}
			/>
		));
	};
	useLegacyImport(ready, onLegacyFound);

	// Окно «Аккаунты» открывает менеджер модальных окон VKUI. Оно одно, а список и форма — виды этого окна:
	// переход между ними меняет только содержимое и ничего не мигает (см. AccountsModal).
	const [modals, modalHolder] = useModalManager({ noFocusToDialog: true });
	const openAccounts = () => modals.openCustomModalPage({ id: 'accounts', component: AccountsModal });
	const openAccountForm = (form) => modals.openCustomModalPage({
		id: 'accounts',
		component: AccountsModal,
		additionalProps: { initial: { name: 'form', ...form } },
	});

	// Колонка видна на странице игры: ставим её сразу по адресу, пока ВК ещё рисует свои скелетоны
	// (иначе она «выпрыгивает» через полсекунды, когда появится фрейм). Не раньше, чем загружен сохранённый список.
	useEffect(() => {
		host.hidden = !(frame.present || frame.expected) || !ready;
	}, [host, frame.present, frame.expected, ready]);

	useEffect(() => {
		if (ready && frame.src) onFrameSrc(frame.src);
	}, [ready, frame.src, onFrameSrc]);

	return (
		<ManagerContext.Provider value={{ manager, confirmRemove, notify }}>
			<div className="wam">
				<ul className="wam-list">
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
					<li className="wam-item">
						<Tappable className="wam-row wam-add" onClick={() => openAccountForm({ mode: 'add' })}>
							<span className="wam-row__icon wam-row__icon--accent"><Icon20Add /></span>
							<span className="wam-row__text"><span className="wam-row__name">Добавить аккаунт</span></span>
						</Tappable>
					</li>
				</ul>
					<div className="wam-separator" />
				<Tappable className="wam-row" onClick={openAccounts}>
					<span className="wam-row__icon wam-row__icon--accent"><Icon28SettingsOutline width={20} height={20} /></span>
					<span className="wam-row__text"><span className="wam-row__name">Настройки</span></span>
				</Tappable>
				<Tappable className="wam-row" href={GROUP.url} target="_blank" rel="noopener noreferrer">
					{groupPhoto ? (
						<Avatar className="wam-row__icon" size={20} src={groupPhoto} />
					) : (
						<span className="wam-row__icon wam-row__icon--accent"><Icon20Users3Outline /></span>
					)}
					<span className="wam-row__text"><span className="wam-row__name">{GROUP.title}</span></span>
				</Tappable>
				<Tappable className="wam-row" href={HELPER.url} target="_blank" rel="noopener noreferrer">
					<span className="wam-row__icon wam-row__icon--accent">
						{helperIcon ? <img className="wam-app-icon" src={helperIcon} alt="" /> : <Icon20ServicesOutline />}
					</span>
					<span className="wam-row__text"><span className="wam-row__name">{HELPER.title}</span></span>
				</Tappable>
				{modalHolder}
				{alert}
				<Toasts toast={toast} onGone={clearToast} />
			</div>
		</ManagerContext.Provider>
	);
}

export function App({ host }) {
	const colorScheme = useColorScheme();
	return (
		// в режиме embedded VKUI не вешает классы токенов темы сам, поэтому делаем это здесь
		<div className={`wam-theme vkui--vkCom--${colorScheme}`}>
			<ConfigProvider platform="vkcom" colorScheme={colorScheme}>
				<AdaptivityProvider>
					<AppRoot mode="embedded" disablePortal disableParentTransformForPositionFixedElements>
						<Manager host={host} />
					</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>
		</div>
	);
}
