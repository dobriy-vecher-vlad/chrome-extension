import { useContext, useEffect, useRef, useState } from 'react';
import { ModalPage, ModalPageHeader, PanelHeaderBack, SimpleCell } from '@vkontakte/vkui';
import {
	Icon28FolderOutline,
	Icon28GlobeOutline,
	Icon28HelpCircleOutline,
	Icon28ListBulletSquareOutline,
	Icon28SettingsOutline,
	Icon28SortOutline,
} from '@vkontakte/icons';
import { BlocksView, ChoiceView, GeneralView } from './SettingsViews.jsx';
import { HelpPanel } from './HelpView.jsx';
import { ProjectLinks } from '../../shared/components/ProjectLinks.jsx';
import { SchemeContext } from '../lib/SchemeContext.js';
import { StorageView } from './StorageView.jsx';
import { useProfileSettings } from '../lib/ScriptSettingsContext.js';

const SECTIONS = [
	{ name: 'general', title: 'Общие настройки', subtitle: 'Версия расширения', icon: <Icon28SettingsOutline />, view: <GeneralView /> },
	{ name: 'blocks', title: 'Отображаемые блоки', subtitle: 'Какие разделы показывать', icon: <Icon28ListBulletSquareOutline />, view: <BlocksView /> },
	{ name: 'sorting', title: 'Сортировка состава', subtitle: 'Порядок игроков в составе гильдии', icon: <Icon28SortOutline />, view: <ChoiceView name="sorting" /> },
	{ name: 'server', title: 'Сервер игры', subtitle: 'Чьи данные показывать по умолчанию', icon: <Icon28GlobeOutline />, view: <ChoiceView name="server" /> },
	{ name: 'storage', title: 'Хранилище', subtitle: 'Импорт, экспорт и очистка данных', icon: <Icon28FolderOutline />, view: <StorageView /> },
	{ name: 'help', title: 'Справка', subtitle: 'Как работает расширение и что оно хранит', icon: <Icon28HelpCircleOutline />, view: <HelpPanel /> },
];

// Окно «Настройки» блока: меню разделов и сами разделы — виды ОДНОГО окна (как в панели аккаунтов).
// Виды хранятся стеком: «Назад», клик по подложке и Esc возвращают к предыдущему, а когда вид один, закрывают окно.
export function ProfileSettingsModal({ modalProps, close }) {
	const { onClosed, alertOpen } = useProfileSettings();
	const [stack, setStack] = useState(['menu']);
	const colorScheme = useContext(SchemeContext);
	const view = stack[stack.length - 1];

	const goBack = () => {
		if (stack.length <= 1) {
			close();
			onClosed();
			return;
		}
		setStack((current) => current.slice(0, -1));
	};

	// Esc: как «Назад» или «Закрыть». ModalPage сам Esc не обрабатывает
	const onEscape = useRef(null);
	onEscape.current = (event) => {
		if (event.key !== 'Escape' || event.defaultPrevented || alertOpen.current) return;
		goBack();
	};
	useEffect(() => {
		const onKey = (event) => onEscape.current(event);
		// capture: страница ВК не должна перехватить Esc раньше нас
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, []);

	const section = SECTIONS.find((item) => item.name === view);
	const header = section
		? <ModalPageHeader before={<PanelHeaderBack label="Назад" onClick={goBack} />}>{section.title}</ModalPageHeader>
		: <ModalPageHeader>Настройки</ModalPageHeader>;

	return (
		// Окно оформлено как окно панели аккаунтов: собственные токены цвета VKUI, а не токены страницы ВК, которыми рисуется
		// сам блок (платформа vkcom и размеры для касаний заданы в ProfileBlock для всего верхнего слоя)
		<ModalPage {...modalProps} className={`WarlordScriptSettingsModal vkui--vkCom--${colorScheme}`} onClose={goBack} size={420} aria-label="Настройки" header={header}>
			{section ? section.view : (
				<>
					{SECTIONS.map((item) => (
						<SimpleCell key={item.name} before={item.icon} subtitle={item.subtitle} chevron="always" onClick={() => setStack([...stack, item.name])}>
							{item.title}
						</SimpleCell>
					))}
					<ProjectLinks />
				</>
			)}
		</ModalPage>
	);
}
