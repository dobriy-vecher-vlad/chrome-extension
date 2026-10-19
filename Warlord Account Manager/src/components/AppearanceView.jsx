import { CellButton, SimpleCell, Switch } from '@vkontakte/vkui';
import { Icon28RefreshOutline } from '@vkontakte/icons';
import { useManagerContext } from '../context.js';
import { defaultBox } from '../lib/panelHost.js';

// Раздел «Оформление»: переключатели, которые меняют вид страницы игры и самой панели.
function Option({ title, description, checked, onChange }) {
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

export function AppearanceView() {
	const { appearance } = useManagerContext();
	const { settings, update, setFreeMode } = appearance;

	return (
		<>
			<Option
				title="Скрыть рекламный блок"
				description="Убирает блок над игрой и подгоняет высоту окна игры"
				checked={settings.hideAds}
				onChange={(value) => update({ hideAds: value })}
			/>
			<Option
				title="Исправить чёрную полосу справа от игры"
				description="Убирает чёрную полосу справа от игры, которая появляется из-за ошибки ВКонтакте"
				checked={settings.fixLayoutWidth}
				onChange={(value) => update({ fixLayoutWidth: value })}
			/>
			<Option
				title="Свободный режим"
				description="Панель можно перетаскивать за верхнюю полоску и менять ей высоту за нижнюю"
				checked={settings.freeMode}
				onChange={setFreeMode}
			/>
			{settings.freeMode && (
				<CellButton before={<Icon28RefreshOutline />} onClick={() => update({ panel: defaultBox() })}>
					Вернуть панель на место
				</CellButton>
			)}
		</>
	);
}
