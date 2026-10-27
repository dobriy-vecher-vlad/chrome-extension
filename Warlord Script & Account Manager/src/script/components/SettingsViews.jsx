import { useEffect, useState } from 'react';
import { SimpleCell, Switch } from '@vkontakte/vkui';
import { loadPanelHidden, savePanelHidden } from '../../shared/lib/panelVisibility.js';
import { SETTINGS_FORM } from '../lib/settings.js';
import { useProfileSettings } from '../lib/ScriptSettingsContext.js';

// Строка с переключателем: нажатие на любую её часть меняет значение (как в настройках панели аккаунтов)
function SwitchRow({ title, description, checked, onChange }) {
	return (
		<SimpleCell
			Component="label"
			multiline
			subtitle={description}
			after={<Switch checked={checked} onChange={(event) => onChange(event.target.checked)} />}
		>
			{title}
		</SimpleCell>
	);
}

// Раздел «Общие настройки»
export function GeneralView() {
	const { settings, change } = useProfileSettings();
	// панель аккаунтов на странице игры (Warlord Account Manager): здесь её можно вернуть, если скрыли в её настройках
	const [panelHidden, setPanelHidden] = useState(null);
	useEffect(() => {
		let alive = true;
		loadPanelHidden().then((hidden) => alive && setPanelHidden(hidden));
		return () => { alive = false; };
	}, []);
	return (
		<>
			<SwitchRow
				title="Версия расширения"
				description="Отображение версии рядом с названием"
				checked={settings.showVersion}
				onChange={(value) => change({ showVersion: value })}
			/>
			{panelHidden !== null && (
				<SwitchRow
					title="Панель аккаунтов на странице игры"
					description="Warlord Account Manager: список аккаунтов справа от игры и правки страницы игры. Если выключить её в настройках панели, вернуть можно только здесь"
					checked={!panelHidden}
					onChange={(value) => {
						setPanelHidden(!value);
						savePanelHidden(!value);
					}}
				/>
			)}
		</>
	);
}

// Раздел «Отображаемые блоки»
export function BlocksView() {
	const { settings, change } = useProfileSettings();
	return SETTINGS_FORM.blocks.map((block) => (
		<SwitchRow
			key={block.id}
			title={block.title}
			description={block.description}
			checked={settings[block.id]}
			onChange={(value) => change({ [block.id]: value })}
		/>
	));
}

// Раздел с выбором одного из вариантов («Сортировка состава», «Сервер игры»): name — ключ в SETTINGS_FORM.
// Переключатели работают как группа: включённый вариант один, включение другого выключает остальные,
// а выключить единственный нельзя
export function ChoiceView({ name }) {
	const { settings, change } = useProfileSettings();
	const { id, options } = SETTINGS_FORM[name];
	return options.map((option, index) => (
		<SwitchRow
			key={option.title}
			title={option.title}
			description={option.description}
			checked={settings[id] === index + 1}
			onChange={() => change({ [id]: index + 1 })}
		/>
	));
}
