import { useRef } from 'react';
import { Button, CellButton, Footnote, FormItem, Header, SimpleCell, Slider, Switch } from '@vkontakte/vkui';
import { Icon28RefreshOutline } from '@vkontakte/icons';
import { ColorPicker } from './ColorPicker.jsx';
import { useManagerContext } from '../ManagerContext.js';
import { prepareBackgroundImage } from '../lib/backgroundImage.js';
import { BACKGROUND_RANGES, isSeeThrough, WIDTH_MAX, WIDTH_MIN } from '../lib/settings.js';

// Раздел «Оформление»: переключатели и ползунки, которые меняют вид страницы игры и самой панели.
// В конце каждого блока кнопка, которая возвращает значения этого блока к стандартным.
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

// Ползунок с подписью значения: «Затемнение: 30%»
function Range({ title, unit, value, range, onChange }) {
	return (
		<FormItem top={`${title}: ${value}${unit}`}>
			<Slider min={range[0]} max={range[1]} step={1} value={value} onChange={onChange} />
		</FormItem>
	);
}

function ResetButton({ children, onClick }) {
	return <CellButton before={<Icon28RefreshOutline />} onClick={onClick}>{children}</CellButton>;
}

export function AppearanceView() {
	const { appearance, notify } = useManagerContext();
	const { settings, image, update, updateBackground, setImage, setFreeMode, confirmHidePanel, resetGroup } = appearance;
	const { background } = settings;
	const fileInput = useRef(null);
	// обводка и тень есть только у панели-карточки: она рисуется так в свободном режиме и когда задан фон
	const isCard = settings.freeMode || Boolean(background.color) || Boolean(image);
	// размытие заднего фона заметно, только если страница просвечивает сквозь панель
	const seeThrough = isSeeThrough(background, Boolean(image));

	const pickImage = async (event) => {
		const file = event.target.files?.[0];
		event.target.value = ''; // чтобы ту же картинку можно было выбрать снова
		if (!file) return;
		try {
			setImage(await prepareBackgroundImage(file));
			notify('Картинка фона сохранена');
		} catch (error) {
			notify(`Не удалось загрузить картинку: ${error.message || 'неизвестная ошибка'}`, 'error');
		}
	};

	return (
		<>
			<Header>Страница игры</Header>
			<Option
				title="Скрыть рекламный блок"
				description="Убирает блок над игрой и подгоняет высоту окна игры"
				checked={settings.hideAds}
				onChange={(value) => update({ hideAds: value })}
			/>
			<Option
				title="Скрыть «Игры для вас»"
				description="Убирает блок с рекомендованными играми под игрой"
				checked={settings.hideSimilarApps}
				onChange={(value) => update({ hideSimilarApps: value })}
			/>
			<Option
				title="Скрыть ID под игрой"
				description="Убирает строку с ID под окном игры, окно игры становится ниже на 36px"
				checked={settings.hideGameId}
				onChange={(value) => update({ hideGameId: value })}
			/>
			<Option
				title="Скрыть подвал под игрой"
				description="Убирает подвал страницы, нижние углы игры скругляются"
				checked={settings.hideFooter}
				onChange={(value) => update({ hideFooter: value })}
			/>
			<Option
				title="Скрыть шапку над игрой"
				description="Убирает панель над игрой, верхние углы игры скругляются"
				checked={settings.hideOptionsBar}
				onChange={(value) => update({ hideOptionsBar: value })}
			/>
			<Option
				title="Исправить чёрную полосу справа от игры"
				description="Убирает чёрную полосу справа от игры, которая появляется из-за ошибки ВКонтакте"
				checked={settings.fixLayoutWidth}
				onChange={(value) => update({ fixLayoutWidth: value })}
			/>
			<ResetButton onClick={() => resetGroup('page', 'Настройки страницы игры сброшены')}>Сбросить настройки страницы игры</ResetButton>

			<Header>Панель</Header>
			<Option
				title="Свободный режим"
				description="Панель можно перетаскивать за верхнюю полоску и менять ей высоту за нижнюю"
				checked={settings.freeMode}
				onChange={setFreeMode}
			/>
			<Option
				title="Ники в списке"
				description="Игровой ник справа в строке аккаунта. Если выключить, данные игры для списка не запрашиваются"
				checked={settings.showNicknames}
				onChange={(value) => update({ showNicknames: value })}
			/>
			<Option
				title="Аватарки в списке"
				description="Аватарка слева в строке аккаунта. Если выключить, фото из ВКонтакте не запрашиваются"
				checked={settings.showAvatars}
				onChange={(value) => update({ showAvatars: value })}
			/>
			<Range
				title="Ширина панели"
				unit="px"
				value={settings.panelWidth}
				range={[WIDTH_MIN, WIDTH_MAX]}
				onChange={(value) => update({ panelWidth: value })}
			/>
			{isCard && (
				<>
					<Option
						title="Обводка панели"
						description="Тонкая линия вокруг панели"
						checked={settings.panelBorder}
						onChange={(value) => update({ panelBorder: value })}
					/>
					<Option
						title="Тень панели"
						description="Мягкая тень под панелью"
						checked={settings.panelShadow}
						onChange={(value) => update({ panelShadow: value })}
					/>
				</>
			)}
			<ResetButton onClick={() => resetGroup('panel', 'Настройки панели сброшены')}>Сбросить настройки панели</ResetButton>

			<Header>Фон панели</Header>
			<FormItem top="Цвет">
				<ColorPicker value={background.color} onChange={(color) => updateBackground({ color })} onReset={() => updateBackground({ color: null })} />
			</FormItem>
			<FormItem top="Картинка" bottom="Картинка уменьшается и хранится в браузере. Без цвета она рисуется на прозрачной панели (сквозь неё видна страница), с цветом лежит поверх него.">
				{image && <div className="WarlordAccountManagerAppearanceView__preview" style={{ backgroundImage: `url("${image.data}")` }} />}
				<div className="WarlordAccountManagerAppearanceView__imageActions">
					<Button size="s" mode="secondary" onClick={() => fileInput.current?.click()}>{image ? 'Заменить картинку' : 'Выбрать картинку'}</Button>
					{image && <Button size="s" mode="secondary" appearance="negative" onClick={() => setImage(null)}>Убрать картинку</Button>}
				</div>
				<input ref={fileInput} type="file" accept="image/*" hidden onChange={pickImage} />
			</FormItem>
			{(background.color || image) ? (
				<>
					{background.color && (
						<Range title="Непрозрачность цвета" unit="%" value={background.colorOpacity} range={BACKGROUND_RANGES.colorOpacity} onChange={(value) => updateBackground({ colorOpacity: value })} />
					)}
					{image && (
						<Range title="Непрозрачность картинки" unit="%" value={background.imageOpacity} range={BACKGROUND_RANGES.imageOpacity} onChange={(value) => updateBackground({ imageOpacity: value })} />
					)}
					{seeThrough && (
						<Range title="Размытие заднего фона" unit="px" value={background.backdropBlur} range={BACKGROUND_RANGES.backdropBlur} onChange={(value) => updateBackground({ backdropBlur: value })} />
					)}
					<Range title="Затемнение" unit="%" value={background.dim} range={BACKGROUND_RANGES.dim} onChange={(value) => updateBackground({ dim: value })} />
					{image && (
						<>
							<Range title="Размытие картинки" unit="px" value={background.blur} range={BACKGROUND_RANGES.blur} onChange={(value) => updateBackground({ blur: value })} />
							<Range title="Яркость" unit="%" value={background.brightness} range={BACKGROUND_RANGES.brightness} onChange={(value) => updateBackground({ brightness: value })} />
							<Range title="Контрастность" unit="%" value={background.contrast} range={BACKGROUND_RANGES.contrast} onChange={(value) => updateBackground({ contrast: value })} />
							<Range title="Насыщенность" unit="%" value={background.saturation} range={BACKGROUND_RANGES.saturation} onChange={(value) => updateBackground({ saturation: value })} />
						</>
					)}
				</>
			) : (
				<Footnote className="WarlordAccountManagerAppearanceView__hint">Пока фон не задан, панель прозрачная и лежит прямо на странице.</Footnote>
			)}
			<ResetButton onClick={() => resetGroup('background', 'Настройки фона панели сброшены')}>Сбросить настройки фона панели</ResetButton>

			<Header>Скрытие</Header>
			<Option
				title="Скрыть панель аккаунтов"
				description="Убирает панель и отключает все правки страницы игры. Вернуть можно в настройках Warlord Script"
				checked={false}
				onChange={confirmHidePanel}
			/>
		</>
	);
}
