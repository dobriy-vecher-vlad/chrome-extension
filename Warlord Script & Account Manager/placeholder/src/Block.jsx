import { useEffect, useMemo, useState } from 'react';
import { AdaptivityProvider, AppRoot, Button, ConfigProvider } from '@vkontakte/vkui';
import { useColorScheme } from '../../src/shared/hooks/useColorScheme.js';

// Страница расширения «Warlord Script & Account Manager» в Chrome Web Store
export const STORE_URL = 'https://chromewebstore.google.com/detail/warlord-script-account-ma/bjacddoljhbhgagfhbdacckecocnkilo';

// Токены VKUI берём у страницы ВК, поэтому собственные классы токенов VKUI не навешиваем
const NO_TOKENS = { light: 'WarlordScriptTokens', dark: 'WarlordScriptTokens' };

const Skeleton = ({ width, height, radius }) => <div className="WarlordScriptSkeleton" style={{ width, height, borderRadius: radius }} />;

// Строка свёрнутого раздела: значок и две строки текста
function SectionRow({ title, subtitle }) {
	return (
		<div className="WarlordScriptPreview__row">
			<Skeleton width={32} height={32} radius="50%" />
			<div className="WarlordScriptPreview__lines">
				<Skeleton width={title} height={12} />
				<Skeleton width={subtitle} height={10} />
			</div>
		</div>
	);
}

// Блок-заглушка: макет будущих данных, как у Warlord Script, и поверх него кнопка со ссылкой на новое расширение.
// readTokens — функция, которая читает токены цвета у страницы ВК (см. pageStyles.js).
export function Block({ readTokens }) {
	const colorScheme = useColorScheme();
	const [tick, setTick] = useState(0);
	// тему страницы ВК меняют не сразу: значения токенов читаем заново чуть позже
	useEffect(() => {
		const timer = setTimeout(() => setTick((n) => n + 1), 150);
		return () => clearTimeout(timer);
	}, [colorScheme]);
	const tokens = useMemo(() => readTokens(), [readTokens, colorScheme, tick]);

	return (
		<div className={`WarlordScript WarlordScript--${colorScheme}`} style={tokens}>
			<ConfigProvider platform="ios" colorScheme={colorScheme} tokensClassNames={NO_TOKENS}>
				<AdaptivityProvider hasPointer>
					<AppRoot mode="embedded" scroll="contain">
						<div className="WarlordScriptPreview">
							<div className="WarlordScriptPreview__mock" aria-hidden="true">
								<SectionRow title={110} subtitle={170} />
								<div className="WarlordScriptPreview__grid">
									{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} height={44} radius={10} />)}
								</div>
								<SectionRow title={90} subtitle={140} />
							</div>
							<div className="WarlordScriptPreview__action">
								<Button size="l" mode="primary" href={STORE_URL} target="_blank" rel="noopener noreferrer">Обновить расширение</Button>
							</div>
						</div>
					</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>
		</div>
	);
}
