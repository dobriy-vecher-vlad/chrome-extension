import X2JS from './xml2js.js';
import React, { useState, useEffect } from "react";
import * as ReactDOM from 'react-dom/client';
import {
	AdaptivityProvider,
	AppRoot,
	Button,
	ConfigProvider,
	Counter,
	Panel,
	ScreenSpinner,
	SplitCol,
	SplitLayout,
	Tabs,
	TabsItem,
	View
} from '@vkontakte/vkui';
import {
	Icon16MenuOutline,
} from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';
import "@vkontakte/vkui/dist/unstable.css";
import './style.css';


import Script__warlord from './scripts/warlord';


const x2js = new X2JS();
const script = {
	id: 'warlord',
	title: 'Warlord',
	version: '3.0.0',
	settings: {
		showBanners: true,
		// server: 1,
	},
};
const pathImages = 'https://dobriy-vecher-vlad.github.io/warlord-helper/media/images/';
const islocalStorage = (() => {
	try {
		localStorage.setItem('islocalStorage', 'islocalStorage');
		localStorage.removeItem('islocalStorage');
		return true;
	} catch(e) {
		return false;
	}
})();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));


// if (window) {
// 	if (islocalStorage) {
// 		let settings = JSON.parse(localStorage.getItem(`dvvStorage__${script.id}`) || `{}`)?.settings || script.settings;
// 		script.settings = {
// 			...script.settings,
// 			...settings,
// 		}
// 		localStorage.setItem(`dvvStorage__${script.id}`, JSON.stringify(script));
// 	}
// 	window.dvvStorage = [...window.dvvStorage || [], script];
// }
// window.dvvStorage = [{
// 	id: 'warlord',
// 	title: 'Warlord',
// 	version: '3.0.0',
// 	settings: {
// 		showBanners: true,
// 		server: 1,
// 	},
// 	user: 153968505,
// }, {
// 	id: 'warlord',
// 	title: 'Warlord',
// 	version: '3.0.0',
// 	settings: {
// 		showBanners: true,
// 		server: 1,
// 	},
// 	user: 14973344,
// }];


const Script = (props) => {
	const [popout, setPopout] = useState(null);
	const clearPopout = () => setPopout(null);
	const [panel, setPanel] = useState('home');
	const [from, setFrom] = useState(0);
	const [to, setTo] = useState(0);
	const [timestamp, setTimestamp] = useState(0);
	const [server, setServer] = useState(0);

	useEffect(() => {
		const load = async() => {
			setPopout(<ScreenSpinner state="loading" />);
			let _from = from;
			let _to = to;
			try {
				_from = Number(/id: (\d+),/gim.exec(document.documentElement.innerHTML)[1]);
			} catch (error) { }
			try {
				_to = Number(/ProfileWrapper.*?data-exec.*?(\d+).*?hashes/gim.exec(await (await fetch(window.location.href)).text())[1]);
			} catch (error) {
				try {
					_to = Number(document.querySelector('[data-task-click="ProfileAction/abuse"]').getAttribute('data-user_id'));
				} catch (error) {
					if (document.querySelector('.profile_deleted_text > br')) {
						try {
							_to = Number((await getData('json', `https://api.vk.com/method/utils.resolveScreenName?screen_name=${location.pathname.slice(1)}&access_token=27af1df427af1df427af1df46e27c552ac227af27af1df47b67845e29d5bbda714938b8&v=5.131`)).response.object_id);
						} catch (error) { }
					}
				}
			}
			if (!_from && _to) _from = _to;
			if (!_to && _from) _to = _from;
			setFrom(_from);
			setTo(_to);
			setServer(1);
			setPopout(<ScreenSpinner state="done" aria-label="Успешно" />);
			setTimeout(clearPopout, 1000);
			console.log(_from, _to);
			console.log(script);
		};
		load();
	}, []);


	const loadScript = (user) => {
		console.log(script.id, from, user, timestamp);
		setTimestamp(+new Date());
		setServer(1);
		setFrom(from);
		setTo(user);
		setPanel(script.id);
	};
	
	
	const getData = async(type, link) => {
		if (link == null) link = type;
		if (type && link) {
			try {
				let data = await fetch(link.replace(/%2B/g, '+').replace(/%3D/g, '='));
				data = await data.text();
				if (data == 'Err. More than 1 request per second' || data == 'Too many requests per second.') {
					await wait(1000);
					return await getData(type, link);
				}
				try {
					data = JSON.parse(data);
				} catch (error) {
					data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
					data = await x2js.xml_str2json(data);
				}
				if (data.data) data = data.data;
				return data;
			} catch (error) {
				console.log(error);
				if (/ETIMEDOUT/.exec(error.message)) return await getData(link);
				return null;
			}
		}
	}
	const getFakeData = async() => {
		let data = `<?xml version="1.0" encoding="utf-8"?><data><u id="157476304"
vkId="157476304"
okId="0"
fbId="0"
kgId="0"
mmId="0"
exId="0"
gmId="0"
rbId="0"
mobId="0"
aid="8"
va="0"
vi="0"
vet="0"
exp="185468783"
type="0"
ap="2036"
al="7"
a_c="0"
hp=""
mhp=""
name="OLEG " 
lvl="66"
room="5"
bd="73434189"  
loc="25" 
end="83"
luck="3"
endi="32367"
lucki="0"
dmgi="86006"
l_t="5070"
loot="0" 
clan_id="846" 
clan_d="65647265"
clan_r="4" 
car1_lvl="0"  
a1="8" 
a2="5"
a3="1"
a4="1" 
a5="5"  
d1="0"
d2="1452" 
d3="1823" 
d4="0" 
d5="1613" 
d6="1758"
d7="1761" 
d8="1763" 
d9="1713"
d10="1626"
d11="1567"
pet="5"
s1="101" 
s2="50" 
s3="517" 
s4="192" /><clan
			id			= "846"
			name		= "NORD STAR"
			lvl			= "146"
			leader		= "104015994"
			mcnt		= "62"
			descr		= "кому нужны камни-в казну на рейды
"
			u1			= "19"
			u2			= "10"
			u3			= "15"
			u4			= "10"
			u5			= "13"
			u6			= "18"
			u7			= "0"
			u8			= "0"
			u9			= "0"
			u10			= "0"
			wu1			= "0"
			wu2			= "1"
			wu3			= "0"
			wu4			= "0" /><fight
time 		= "4464"
mhp 		= "64750000"
hp 			= "-25334"
dmg 		= "5250"
myhp 		= ""
eid 		= "337"
fid 		= "278621674" name = "Ургат" ><users id="152688436" n="-GR- Алекс" vkId="152688436" dd="24089526" /><users id="119823722" n="[BC] Devil Fish" vkId="119823722" dd="30603816" /><users id="157476304" n="OLEG " vkId="157476304" dd="8177808" /><users id="50508374" n="Bishop" vkId="50508374" dd="1904184" /></fight></data>`;
		data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
		data = await x2js.xml_str2json(data);
		if (data.data) data = data.data;
		return data;
	};
	return (<>
		<ConfigProvider isWebView={false} transitionMotionEnabled={false} platform='ios' webviewType='internal' scheme='inherit'>
			<AdaptivityProvider>
				<AppRoot mode='embedded' portalRoot={props.root} scroll='contain'>
					<SplitLayout popout={popout}>
						<SplitCol>
							<div className='dvvEpic'>
								<div className='dvvEpic__in'>
									<Tabs mode='default'>
										<TabsItem
											id="tab-scripts"
											aria-controls="tab-content-scripts"
											selected={panel == script.id}
											onClick={() => loadScript(to)}
											status={<div className='vkuiTabsItem__status--count vkuiSubhead vkuiSubhead--sizeY-compact vkuiSubhead--w-2'>{script.version}</div>}
											after={to?<Counter size="s" mode="primary">{to}</Counter>:false}
										>{script.title}</TabsItem>
									</Tabs>
									<div className='dvvEpic__in-after'>
										<Button mode={panel == 'settings' ? 'secondary' : 'tertiary'} appearance="neutral" onClick={() => setPanel('settings')}><Icon16MenuOutline width={16} height={16} style={{ padding: 8 }}/></Button>
									</div>
								</div>
							</div>
							<View activePanel={panel}>
								<Panel id='home'>
									home
								</Panel>
								<Script__warlord id={script.id} script={script} getData={getData} getFakeData={getFakeData} from={from} to={to} server={server} timestamp={timestamp} />
								<Panel id='settings'>
									settings
								</Panel>
							</View>
						</SplitCol>
					</SplitLayout>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	</>);
};


const VKroot = document.querySelector('#page_body');
if (VKroot) {
	VKroot.addEventListener('DOMNodeInserted', (event) => {
		let portal = document.querySelector('.Profile__column');
		let frame = document.querySelector('.dvvFrame');
		if (frame) return false;
		if (!portal) {
			portal = document.querySelector('#profile .wide_column .page_block');
			if (!frame && portal) {
				portal.insertAdjacentHTML('afterend', '<div class="dvvFrame"><div class="dvvRoot" style="margin-top: var(--page-block-offset, 15px);"></div></div>');
				portal = portal.parentNode;
			}
		} else if (!frame && portal) portal.insertAdjacentHTML('afterbegin', '<div class="dvvFrame"><div class="dvvRoot" style="margin-bottom: var(--page-block-offset, 15px);"></div></div>');
		frame = portal?.querySelector('.dvvFrame');
		const root = frame?.querySelector('.dvvRoot');
		if (!frame) return false;
		if (!root) return false;
		ReactDOM.createRoot(root).render(<Script root={root}/>);
	}, false);
	VKroot.dispatchEvent(new Event('DOMNodeInserted'));
}