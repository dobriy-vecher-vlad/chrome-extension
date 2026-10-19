import { useContext } from 'react';
import { Popover, Tooltip } from '@vkontakte/vkui';
import { SchemeContext } from '../lib/SchemeContext.js';

// Подсказки при наведении

// Короткая подсказка
export function Hint({ children, text, embedded = false, maxWidth = 320 }) {
	const scheme = useContext(SchemeContext);
	// в тёмной теме подсказка белая, в светлой чёрная; внутри белой карточки игрока всегда чёрная
	const appearance = embedded || scheme !== 'dark' ? 'black' : 'white';
	return (
		<Tooltip description={text} appearance={appearance} maxWidth={maxWidth} hoverDelay={0}>
			{children}
		</Tooltip>
	);
}

// Широкая белая подсказка с содержимым (карточка игрока, набег): остаётся открытой, пока на неё наведён курсор
export const Rich = ({ children, content, size = 320, placement = 'top-start' }) => (
	<Popover
		trigger="hover"
		placement={placement}
		hoverDelay={100}
		noStyling
		content={<div className="WarlordScriptRichPopover" style={{ maxWidth: size }}>{content}</div>}
	>
		{children}
	</Popover>
);
