import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AdaptivityProvider, ConfigProvider } from '@vkontakte/vkui';
import { useColorScheme } from '../../shared/hooks/useColorScheme.js';
import { SchemeContext } from '../lib/SchemeContext.js';

// Оболочка интерфейса Warlord Script: тема страницы ВК, её токены цвета и провайдеры VKUI. Общая для блока на странице
// профиля и окна в списке друзей. layer — верхний слой страницы (подсказки, окна), он получает ту же тему и токены.
// readTokens — функция, которая читает токены у страницы (см. readTokens в lib/pageHost.js).

// Токены VKUI берём у страницы ВК, поэтому собственные классы токенов VKUI не навешиваем
const NO_TOKENS = { light: 'WarlordScriptTokens', dark: 'WarlordScriptTokens' };

export function ScriptShell({ layer, readTokens, children }) {
	const colorScheme = useColorScheme();
	const [tick, setTick] = useState(0);
	// тему страницы ВК меняют не сразу: значения токенов читаем заново чуть позже
	useEffect(() => {
		const timer = setTimeout(() => setTick((n) => n + 1), 150);
		return () => clearTimeout(timer);
	}, [colorScheme]);
	const tokens = useMemo(() => readTokens(), [readTokens, colorScheme, tick]);
	// тема страницы: WarlordScript--dark или WarlordScript--light (то же для слоя подсказок)
	useLayoutEffect(() => {
		layer.className = `WarlordScriptLayer WarlordScriptLayer--${colorScheme}`;
		for (const [name, value] of Object.entries(tokens)) layer.style.setProperty(name, value);
	}, [layer, colorScheme, tokens]);
	return (
		<div className={`WarlordScript WarlordScript--${colorScheme}`} style={tokens}>
			<ConfigProvider platform="ios" colorScheme={colorScheme} tokensClassNames={NO_TOKENS}>
				<AdaptivityProvider hasPointer>
					<SchemeContext.Provider value={colorScheme}>
						{children}
					</SchemeContext.Provider>
				</AdaptivityProvider>
			</ConfigProvider>
		</div>
	);
}
