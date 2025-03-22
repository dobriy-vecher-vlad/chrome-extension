const x2js = new X2JS();
const md5 = (str_old) => {
	function utf8_encode(str_data) {
		str_data = str_data.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < str_data.length; n++) {
			var c = str_data.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	}
	var RotateLeft = function(lValue, iShiftBits) {
		return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
	};
	var AddUnsigned = function(lX,lY) {
		var lX4,lY4,lX8,lY8,lResult;
		lX8 = (lX & 0x80000000);
		lY8 = (lY & 0x80000000);
		lX4 = (lX & 0x40000000);
		lY4 = (lY & 0x40000000);
		lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
		if (lX4 & lY4) {
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if (lX4 | lY4) {
			if (lResult & 0x40000000) {
				return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			} else {
				return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			}
		} else {
			return (lResult ^ lX8 ^ lY8);
		}
	};
	var F = function(x,y,z) { return (x & y) | ((~x) & z); };
	var G = function(x,y,z) { return (x & z) | (y & (~z)); };
	var H = function(x,y,z) { return (x ^ y ^ z); };
	var I = function(x,y,z) { return (y ^ (x | (~z))); };
	var FF = function(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
	var GG = function(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
	var HH = function(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
	var II = function(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
	var ConvertToWordArray = function(str) {
		var lWordCount;
		var lMessageLength = str.length;
		var lNumberOfWords_temp1=lMessageLength + 8;
		var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
		var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
		var lWordArray=Array(lNumberOfWords-1);
		var lBytePosition = 0;
		var lByteCount = 0;
		while ( lByteCount < lMessageLength ) {
			lWordCount = (lByteCount-(lByteCount % 4))/4;
			lBytePosition = (lByteCount % 4)*8;
			lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount)<<lBytePosition));
			lByteCount++;
		}
		lWordCount = (lByteCount-(lByteCount % 4))/4;
		lBytePosition = (lByteCount % 4)*8;
		lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
		lWordArray[lNumberOfWords-2] = lMessageLength<<3;
		lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
		return lWordArray;
	};
	var WordToHex = function(lValue) {
		var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
		for (lCount = 0;lCount<=3;lCount++) {
			lByte = (lValue>>>(lCount*8)) & 255;
			WordToHexValue_temp = "0" + lByte.toString(16);
			WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
		}
		return WordToHexValue;
	};
	var x=Array();
	var k,AA,BB,CC,DD,a,b,c,d;
	var S11=7, S12=12, S13=17, S14=22;
	var S21=5, S22=9 , S23=14, S24=20;
	var S31=4, S32=11, S33=16, S34=23;
	var S41=6, S42=10, S43=15, S44=21;
	str = utf8_encode(str_old);
	x = ConvertToWordArray(str);
	a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
	for (k=0;k<x.length;k+=16) {
		AA=a; BB=b; CC=c; DD=d;
		a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
		d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
		c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
		b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
		a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
		d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
		c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
		b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
		a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
		d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
		c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
		b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
		a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
		d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
		c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
		b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
		a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
		d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
		c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
		b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
		a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
		d=GG(d,a,b,c,x[k+10],S22,0x2441453);
		c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
		b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
		a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
		d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
		c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
		b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
		a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
		d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
		c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
		b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
		a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
		d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
		c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
		b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
		a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
		d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
		c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
		b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
		a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
		d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
		c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
		b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
		a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
		d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
		c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
		b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
		a=II(a,b,c,d,x[k+0], S41,0xF4292244);
		d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
		c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
		b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
		a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
		d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
		c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
		b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
		a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
		d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
		c=II(c,d,a,b,x[k+6], S43,0xA3014314);
		b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
		a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
		d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
		c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
		b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
		a=AddUnsigned(a,AA);
		b=AddUnsigned(b,BB);
		c=AddUnsigned(c,CC);
		d=AddUnsigned(d,DD);
	}
	var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
	return temp.toLowerCase();
}
const numberSpaces = (number, symbol = ' ') => Number.isInteger(Number(number)) ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol) : null;
const log = (title) => console.log(`[${new Date().toLocaleTimeString()}] — [${ScriptName}] — ${title}`);
const ScriptRun = (type) => {
	if (type == 'event' && document.querySelector('#page_body')) {
		log('Script run Mutation event.');
		new MutationObserver(mutations => {
			for(let mutation of mutations) {
				for(let node of mutation.addedNodes) {
					if (!(node instanceof HTMLElement)) continue;
					if (node.id == 'wrap3' || node.id == 'list_content' || node.querySelector('.Profile__column') || node.querySelector('[id*="friends_user"]') || node.querySelector('[class*="friends_user"]')) ScriptRun('load');
				}
			}
		}).observe(document.querySelector('#page_body'), {
			childList: true,
			subtree: true,
		});
	} else if (type == 'load' && document.querySelector('.profile_content')) {
		if (document.querySelector('.profile_deleted_text > br')) {
			log('Script run on delete page.');
			ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
		} else {
			log('Script run on page.');
			ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
		}
	} else if (type == 'load' && document.querySelector('.Profile__column')) {
		log('Script run on new page.');
		ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
	} else if (type == 'load' && document.querySelector('.friends_list')) {
		log('Script run on frends.');
		ScriptLoad('friends', ScriptName, ScriptTitle, ScriptVersion);
	}
};
const getData = async(type, link) => {
	if (!type || !link) return;
	try {
		let data = await (await fetch(link)).text();
		try {
			data = JSON.parse(data);
		} catch (error) {
			data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
			data = await x2js.xml_str2json(data);
		}
		if (data?.data != undefined) data = data.data;
		return data;
	} catch (error) {
		log(error);
		return null;
	}
};
const getDataChrome = async(link, body) => {
	if (link && body) {
		try {
			let data = await new Promise((resolve) => chrome.runtime.sendMessage({
				link: link,
				body: body
			}, data => {
				resolve(data);
			})).then(data => data);
			try {
				data = JSON.parse(data);
			} catch (error) {
				data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
				data = await x2js.xml_str2json(data);
			}
			return data;
		} catch (error) {
			log(error);
			return null;
		}
	}
};
const ScriptUpdateTabs = (tab) => {
	for (let tab of document.querySelectorAll('.active__')) tab.classList.remove('active__');
	try {
		tab.classList.add('active__');
	} catch (error) {
		
	}
}
const ScriptUpdateSettings = (name) => {
	let script__settings = JSON.parse(localStorage.getItem('script__settings'));
	if (!script__settings) {
		script__settings = {
			_1: false,
			_2: true,
			_3: false,
			_4: true
		};
	}
	if (name && !script__settings[name]) script__settings[name] = {
		_1: true,
		_2: true,
		_3: false,
		_4: false,
		_5: false,
		_6: true,
		_7: true,
		_8: true,
		_9: 1,
		_10: false
	};
	localStorage.setItem('script__settings', JSON.stringify(script__settings));
	return script__settings;
}
const ScriptLoad = async(type, name, text, version) => {
	if (type == 'page') {
		const isNew = document.querySelector('.Profile__column');
		if (document.querySelector('.script__head')) {
			if (document.querySelector(`.script__head .head__button[${name}]`)) return;
			let script__settings = ScriptUpdateSettings(name);
			document.querySelector('.script__navigation').insertAdjacentHTML('beforeend', `<div class="head__button" ${name}>${text}<span>${version}</span></div>`);
			document.querySelector(`.script__navigation > [${name}]`).addEventListener('click', async(event) => {
				try {
					let tab = event.target.closest('.head__button');
					if (tab.getAttribute('disabled') == null) {
						ScriptUpdateTabs(tab);
						document.querySelector('.script__body').innerHTML = '<div class="script__text loader__"><br><br>Получаем номер игрока</div>';
						tab.setAttribute('disabled', '');
						let from = 0;
						let to = 0;
						try {
							from = Number(/id: (\d+),/gim.exec(document.documentElement.innerHTML)[1]);
						} catch (error) { }
						try {
							to = Number(document.querySelector('meta[property="og:url"][content]').getAttribute('content').replace(/\D/g, ''));
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
						document.querySelector('.script__body').setAttribute(`script__${to}`, '');
						await ScriptProfileLoad(name, from, to);
						tab.removeAttribute('disabled');
					}
				} catch (error) {
					log(error);
					document.querySelector('.script__body').innerHTML = `<div class="script__text error__"><br><br>${error}</div>`;
				}
			});
			document.querySelector(`.script__settings`).addEventListener('click', () => {
				try {
					if (name && version) {
						let parent = document.querySelector('.script__body .settings__body > div');
						parent.insertAdjacentHTML('beforeend', `<div class="button__ game__" ${name}><span style='text-transform: uppercase;'>${name}</span></div>`);
						document.querySelector(`.settings__body .button__[${name}]`).addEventListener('click', () => {
							let script__settings = ScriptUpdateSettings(name);
							document.querySelector('.script__text.settings__').innerHTML = `
								<div class="settings__body" style='grid-column-start: span 2;'>
									<div data-text='Настройки — Специальные настройки ${name}'><div class="button__ back__"><span>Общие настройки</span></div></div>
								</div>
								<div class="settings__body">
									<div data-text='Отображаемые блоки'>
										<input type="checkbox" id="_1" ${script__settings[name]._1 == true ? 'checked' : ''}><label for="_1">Статусы<span>Блок со статусами пользователя</span></label>
										<input type="checkbox" id="_2" ${script__settings[name]._2 == true ? 'checked' : ''}><label for="_2">Информация клана<span>Блок с информацией клана пользователя</span></label>
										<input type="checkbox" id="_10" ${script__settings[name]._10 == true ? 'checked' : ''}><label for="_10">Улучшения клана<span>Блок с улучшениями клана пользователя</span></label>
										<input type="checkbox" id="_3" ${script__settings[name]._3 == true ? 'checked' : ''}><label for="_3">Состав клана<span>Блок с составом клана пользователя</span></label>
										<input type="checkbox" id="_4" ${script__settings[name]._4 == true ? 'checked' : ''}><label for="_4">События клана<span>Блок с событиями клана пользователя</span></label>
										<input type="checkbox" id="_5" ${script__settings[name]._5 == true ? 'checked' : ''}><label for="_5">Пополнения клана<span>Блок с пополнениями клана пользователя</span></label>
										<input type="checkbox" id="_6" ${script__settings[name]._6 == true ? 'checked' : ''}><label for="_6">Навыки игрока<span>Блок с навыками пользователя</span></label>
										<input type="checkbox" id="_7" ${script__settings[name]._7 == true ? 'checked' : ''}><label for="_7">Характеристики игрока<span>Блок с характеристиками пользователя</span></label>
										<input type="checkbox" id="_8" ${script__settings[name]._8 == true ? 'checked' : ''}><label for="_8">Информация по боссу<span>Блок с информацией по боссу пользователя</span></label>
									</div>
								</div>
								<div class="settings__body">
									<div data-text='Сортировка состава'>
										<input name="_9" type="radio" id="_9_1" value="1" ${script__settings[name]._9 == 1 ? 'checked' : ''}><label for="_9_1">Ранг<span>От главы до рядового</span></label>
										<input name="_9" type="radio" id="_9_2" value="2" ${script__settings[name]._9 == 2 ? 'checked' : ''}><label for="_9_2">Урон<span>От большего к меньшему</span></label>
										<input name="_9" type="radio" id="_9_3" value="3" ${script__settings[name]._9 == 3 ? 'checked' : ''}><label for="_9_3">Здоровье<span>От большего к меньшему</span></label>
										<input name="_9" type="radio" id="_9_4" value="4" ${script__settings[name]._9 == 4 ? 'checked' : ''}><label for="_9_4">Дата входа<span>От новой к старой</span></label>
									</div>
								</div>
							`;
							document.querySelector(`.settings__body .back__`).addEventListener('click', () => document.querySelector(`.script__settings`).click());
							for (let item of document.querySelectorAll(`.settings__ input[type="checkbox"]`)) item.addEventListener('click', (event) => {
								let script__settings = ScriptUpdateSettings(name);
								script__settings[name][event.target.id] = event.target.checked;
								localStorage.setItem('script__settings', JSON.stringify(script__settings));
							});
							for (let item of document.querySelectorAll(`.settings__ input[type="radio"]`)) item.addEventListener('click', (event) => {
								let script__settings = ScriptUpdateSettings(name);
								script__settings[name][event.target.name] = Number(event.target.value);
								localStorage.setItem('script__settings', JSON.stringify(script__settings));
							});
						});
					} else document.querySelector('.script__body').innerHTML = `<div class="script__text error__"><br><br>Ошибка при загрузке настроек</div>`;
				} catch (error) {
					log(error);
					document.querySelector('.script__body').innerHTML = `<div class="script__text error__"><br><br>${error}</div>`;
				}
			});
		} else {
			let script__settings = ScriptUpdateSettings();
			let date = new Date();
			document.querySelector(isNew ? '.Profile__column' : '.wide_column_wrap .page_block').insertAdjacentHTML(isNew ? 'afterbegin' : 'afterend', `
				<div class="page_block script__"${script__settings._1 == true ? ' _1' : ''}${script__settings._2 == true ? ' _2' : ''}${script__settings._4 == true ? ' _4' : ''}>
					<div class="script__head${date.getMonth() == 11 || date.getMonth() == 0 ? ' new_year__' : ''}${date.getMonth() == 1 && date.getDate() >= 16 && date.getDate() <= 30 ? ' defender_day__' : ''}${date.getMonth() == 2 && date.getDate() >= 1 && date.getDate() <= 15 ? ' women_day__' : ''}${date.getMonth() == 3 && date.getDate() >= 24 || date.getMonth() == 4 && date.getDate() <= 8 ? ' labor_day__' : ''}${date.getMonth() == 4 && date.getDate() >= 2 && date.getDate() <= 16 ? ' victory_day__' : ''}${date.getMonth() == 9 && date.getDate() >= 24 || date.getMonth() == 10 && date.getDate() <= 7 ? ' halloween_day' : ''}">
						<div class="script__navigation"></div>
						<div class="script__settings"></div>
					</div>
					<div class="script__body">
						<div class="script__text starter__"><br><br><a href="https://vk.com/wiki.warlord" target="_blank">vk.com/wiki.warlord</a></div>
					</div>
				</div>
			`);
			document.querySelector(`.script__settings`).addEventListener('click', (event) => {
				let body = document.querySelector('.script__body');
				try {
					ScriptUpdateTabs(event);
					body.innerHTML = `<div class="script__text loader__" settings__><br><br>Загружаем настройки</div>`;
					if (name && version) {
						let parent = document.querySelector('.script__body [settings__]');
						let script__settings = ScriptUpdateSettings();
						parent.classList.remove('loader__');
						parent.classList.add('settings__');
						parent.innerHTML = `
							<div class="settings__body" style='grid-column-start: span 2;'>
								<div data-text='Специальные настройки'></div>
								<div data-text='Общие настройки'>
									<input type="checkbox" id="_3" ${script__settings._3 == true ? 'checked' : ''}><label for="_3">Игровая тема<span>Тема в стиле интерфейса приложения</span></label>
									${isNew ? '' : `<input type="checkbox" id="_1" ${script__settings._1 == true ? 'checked' : ''}><label for="_1">Тёмная тема<span>Затемнённый интерфейс для тёмного ВКонтакте</span></label>`}
									<input type="checkbox" id="_2" ${script__settings._2 == true ? 'checked' : ''}><label for="_2">Анимация<span>Анимация при наведении и нажатии на объекты</span></label>
									<input type="checkbox" id="_4" ${script__settings._4 == true ? 'checked' : ''}><label for="_4">Версия<span>Отображать версию рядом с названием</span></label>
									<div class="separator__"></div>
									<div class="button__ delete__"><span>Сбросить сохранённые настройки</span></div>
								</div>
							</div>
						`;
						let script_ = document.querySelector(`.script__`);
						for (let item of document.querySelectorAll(`.settings__ input[type="checkbox"]`)) item.addEventListener('click', (event) => {
							let script__settings = ScriptUpdateSettings();
							script__settings[event.target.id] = event.target.checked;
							localStorage.setItem('script__settings', JSON.stringify(script__settings));
							script__settings[event.target.id] == true ? script_.setAttribute(event.target.id, '') : script_.removeAttribute(event.target.id);
						});
						document.querySelector(`.settings__body .delete__`).addEventListener('click', () => {
							localStorage.removeItem('script__settings');
							document.querySelector(`.script__settings`).click();
							let script__settings = ScriptUpdateSettings();
							let keys = Object.keys(script__settings);
							for (let [x, item] of keys.entries()) script__settings[item] == true ? script_.setAttribute(keys[x], '') : script_.removeAttribute(keys[x]);
						});
					} else body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при загрузке настроек</div>`;
				} catch (error) {
					log(error);
					console.warn(error);
					body.innerHTML = `<div class="script__text error__"><br><br>${error}</div>`;
				}
			});
			ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
		}
	} else if (type == 'friends') {
		for (let [x, item] of document.querySelectorAll('.friends_user_row').entries()) {
			if (item.querySelector(`.friends_user_info > div[script__id__${name}]`) == null) {
				let my_id = /id: (.*),/gim.exec(document.documentElement.innerHTML)[1];
				let u_id = 0;
				try {
					u_id = /(\d{2,20})/.exec(item.querySelector('.friends_photo_wrap').getAttribute('onmouseover'))[1];
				} catch (error) {
					try {
						u_id = /(\d{2,20})/.exec(item.querySelector('.friends_actions_menu .ui_actions_menu_item').getAttribute('href'))[1];
					} catch (error) {
						try {
							u_id = /(\d{2,20})/.exec(item.querySelector('.friends_controls').getAttribute('id'))[1];
						} catch (error) {
							console.log(item, error);
						}
					}
				}
				if (document.querySelector(`.friends_user_row + .script__ [script__${u_id}]`) == null) item.insertAdjacentHTML('afterend', `<div class="script__" friends style="display: none;"><div class="script__body" script__${u_id}><div class="script__text loader__"><br><br>Получаем номер игрока</div></div></div>`);
				item.querySelector('.friends_user_info > div').insertAdjacentHTML('afterend', `<div style="display: table-cell;" class="friends_lists clear_fix" script__id__${name}><span id="script__${name}__${u_id}" class="friends_lists_group group2" style="background-color: #faead8; color: #764f14">${text}</span></div>`);
				document.querySelector(`#script__${name}__${u_id}`).addEventListener('click', async(event) => {
					let tab = event.target.closest('.friends_lists_group');
					if (tab.getAttribute('disabled') == null) {
						tab.setAttribute('disabled', '');
						document.querySelector(`[script__${u_id}]`).parentElement.removeAttribute('style');
						await ScriptProfileLoad(name, my_id, u_id);
						tab.removeAttribute('disabled');
					}
				}, false);
			}
		}
	}
};