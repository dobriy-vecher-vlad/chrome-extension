import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
	AdaptivityProvider,
	AppRoot,
	Button,
	ConfigProvider,
	Panel,
	ScreenSpinner,
	SplitCol,
	SplitLayout,
	View
} from '@vkontakte/vkui';
import {
	Icon16MenuOutline,
} from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';
import '@vkontakte/vkui/dist/unstable.css';
import './style.css';
import Script from './script';


Object.defineProperty(Array, 'isObject', {
	value: (array) => typeof array == 'object' && !Array.isArray(array),
});
const script = {
	id: 'warlord',
	title: 'Warlord',
	version: '3.0.0 beta 3',
	settings: {
		showBanners: true,
		server: 1,
	},
};
const log = (data, ...other) => {
	let {
		logo = `[${script.version}]`,
		label = script.title,
		text = '',
	} = data || {};
	if (!Array.isObject(data)) text = typeof data == 'string' ? data : JSON.stringify(data);
	if (Array.isArray(data)) text = data;
	console.log(`%c${logo} ${label}`, 'background: #182b3c; color: #fafeff; padding: 5px; border-radius: 4px;', text || 'log',  ...other);
	if (Array.isArray(data)) console.table(data);
};
const ScriptConfig = (props) => (<>
	<ConfigProvider isWebView={false} transitionMotionEnabled={false} platform='ios' webviewType='internal' scheme='inherit'>
		<AdaptivityProvider>
			{props.children}
		</AdaptivityProvider>
	</ConfigProvider>
</>);
const ScriptRoot = (props) => {
	const [popout, setPopout] = useState(null);
	const clearPopout = () => setPopout(null);
	const [panel, setPanel] = useState('home');
	const [content, setContent] = useState(<>content</>);
	useEffect(() => {
		const start = async() => {
			setPopout(<ScreenSpinner state='loading' />);
			let from = 0 || 153968505;
			let to = 0 || 153968505;
			try {
				from = Number(/id: (\d+),/gim.exec(document.documentElement.innerHTML)[1]);
			} catch (error) { }
			try {
				to = Number(/ProfileWrapper.*?data-exec.*?(\d+).*?hashes/gim.exec(await (await fetch(window.location.href)).text())[1]);
			} catch (error) {
				try {
					to = Number(document.querySelector(`[data-task-click='ProfileAction/abuse']`).getAttribute('data-user_id'));
				} catch (error) {
					if (document.querySelector('.profile_deleted_text > br')) {
						try {
							to = Number((await getData('json', `https://api.vk.com/method/utils.resolveScreenName?screen_name=${location.pathname.slice(1)}&access_token=27af1df427af1df427af1df46e27c552ac227af27af1df47b67845e29d5bbda714938b8&v=5.131`)).response.object_id);
						} catch (error) { }
					}
				}
			}
			if (!from && to) from = to;
			if (!to && from) to = from;
			window.ScriptRoot = {
				...window.ScriptRoot,
				from,
				to,
				setPanel,
				setContent,
			};
			setPopout(<ScreenSpinner state='done' aria-label='Успешно' />);
			setTimeout(clearPopout, 1000);
		};
		start();
	}, []);
	return (<>
		<AppRoot mode='embedded' portalRoot={props.root} scroll='contain'>
			<SplitLayout popout={popout}>
				<SplitCol>
					<div className='dvvEpic'>
						<div className='dvvEpic__in'>
							<div className='vkuiTabs Tabs vkuiTabs--ios Tabs--ios vkuiTabs--default Tabs--default vkuiTabs--sizeX-regular Tabs--sizeX-regular' role='tablist'>
								<div className='vkuiTabs__in Tabs__in'>
								</div>
							</div>
							<div className='dvvEpic__in-after'>
								<Button mode={panel == 'settings' ? 'secondary' : 'tertiary'} appearance='neutral' onClick={() => {
									setContent(<>loaded</>);
									setPanel('settings')
								}}><Icon16MenuOutline width={16} height={16} style={{ padding: 8 }}/></Button>
							</div>
						</div>
					</div>
					<View activePanel={panel}>
						<Panel id='home'>
							{content}
						</Panel>
						<Panel id='settings'>
							settings
						</Panel>
					</View>
				</SplitCol>
			</SplitLayout>
		</AppRoot>
	</>);
};
const vk_root = document.querySelector('#page_body');
if (vk_root) {
	vk_root.addEventListener('DOMNodeInserted', (event) => {
		let vk_portal = vk_root.querySelector('.Profile__column');
		if (vk_portal) {
			let script_frame = vk_portal.querySelector('.dvvFrame');
			let script_root = script_frame?.querySelector('.dvvRoot');
			if (!script_frame) {
				vk_portal.insertAdjacentHTML('afterbegin', `<div class='dvvFrame'><div class='dvvRoot' style='margin-bottom: var(--page-block-offset, 15px);'></div></div>`);
				script_frame = vk_portal.querySelector('.dvvFrame');
				if (script_frame) {
					script_root = script_frame.querySelector('.dvvRoot');
					if (script_root) {
						log('Render root');
						ReactDOM.createRoot(script_root).render(<ScriptConfig><ScriptRoot root={script_root}/></ScriptConfig>);
					}
				}
			} else script_root = script_frame.querySelector('.dvvRoot');
			if (event?.target?.classList?.contains('Icon') || false) {
				const script_tabs = script_root.querySelector('.Tabs__in');
				if (script_tabs) {
					const renderMethod = (root, element) => script_tabs.innerHTML == '' ? ReactDOM.createRoot(root).render(element) : ReactDOM.hydrateRoot(root, element);
					if (!script_tabs.querySelector(`.TabsItem#${script.id}`)) {
						log('Render button', script);
						renderMethod(script_tabs, <ScriptConfig><Script script={script} log={log}/></ScriptConfig>);
					}
				}
			}
			script_root.addEventListener('DOMSubtreeModified', (event) => {
				if (event?.target?.classList?.contains('dvvDetails') || false) {
					if (event.target.getAttribute('open') == '') {
						for (let details of script_root.querySelectorAll('.dvvDetails')) details.removeAttribute('open');
						event.target.setAttribute('open', 'true');
					}
				}
			}, false);
		}
	}, false);
	vk_root.dispatchEvent(new Event('DOMNodeInserted'));
}