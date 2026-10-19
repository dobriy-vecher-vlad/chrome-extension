import { createPortal } from 'react-dom';
import { useContext, useRef, useState } from 'react';
import { AdaptivityProvider, AppRoot, ConfigProvider, Counter, IconButton, Link, Placeholder, Separator, Tabs, TabsItem, useModalManager, UsersStack } from '@vkontakte/vkui';
import { Icon20Cancel, Icon28SettingsOutline } from '@vkontakte/icons';
import { GROUP } from '../../shared/lib/projectLinks.js';
import { useVkImage } from '../../shared/hooks/useVkImage.js';
import { Content } from './PlayerContent.jsx';
import { SchemeContext } from '../lib/SchemeContext.js';
import { Toasts } from '../../shared/components/Toasts.jsx';
import { ProfileSettingsContext } from '../lib/ScriptSettingsContext.js';
import { ProfileSettingsModal } from './SettingsModal.jsx';
import { useProfileIds } from '../hooks/useProfileIds.js';
import { useScriptSettings } from '../hooks/useScriptSettings.js';
import { DEFAULT_SETTINGS, SERVER_TITLES, VERSION } from '../lib/settings.js';
import { ScriptShell } from './ScriptShell.jsx';

// запасной логотип сообщества, пока аватар из VK API не сохранён (его получает и сохраняет панель аккаунтов на странице игры)
const FALLBACK_LOGO = 'https://dobriy-vecher-vlad.github.io/warlord/media/label_wl.jpg';
const Skeleton = ({ width, height }) => <div className="WarlordScriptSkeleton" style={{ width, height }} />;

// Блок характеристик игрока на странице профиля. Сначала в нём ссылка на проект, данные загружаются по нажатию на вкладку.
function Block({ layer, path }) {
	const colorScheme = useContext(SchemeContext);
	const ids = useProfileIds(path);
	const groupPhoto = useVkImage('vk-group', GROUP.screenName, '');
	const [settings, updateSettings] = useScriptSettings();
	const [stats, setStats] = useState(null); // null — исходный вид, иначе { reload } — данные загружаются или показаны
	const [busy, setBusy] = useState(false);
	const needsReload = useRef(false);
	const ready = Boolean(ids && settings);
	const currentServer = settings?.selectedServer; // выбранный сервер хранится в настройках: его меняют и в окне настроек, и строкой другого сервера

	// Окно настроек открывает менеджер модальных окон VKUI; настройки оно получает через контекст
	const [modals, modalHolder] = useModalManager({ noFocusToDialog: true });
	// Уведомления справа снизу, как в панели аккаунтов: подтверждают действия (экспорт, импорт, очистка)
	const alertOpen = useRef(false); // открыто ли подтверждение: Esc тогда относится к нему, а не к окну
	const [toast, setToast] = useState(null);
	const notify = (text, kind = 'success') => setToast({ id: Date.now() + Math.random(), text, kind });
	const clearToast = (id) => setToast((current) => (current && current.id === id ? null : current));
	// Настройки, от которых зависит, что именно загружается (гильдия и т. д.), применяются к следующей загрузке:
	// закрывая окно настроек, загружаем заново
	const changeSettings = (fields) => {
		needsReload.current = true;
		updateSettings(fields);
	};
	const onSettingsClosed = () => {
		if (needsReload.current && stats) {
			setBusy(true);
			setStats({ reload: Date.now() });
		}
		needsReload.current = false;
	};
	const load = () => {
		if (busy) return;
		setBusy(true);
		setStats({ reload: Date.now() });
	};
	const selectServer = (id) => {
		updateSettings({ selectedServer: id });
		setBusy(true);
	};

	return (
		<AppRoot mode="embedded" portalRoot={layer} scroll="contain">
			<div className="WarlordScriptHeader">
				<div className="WarlordScriptHeader__row">
					{ready ? (
						<Tabs className="WarlordScriptTabs" selectedId={stats ? 'warlord' : undefined}>
							<TabsItem
								id="warlord"
								selected={Boolean(stats)}
								onClick={load}
								status={settings.showVersion ? <span className="WarlordScriptTabs__version">{VERSION}</span> : undefined}
								after={currentServer ? <Counter size="s" mode="primary">{SERVER_TITLES[currentServer - 1]}</Counter> : undefined}
							>
								Warlord
							</TabsItem>
						</Tabs>
					) : (
						<div className="WarlordScriptTabs"><Skeleton height={44} width={150} /></div>
					)}
					{ready ? (
						<div className="WarlordScriptHeader__actions">
							{stats ? (
								<IconButton label="Закрыть" onClick={() => { setStats(null); setBusy(false); needsReload.current = false; }}>
									<Icon20Cancel width={20} height={20} style={{ padding: 6 }} />
								</IconButton>
							) : (
								<IconButton label="Настройки Warlord Script" onClick={() => modals.openCustomModalPage({ id: 'settings', component: ProfileSettingsModal })}>
									<Icon28SettingsOutline width={20} height={20} style={{ padding: 6 }} />
								</IconButton>
							)}
						</div>
					) : <div className="WarlordScriptHeader__actions"><Skeleton height={32} width={32} /></div>}
				</div>
			</div>
			{ready && (stats ? (
				<Content
					from={ids.from}
					to={ids.to}
					server={currentServer}
					settings={settings}
					reloadKey={stats.reload}
					onServer={selectServer}
					onLoaded={() => setBusy(false)}
				/>
			) : (
				<Placeholder.Container stretched>
					<UsersStack photos={[groupPhoto || FALLBACK_LOGO]} visibleCount={4} size="l">
						<span style={{ display: 'block', textAlign: 'left' }}>Проект<br /><Link href={GROUP.url} target="_blank">{GROUP.title}</Link></span>
					</UsersStack>
				</Placeholder.Container>
			))}
			{!ready && <Separator />}
			{ready && (
				<ProfileSettingsContext.Provider value={{ settings, change: changeSettings, reset: () => changeSettings({ ...DEFAULT_SETTINGS }), notify, alertOpen, onClosed: onSettingsClosed }}>
					{/* Окно живёт в отдельном AppRoot внутри верхнего слоя: пока оно открыто, VKUI блокирует прокрутку своего корня
					    (делает его position: absolute), и корень самого блока при этом схлопывался, блок пропадал со страницы */}
					{createPortal(
						// окно и уведомления оформлены как в панели аккаунтов: платформа vkcom, размеры для касаний, токены цвета VKUI
						<ConfigProvider platform="vkcom">
							<AdaptivityProvider hasPointer={false}>
								<AppRoot mode="embedded" portalRoot={layer} scroll="contain" disableParentTransformForPositionFixedElements>
									{modalHolder}
									<div className={`vkui--vkCom--${colorScheme}`}><Toasts toast={toast} onGone={clearToast} /></div>
								</AppRoot>
							</AdaptivityProvider>
						</ConfigProvider>,
						layer,
					)}
				</ProfileSettingsContext.Provider>
			)}
		</AppRoot>
	);
}

export function ScriptBlock({ layer, path, readTokens }) {
	return (
		<ScriptShell layer={layer} readTokens={readTokens}>
			<Block layer={layer} path={path} />
		</ScriptShell>
	);
}
