import { useEffect, useRef, useState } from 'react';
import { Button, Input, Popover } from '@vkontakte/vkui';

// Свой выбор цвета вместо системного <input type="color">: тот рисуется браузером и не подстраивается под тему.
// Здесь всё на токенах VKUI, поэтому в тёмной и светлой теме выглядит как остальные окна. Цвет задаётся квадратом
// «насыщенность / яркость», полосой оттенка, полем с кодом #rrggbb или готовым цветом из набора.
const PRESETS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#3a1d5c', '#263238', '#eceff1'];
const FALLBACK = '#3a1d5c'; // с чего начинается выбор, пока цвет не задан

const clamp = (value) => Math.min(1, Math.max(0, value));

function hexToHsv(hex) {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	let h = 0;
	if (delta) {
		if (max === r) h = ((g - b) / delta) % 6;
		else if (max === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;
		h = (h * 60 + 360) % 360;
	}
	return { h, s: max ? delta / max : 0, v: max };
}

function hsvToHex({ h, s, v }) {
	const f = (n) => {
		const k = (n + h / 60) % 6;
		return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
	};
	return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

// Область, по которой водят мышью или пальцем: onChange получает положение (x, y) в долях от 0 до 1
function Surface({ className, onChange, children, label }) {
	const ref = useRef(null);
	const handle = (event) => {
		const rect = ref.current.getBoundingClientRect();
		onChange(clamp((event.clientX - rect.left) / rect.width), clamp((event.clientY - rect.top) / rect.height));
	};
	return (
		<div
			ref={ref}
			className={className}
			aria-label={label}
			onPointerDown={(event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				handle(event);
			}}
			onPointerMove={(event) => {
				if (event.currentTarget.hasPointerCapture(event.pointerId)) handle(event);
			}}
		>
			{children}
		</div>
	);
}

export function ColorPicker({ value, onChange, onReset }) {
	const [open, setOpen] = useState(false);
	const [hsv, setHsv] = useState(() => hexToHsv(value || FALLBACK));
	const [text, setText] = useState(value || '');
	const lastValue = useRef(value);

	// значение изменили снаружи (сброс, другая вкладка): подтягиваем и положение ползунков
	useEffect(() => {
		if (value === lastValue.current) return;
		lastValue.current = value;
		if (value) setHsv(hexToHsv(value));
		setText(value || '');
	}, [value]);

	const commit = (next) => {
		const hex = hsvToHex(next);
		lastValue.current = hex;
		setHsv(next);
		setText(hex);
		onChange(hex);
	};

	const onText = (event) => {
		const next = event.target.value;
		setText(next);
		const hex = next.startsWith('#') ? next : `#${next}`;
		if (/^#[0-9a-f]{6}$/i.test(hex)) {
			lastValue.current = hex.toLowerCase();
			setHsv(hexToHsv(hex));
			onChange(hex.toLowerCase());
		}
	};

	const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });

	// Само окно выбора: всплывает поверх содержимого (Popover VKUI), закрывается кликом вне его и по Esc
	const popup = (
		<div className="WarlordAccountManagerColorPicker__popup">
			<Surface
				className="WarlordAccountManagerColorPicker__area"
				label="Насыщенность и яркость"
				onChange={(x, y) => commit({ h: hsv.h, s: x, v: 1 - y })}
			>
				<div className="WarlordAccountManagerColorPicker__areaBase" style={{ background: hueColor }} />
				<div
					className="WarlordAccountManagerColorPicker__thumb"
					style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }}
				/>
			</Surface>
			<Surface
				className="WarlordAccountManagerColorPicker__hue"
				label="Оттенок"
				onChange={(x) => commit({ h: x * 360, s: hsv.s, v: hsv.v })}
			>
				<div
					className="WarlordAccountManagerColorPicker__thumb"
					style={{ left: `${(hsv.h / 360) * 100}%`, top: '50%', background: hueColor }}
				/>
			</Surface>
			<div className="WarlordAccountManagerColorPicker__presets">
				{PRESETS.map((preset) => (
					<button
						key={preset}
						type="button"
						className="WarlordAccountManagerColorPicker__preset"
						style={{ background: preset }}
						aria-label={`Цвет ${preset}`}
						onClick={() => commit(hexToHsv(preset))}
					/>
				))}
			</div>
			<Input
				aria-label="Код цвета"
				placeholder="#rrggbb"
				maxLength={7}
				value={text}
				onChange={onText}
			/>
		</div>
	);

	return (
		<div className="WarlordAccountManagerColorPicker">
			{/* образец цвета показываем, только когда цвет выбран */}
			{value && (
				<span
					className="WarlordAccountManagerColorPicker__swatch"
					style={{ background: value }}
					role="img"
					aria-label={`Выбран цвет ${value}`}
				/>
			)}
			<Popover
				trigger="click"
				placement="bottom-start"
				shown={open}
				onShownChange={setOpen}
				offsetByMainAxis={8}
				zIndex={1040}
				disableFocusTrap
				content={popup}
			>
				<Button size="s" mode="secondary">Выбрать цвет</Button>
			</Popover>
			<Button size="s" mode="secondary" disabled={!value} onClick={onReset}>Сбросить цвет</Button>
		</div>
	);
}
