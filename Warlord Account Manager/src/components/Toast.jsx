import { useEffect, useRef, useState } from 'react';
import { Snackbar } from '@vkontakte/vkui';
import { Icon28CheckCircleOutline, Icon28ErrorCircleOutline } from '@vkontakte/icons';

const VISIBLE_MS = 3000;
const FADE_MS = 300;

// Уведомление справа снизу. Внешний вид — Snackbar.Basic из VKUI (он создан для самостоятельных систем уведомлений),
// а показ и скрытие — здесь: готовый Snackbar в этом окружении не получает сигнал о закрытии и зависает в очереди.
// Каждое новое уведомление (другой toast.id) создаётся заново и сразу заменяет предыдущее.
function ToastBody({ toast, onGone }) {
	const [shown, setShown] = useState(false);
	// onGone создаётся заново при каждой отрисовке панели; через ref таймеры не сбрасываются
	const goneRef = useRef(onGone);
	goneRef.current = onGone;

	useEffect(() => {
		const show = setTimeout(() => setShown(true), 20); // чтобы CSS-переход успел сработать
		const hide = setTimeout(() => setShown(false), VISIBLE_MS);
		const gone = setTimeout(() => goneRef.current(), VISIBLE_MS + FADE_MS);
		return () => {
			clearTimeout(show);
			clearTimeout(hide);
			clearTimeout(gone);
		};
	}, []);

	const icon = toast.kind === 'error'
		? <Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />
		: <Icon28CheckCircleOutline fill="var(--vkui--color_icon_positive)" />;

	return (
		<div className={shown ? 'wam-toast wam-toast--shown' : 'wam-toast'}>
			<Snackbar.Basic before={icon}>{toast.text}</Snackbar.Basic>
		</div>
	);
}

export function Toasts({ toast, onGone }) {
	return (
		<div className="wam-toasts" role="status" aria-live="polite">
			{toast && <ToastBody key={toast.id} toast={toast} onGone={() => onGone(toast.id)} />}
		</div>
	);
}
