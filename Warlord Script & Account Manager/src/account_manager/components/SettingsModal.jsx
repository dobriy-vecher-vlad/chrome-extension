import { useEffect, useRef, useState } from 'react';
import { Button, Footnote, ModalPage, ModalPageHeader, PanelHeaderBack, SimpleCell } from '@vkontakte/vkui';
import { Icon28FolderOutline, Icon28HelpCircleOutline, Icon28KeyOutline, Icon28PaletteOutline, Icon28Users3Outline } from '@vkontakte/icons';
import { useManagerContext } from '../ManagerContext.js';
import { AccountForm } from './AccountForm.jsx';
import { AccountsView } from './AccountsView.jsx';
import { AppearanceView } from './AppearanceView.jsx';
import { HelpView } from './HelpView.jsx';
import { ProjectLinks } from '../../shared/components/ProjectLinks.jsx';
import { MyDataView } from './MyDataView.jsx';
import { StorageView } from './StorageView.jsx';

// «1 аккаунт», «2 аккаунта», «5 аккаунтов»
function accountsCount(n) {
	const mod100 = n % 100;
	const mod10 = n % 10;
	const word = mod100 >= 11 && mod100 <= 14 ? 'аккаунтов' : mod10 === 1 ? 'аккаунт' : mod10 >= 2 && mod10 <= 4 ? 'аккаунта' : 'аккаунтов';
	return `${n} ${word}`;
}

const SECTIONS = [
	{ name: 'accounts', title: 'Аккаунты', subtitle: 'Список, порядок, добавление и правка', icon: <Icon28Users3Outline /> },
	{ name: 'storage', title: 'Хранилище', subtitle: 'Импорт, экспорт и очистка данных', icon: <Icon28FolderOutline /> },
	{ name: 'appearance', title: 'Оформление', subtitle: 'Вид страницы игры и панели', icon: <Icon28PaletteOutline /> },
	{ name: 'help', title: 'Справка', subtitle: 'Как работает расширение и что оно хранит', icon: <Icon28HelpCircleOutline /> },
	{ name: 'mydata', title: 'Мои данные', subtitle: 'Скопировать свой ID и игровой ключ', icon: <Icon28KeyOutline /> },
];

// Единое окно «Настройки»: меню разделов и сами разделы — виды ОДНОГО окна. Раньше каждый раздел был вторым окном
// поверх первого, и при переходе два окна разного размера на ~0.2с накладывались друг на друга — это и было «морганием».
// Теперь меняется только содержимое.
// Окно создаёт useModalManager; initial = { name: 'form', mode, accountId } открывает сразу форму аккаунта (шестерёнка в колонке).
// Виды хранятся стеком (историей): переход вглубь добавляет вид, «Назад», клик по подложке и Esc возвращают к предыдущему,
// а когда вид один, закрывают окно.
export function SettingsModal({ modalProps, close, initial }) {
	const { manager, alertOpen } = useManagerContext();
	const [stack, setStack] = useState([initial || { name: 'menu' }]);
	const [reorder, setReorder] = useState(false);
	const view = stack[stack.length - 1];
	const standalone = view.name === 'form' && stack.length === 1; // форма открыта сразу, возвращаться некуда

	const go = (next) => {
		setReorder(false);
		setStack((current) => [...current, next]);
	};
	const goBack = () => {
		if (stack.length <= 1) {
			close();
			return;
		}
		setReorder(false);
		setStack((current) => current.slice(0, -1));
	};

	// Esc: как «Назад» или «Закрыть». ModalPage сам Esc не обрабатывает. Пока открыто подтверждение (Alert), Esc
	// относится к нему: оно закрывается само, а окно под ним трогать не нужно.
	const onEscape = useRef(null);
	onEscape.current = (event) => {
		if (event.key !== 'Escape' || event.defaultPrevented || alertOpen) return;
		goBack();
	};
	useEffect(() => {
		const onKey = (event) => onEscape.current(event);
		// Фокус внутри фрейма игры (он чужой): нажатия клавиш уходят в него, а страница их не видит. Пока окно открыто,
		// возвращаем фокус странице, и при открытии, и если он снова ушёл во фрейм.
		const leaveFrame = () => {
			const active = document.activeElement;
			if (active && active.tagName === 'IFRAME') active.blur();
		};
		const onBlur = () => setTimeout(leaveFrame, 0); // activeElement обновляется уже после события
		leaveFrame();
		// capture: страница ВК не должна перехватить Esc раньше нас
		window.addEventListener('keydown', onKey, true);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('keydown', onKey, true);
			window.removeEventListener('blur', onBlur);
		};
	}, []);

	const back = <PanelHeaderBack label="Назад" onClick={goBack} />;
	const header = {
		menu: <ModalPageHeader>Настройки</ModalPageHeader>,
		accounts: (
			<ModalPageHeader
				before={back}
				after={manager.accounts.length > 1 && (
					<Button className="WarlordAccountManagerSettingsModal__editButton" mode="tertiary" size="m" onClick={() => setReorder(!reorder)}>
						{reorder ? 'Готово' : 'Изменить'}
					</Button>
				)}
			>
				Аккаунты
			</ModalPageHeader>
		),
		storage: <ModalPageHeader before={back}>Хранилище</ModalPageHeader>,
		appearance: <ModalPageHeader before={back}>Оформление</ModalPageHeader>,
		help: <ModalPageHeader before={back}>Справка</ModalPageHeader>,
		mydata: <ModalPageHeader before={back}>Мои данные</ModalPageHeader>,
	}[view.name];

	let content;
	switch (view.name) {
		case 'menu':
			content = (
				<>
					{SECTIONS.map((section) => (
						<SimpleCell key={section.name} before={section.icon} subtitle={section.subtitle} chevron="always" onClick={() => go({ name: section.name })}>
							{section.title}
						</SimpleCell>
					))}
					<ProjectLinks token={manager.token} />
				</>
			);
			break;
		case 'accounts':
			content = <AccountsView reorder={reorder} onForm={(form) => go({ name: 'form', ...form })} />;
			break;
		case 'storage':
			content = <StorageView />;
			break;
		case 'appearance':
			content = <AppearanceView />;
			break;
		case 'help':
			content = <HelpView />;
			break;
		case 'mydata':
			content = <MyDataView />;
			break;
		default:
			content = (
				<AccountForm
					key={`${view.mode}:${view.accountId ?? 'new'}`}
					mode={view.mode}
					accountId={view.accountId}
					standalone={standalone}
					onDone={goBack}
				/>
			);
	}

	return (
		<ModalPage
			{...modalProps}
			onClose={goBack}
			size={420}
			aria-label="Настройки"
			header={header}
			footer={view.name === 'accounts' ? <Footnote className="WarlordAccountManagerSettingsModal__accountCount">{accountsCount(manager.accounts.length)}</Footnote> : undefined}
		>
			{content}
		</ModalPage>
	);
}
