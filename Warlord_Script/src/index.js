import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
	AdaptivityProvider,
	AppRoot,
	Button,
	Card,
	CardGrid,
	CellButton,
	Checkbox,
	Chip,
	ConfigProvider,
	Counter,
	FormItem,
	Gallery,
	Link,
	Panel,
	Placeholder,
	Radio,
	Separator,
	SimpleCell,
	Spacing,
	SplitCol,
	SplitLayout,
	UsersStack,
	View
} from '@vkontakte/vkui';
import {
	Icon16Cancel,
	Icon16MenuOutline,
	Icon24ChevronLeft,
	Icon24DeleteOutline,
	Icon28DeleteOutline,
} from '@vkontakte/icons';
import { script } from './constants';
import Script from './script';
import { XMLParser } from 'fast-xml-parser';
const parser = new XMLParser({
	preserveOrder: false,
	attributeNamePrefix: '',
	attributesGroupName: false,
	ignoreAttributes: false,
	removeNSPrefix: true,
	allowBooleanAttributes: true,
	parseTagValue: true,
	parseAttributeValue: true,
	trimValues: true,
	cdataPropName: false,
	commentPropName: false,
});
import raw_vkui from '!!raw-loader!@vkontakte/vkui/dist/vkui.css';
import raw_unstable from '!!raw-loader!@vkontakte/vkui/dist/unstable.css';
import raw_style from '!!raw-loader!./style.css';
const styleSheetsReplace = (string) => string.replace(/(^|\,|\}|\{)\.vkui(?!bright_light|space_gray|vkcom_light|vkcom_dark|--vkBase--light|--vkBase--dark|--vkCom--light|--vkCom--dark|--vkIOS--light|--vkIOS--dark)/gm, '$1.dvvFrame .vkui').replace(/(\[scheme.*?\]|\:root|\.vkuibright_light|\.vkuispace_gray|\.vkuivkcom_light|\.vkuivkcom_dark|\.vkui--vkBase--light|\.vkui--vkBase--dark|\.vkui--vkCom--light|\.vkui--vkCom--dark|\.vkui--vkIOS--light|\.vkui--vkIOS--dark)/gm, '$1 .dvvFrame');
const styleSheets = ({ raw_vkui: styleSheetsReplace(raw_vkui), raw_unstable: styleSheetsReplace(raw_unstable), raw_style });


Object.defineProperty(Array, 'isObject', {
	value: (array) => typeof array == 'object' && !Array.isArray(array),
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const getData = async(link) => {
	try {
		let data = await fetch(link.replace(/%2B/g, '+').replace(/%3D/g, '='));
		data = await data.text();
		if (data == 'Err. More than 1 request per second' || data == 'Too many requests per second.') {
			await wait(1000);
			return await getData(link);
		}
		try {
			data = JSON.parse(data);
		} catch (error) {
			data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
			data = await parser.parse(data);
		}
		if (data.data) data = data.data;
		return data;
	} catch (error) {
		console.log(error);
		if (/ETIMEDOUT/.exec(error.message)) return await getData(link);
		return null;
	}
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
const defaultSettings = {
	showVersion: true,
	showAnimations: true,
};
const getSettings = () => {
	let settings = JSON.parse(localStorage.getItem('dvvSettings'));
	if (!settings) {
		settings = defaultSettings;
	}
	if (!settings[script.id]) {
		settings[script.id] = script;
	}
	localStorage.setItem('dvvSettings', JSON.stringify(settings));
	return settings;
};
const setSettings = (data) => {
	let {
		key = 'key',
		value = true,
		id = false,
	} = data || {};
	let settings = getSettings();
	id ? settings[id].settings[key] = value : settings[key] = value;
	localStorage.setItem('dvvSettings', JSON.stringify(settings));
};
const clearSettings = () => {
	localStorage.setItem('dvvSettings', JSON.stringify(defaultSettings));
	window.location.reload();
};
const Skeleton = (props) => <div className='Skeleton' style={{...props}}></div>;
const ScriptConfig = (props) => (<>
	<ConfigProvider isWebView={false} transitionMotionEnabled={false} platform='ios' webviewType='internal' scheme='inherit'>
		<AdaptivityProvider>
			{props.children}
		</AdaptivityProvider>
	</ConfigProvider>
</>);
const ScriptSettings = (props) => {
	const settings = getSettings();
	const scripts = Object.values(settings).filter(setting => typeof setting == 'object' && setting.id);
	const [panel, setPanel] = useState('home');
	const script = scripts.find(script => script.id == panel);
	const afterChange = () => props.onChange() || true;
	const onChange = (event, id = null) => {
		const setting = {
			id,
			key: event.target.name,
			value: event.target.checked,
		};
		setSettings({
			key: setting.key,
			value: setting.value,
			id: setting.id,
		});
		afterChange();
	};
	return panel == 'home' ? <>
		{scripts.length ? <>
			<FormItem top='Дополнительные настройки'>
				{scripts.map((script, key) => <SimpleCell key={key} before={<Icon24DeleteOutline/>} expandable onClick={() => setPanel(script.id)}>{script.title}</SimpleCell>)}
			</FormItem>
		</> : false}
		{settings ? <>
			<FormItem top='Общие настройки'>
				<Checkbox onChange={(event) => onChange(event)} defaultChecked={settings.showVersion} name='showVersion' description='Отображение версии рядом с названием'>Версия расширения</Checkbox>
				<Checkbox onChange={(event) => onChange(event)} defaultChecked={settings.showAnimations} name='showAnimations' description='Анимация при наведении и нажатии на элементы'>Анимации</Checkbox>
			</FormItem>
		</> : false}
		<Spacing size={12}><Separator/></Spacing>
		<CellButton before={<Icon24DeleteOutline/>} mode='danger' onClick={() => clearSettings()}>Сбросить сохранённые настройки расширения</CellButton>
	</> : script ? <>
		<FormItem top={`Дополнительные настройки ${script.title}`}>
			<SimpleCell before={<Icon24ChevronLeft/>} onClick={() => setPanel('home')}>Общие настройки</SimpleCell>
		</FormItem>
		<CardGrid size='m'>
			{script.settings.constructor.columns.map((column, key) => <Card key={key}>
				{column.map((row, key) => <FormItem key={key} top={row.top}>
					{row.checkboxes?.map((checkbox, key) => <Checkbox defaultChecked={script.settings[checkbox.id]} key={key} name={checkbox.id} description={checkbox.description}>{checkbox.title}</Checkbox>)}
					{row.radios?.map((radio, key) => <Radio defaultChecked={script.settings[radio.id] == (key+1)} key={key} name={radio.id} value={key+1} description={radio.description}>{radio.title}</Radio>)}
				</FormItem>)}
			</Card>)}
		</CardGrid>
	</> : false;
};
const ScriptRoot = (props) => {
	const defaultContent = (<Placeholder
		action={<UsersStack
			// photos={[...new Set([script.group.logo, ...script.logos])]}
			photos={[...new Set([script.group.logo])]}
			visibleCount={4}
			size='m'
		><span style={{ display: 'block', textAlign: 'left' }}>Проект<br/><Link href={script.group.link} target='_blank'>{script.group.title}</Link></span></UsersStack>}
		stretched
	/>);
	const [panel, setPanel] = useState('home');
	const [content, setContent] = useState(defaultContent);
	const [loaded, setLoaded] = useState(false);
	const settings = getSettings();
	useEffect(() => {
		window.ScriptRoot = {
			...window.ScriptRoot,
			setPanel,
			setContent,
			setLoaded,
		};
		const start = async() => {
			setLoaded(false);
			let from = 0;
			let to = 0;
			try {
				from = Number(/id: (\d+),/gim.exec(document.documentElement.innerHTML)[1]);
			} catch (error) { }
			try {
				to = Number(/initReactApplication.*?ownerId.*?(\d+)/gim.exec(await (await fetch(window.location.href)).text())[1]);
			} catch (error) {
				try {
					to = Number(document.querySelector(`[data-task-click='ProfileAction/abuse']`).getAttribute('data-user_id'));
				} catch (error) {
					if (document.querySelector('.profile_deleted_text > br')) {
						try {
							to = Number((await getData(`https://api.vk.com/method/utils.resolveScreenName?screen_name=${location.pathname.slice(1)}&access_token=27af1df427af1df427af1df46e27c552ac227af27af1df47b67845e29d5bbda714938b8&v=5.131`)).response.object_id);
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
			};
			setLoaded(true);
		};
		start();
	}, []);
	// useEffect(() => {
	// 	if (panel == 'home' && loaded) {
	// 		setContent(defaultContent);
	// 	}
	// }, [panel]);
	return (<>
		<AppRoot mode='embedded' portalRoot={props.root} scroll='contain'>
			<SplitLayout>
				<SplitCol>
					{loaded ? <>
						<div className='dvvEpic'>
							<div className='dvvEpic__in'>
								<div className='vkuiTabs vkuiTabs--ios vkuiTabs--default vkuiTabs--sizeX-regular' role='tablist'>
									<div className='vkuiTabs__in'/>
								</div>
								<div className='dvvEpic__in-after'>
									<div id='trigger'></div>
									{(JSON.stringify(content || {}) != JSON.stringify(defaultContent || {})) && loaded && <Button mode="tertiary" appearance='neutral' onClick={() => setContent(defaultContent)}><Icon16Cancel width={16} height={16} style={{ padding: 8 }}/></Button>}
								</div>
							</div>
						</div>
					</> : <>
						<div className='dvvEpic'>
							<div className='dvvEpic__in'>
								<div className='vkuiTabs vkuiTabs--ios vkuiTabs--default vkuiTabs--sizeX-regular' role='tablist'>
									<div className='vkuiTabs__in'>
										<Skeleton height={44} width={150}/>
										{/* <Skeleton height={44} width={75}/> */}
										{/* <Skeleton height={44} width={125}/> */}
									</div>
								</div>
								<div className='dvvEpic__in-after'>
									<Skeleton height={32} width={32}/>
								</div>
							</div>
						</div>
					</>}
					<View activePanel={panel}>
						<Panel id='home'>
							{content}
						</Panel>
						<Panel id='settings'>
							<Separator/>
							<ScriptSettings onChange={() => {
								setLoaded(false);
								setTimeout(() => {
									setLoaded(true);
								}, 1000);
							}}/>
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
		const target = event.target || null;
		let vk_portal = vk_root.querySelector('.Profile__column');
		if (vk_portal && target?.closest) {
			let script_frame = vk_portal.querySelector('.dvvFrame');
			let script_root = script_frame?.querySelector('.dvvRoot');
			if (!script_frame) {
				vk_portal.insertAdjacentHTML('afterbegin', `<div class='dvvFrame'><div class='dvvRoot'></div></div>`);
				script_frame = vk_portal.querySelector('.dvvFrame');
				if (script_frame) {
					script_root = script_frame.querySelector('.dvvRoot');
					if (script_root) {
						log('Render root');
						for (const [key, style] of Object.entries(styleSheets)) script_frame.insertAdjacentHTML('beforeend', `<style type='text/css' id='${key}'>${style}</style>`);
						ReactDOM.createRoot(script_root).render(<ScriptConfig><ScriptRoot root={script_root}/></ScriptConfig>);
					}
				}
			} else script_root = script_frame.querySelector('.dvvRoot');
			if (target.id == 'trigger') {
				const script_tabs = script_root.querySelector('.vkuiTabs__in');
				if (script_tabs) {
					const renderMethod = (root, element) => script_tabs.innerHTML == '' ? ReactDOM.createRoot(root).render(element) : ReactDOM.hydrateRoot(root, element);
					if (!script_tabs.querySelector(`.vkuiTabsItem#${script.id}`)) {
						log('Render button', script);
						renderMethod(script_tabs, <ScriptConfig><Script script={script} log={log} getData={getData} getSettings={getSettings} setSettings={setSettings}/></ScriptConfig>);
					}
				}
			} else {
				if (target.closest('.vkuiTabs__in') && !target.classList.contains('TabsItem')) {
					const script_tabs = script_root.querySelector('.vkuiTabs__in');
					if (script_tabs) {
						// ReactDOM.hydrateRoot(script_tabs, <ScriptConfig><Script script={script} log={log} getData={getData} getSettings={getSettings} setSettings={setSettings}/></ScriptConfig>);
					}
				}
			}
			script_root.addEventListener('DOMSubtreeModified', (event) => {
				if (event?.target?.classList?.contains('dvvDetails')) {
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