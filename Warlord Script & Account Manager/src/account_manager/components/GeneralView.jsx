import { SimpleCell, Switch } from '@vkontakte/vkui';
import { useManagerContext } from '../ManagerContext.js';

// Строка с переключателем: нажатие на любую её часть меняет значение (как в настройках Warlord Script)
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

// Раздел «Общие настройки»: то, что относится к расширению целиком, а не к оформлению
export function GeneralView() {
	const { appearance, confirmReload } = useManagerContext();
	const { settings, update, confirmHidePanel } = appearance;
	return (
		<>
			{/* пока панель видна, переключатель включён; выключение сначала подтверждается (панель пропадает вместе с этим окном) */}
			<SwitchRow
				title="Панель аккаунтов на странице игры"
				description="Список аккаунтов справа от игры и правки страницы игры"
				checked={!settings.panelHidden}
				onChange={(value) => { if (!value) confirmHidePanel(); }}
			/>
			<SwitchRow
				title="Подмена Game.js"
				description="Исправленный Game.js позволяет открывать игру в нескольких окнах сразу, применяется после обновления страницы игры"
				checked={settings.replaceGame}
				onChange={(value) => {
					update({ replaceGame: value });
					confirmReload(value);
				}}
			/>
		</>
	);
}
