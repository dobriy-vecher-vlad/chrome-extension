const x2js = new X2JS();
function numberSpaces(number, symbol = '.') {
	if (Number.isInteger(Number(number))) {
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol);
	}
	return null;
}
/* 
	numberSpaces(1234567890, ' : ');
	> 1 : 234 : 567 : 890
*/
function numberForm(number, titles) {
	number = Math.abs(number);
	if (Number.isInteger(Number(number))) {
		cases = [2, 0, 1, 1, 1, 2];  
		return titles[(number%100>4&&number%100<20)?2:cases[(number%10<5)?number%10:5]];
	}
	return null;
}
/* 
	numberForm(132, ['рубль', 'рубля', 'рублей']);
	> рубля
*/
function numberRandom(min = 1, max = 2) {
	if (Number.isInteger(Number(min)) && Number.isInteger(Number(max))) {
		return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
	}
	return null;
}
/* 
	numberRandom(1, 100000);
	> 27722
*/
function log(title) {
	console.log(`[${new Date().toLocaleTimeString()}] — [${ScriptName}] — ${title}`);
}
function ScriptRun(type) {
	if (type == 'event') {
		if (document.querySelector('#page_body') !== null) {
			log('Script run Mutation event.');
			document.querySelector('#page_body').addEventListener('DOMNodeInserted', function (event) {
				if (event.relatedNode.id == 'wrap3' || event.relatedNode.id == 'list_content') {
					ScriptRun('load');
				}
			}, false);
		}
	}
	if (document.querySelector('.profile_content') != null && document.querySelector('.profile_deleted_text > br') == null && type == 'load') {
		log('Script run on page.');
		ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
	}
	if (document.querySelector('.profile_content') != null && document.querySelector('.profile_deleted_text > br') !== null && type == 'load') {
		log('Script run on delete page.');
		ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
	}
	if (document.querySelector('.friends_list') != null && type == 'load') {
		log('Script run on frends.');
		ScriptLoad('friends', ScriptName, ScriptTitle, ScriptVersion);
	}
	if (type == 'test') {
		log('Script run on test page.');
		ScriptLoad('page', ScriptName, ScriptTitle, ScriptVersion);
	}
}
async function getData(type, link) {
	if (type && link) {
		try {
			let data = await fetch(link);
			data = await data.text();
			try {
				data = JSON.parse(data);
			} catch (error) {
				data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
				data = await x2js.xml_str2json(data);
			}
			if (data && data.data != undefined) data = data.data;
			return data;
		} catch (error) {
			log(error);
			return null;
		}
	}
}
async function getDataChrome(link, body) {
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
}
function ScriptUpdateTabs(e) {
	document.querySelectorAll('.active__').forEach((item) => {
		item.classList.remove('active__');
	});
	e.classList.add('active__');
}
function ScriptUpdateSettings(name) {
	let script__settings = {};
	if (localStorage.getItem('script__settings') == null) {
		script__settings = {
			_1: false,
			_2: true,
			_3: false,
			_4: true
		};
		localStorage.setItem('script__settings', JSON.stringify(script__settings));
	} else {
		script__settings = JSON.parse(localStorage.getItem('script__settings'));
	}
	if (name && script__settings[name] == undefined) {
		script__settings[name] = {
			_1: true,
			_2: true,
			_3: true,
			_4: 1,
			_5: true,
			_6: true,
			_7: true,
			_8: 1,
			_9: true
		};
		localStorage.setItem('script__settings', JSON.stringify(script__settings));
	}
	return script__settings;
}
async function ScriptLoad(type, name, text, version) {
	if (type == 'page' && document.querySelector('.script__head') == null) {
		let script__settings = ScriptUpdateSettings();
		let date = new Date();
		let html = `
			<div class="page_block script__"${script__settings._1 == true ? ' _1' : ''}${script__settings._2 == true ? ' _2' : ''}${script__settings._4 == true ? ' _4' : ''}>
				<div class="script__head${date.getMonth() == 11 || date.getMonth() == 0 ? ' new_year__' : ''}${date.getMonth() == 1 && date.getDate() >= 16 && date.getDate() <= 30 ? ' defender_day__' : ''}${date.getMonth() == 2 && date.getDate() >= 1 && date.getDate() <= 15 ? ' women_day__' : ''}${date.getMonth() == 3 && date.getDate() >= 24 || date.getMonth() == 4 && date.getDate() <= 8 ? ' labor_day__' : ''}${date.getMonth() == 4 && date.getDate() >= 2 && date.getDate() <= 16 ? ' victory_day__' : ''}${date.getMonth() == 9 && date.getDate() >= 24 || date.getMonth() == 10 && date.getDate() <= 7 ? ' halloween_day' : ''}">
					<div class="script__navigation"></div>
					<div class="script__settings"></div>
				</div>
				<div class="script__body">
					<div class="script__text starter__"><br><br><a href="https://vk.com/wiki.warlord" target="_blank">vk.com/wiki.warlord</a></div>
				</div>
			</div>
		`;
		document.querySelector('.wide_column_wrap .page_block').insertAdjacentHTML('afterend', html);
		document.querySelector(`.script__settings`).addEventListener('click', function() {
			try {
				ScriptUpdateTabs(this);
				document.querySelector('.script__body').innerHTML = `<div class="script__text loader__" settings__><br><br>Загружаем настройки</div>`;
				if (name && version) {
					let script__settings = ScriptUpdateSettings();
					let parent = document.querySelector('.script__body [settings__]');
					parent.classList.remove('loader__');
					parent.classList.add('settings__');
					parent.innerHTML = `
						<div class="settings__body" style='grid-column-start: span 2;'>
							<div data-text='Специальные настройки'></div>
							<div data-text='Общие настройки'>
								<input type="checkbox" id="_3" ${script__settings._3 == true ? 'checked' : ''}><label for="_3">Игровая тема<span>Тема в стиле интерфейса приложения</span></label>
								<input type="checkbox" id="_1" ${script__settings._1 == true ? 'checked' : ''}><label for="_1">Тёмная тема<span>Затемнённый интерфейс для тёмного ВКонтакте</span></label>
								<input type="checkbox" id="_2" ${script__settings._2 == true ? 'checked' : ''}><label for="_2">Анимация<span>Анимация при наведении и нажатии на объекты</span></label>
								<input type="checkbox" id="_4" ${script__settings._4 == true ? 'checked' : ''}><label for="_4">Версия<span>Отображать версию рядом с названием</span></label>
								<div class="separator__"></div>
								<div class="button__ delete__"><span>Сбросить сохранённые настройки</span></div>
							</div>
						</div>
					`;
					let script_ = document.querySelector(`.script__`);
					document.querySelectorAll(`.settings__ input[type="checkbox"]`).forEach((item) => {
						item.addEventListener('click', function(e) {
							let script__settings = ScriptUpdateSettings();
							script__settings[e.target.id] = e.target.checked;
							localStorage.setItem('script__settings', JSON.stringify(script__settings));
							script__settings[e.target.id] == true ? script_.setAttribute(e.target.id, '') : script_.removeAttribute(e.target.id);
						});
					});
					document.querySelector(`.settings__body .delete__`).addEventListener('click', function() {
						localStorage.removeItem('script__settings');
						document.querySelector(`.script__settings`).click();
						let script__settings = ScriptUpdateSettings();
						let keys = Object.keys(script__settings);
						keys.forEach((item, x) => {
							script__settings[item] == true ? script_.setAttribute(keys[x], '') : script_.removeAttribute(keys[x]);
						});
					});
				} else {
					document.querySelector('.script__body').innerHTML = `<div class="script__text error__"><br><br>Ошибка при загрузке настроек</div>`;
				}
			} catch (error) {
				document.querySelector('.script__body').innerHTML = `<div class="script__text error__"><br><br>${error}</div>`;
			}
		});
	}
	if (type == 'page' && document.querySelector('.script__head') !== null) {
		let html = `<div class="head__button" ${name}>${text}<span>${version}</span></div>`;
		document.querySelector('.script__navigation').insertAdjacentHTML('beforeend', html);
		document.querySelector(`.script__navigation > [${name}]`).addEventListener('click', async function() {
			try {
				if (this.getAttribute('disabled') == null) {
					this.setAttribute('disabled', '');
					let my_id = /id: (.*),/gim.exec(document.documentElement.innerHTML)[1];
					let u_id = 0;
					try {
						u_id = document.querySelector('[data-task-click="ProfileAction/abuse"]').getAttribute('data-user_id');
					} catch (error) {
						if (document.querySelector('.profile_deleted_text > br') !== null) {
							try {
								let vk = await getData('json', `https://api.vk.com/method/utils.resolveScreenName?screen_name=${location.pathname.slice(1)}&access_token=27af1df427af1df427af1df46e27c552ac227af27af1df47b67845e29d5bbda714938b8&v=5.126`);
								u_id = vk.response.object_id;
							} catch (error) {
								u_id = my_id;
							}
						} else {
							u_id = my_id;
						}
					}
					document.querySelector('.script__body').setAttribute(`script__${u_id}`, '');
					ScriptUpdateTabs(this);
					await ScriptProfileLoad(name, my_id, u_id);
					this.removeAttribute('disabled');
				}
			} catch (error) {
				log(error);
				document.querySelector('.script__body').innerHTML = `
					<div class="script__text error__"><br><br>${error}</div>
				`;
			}
		});
		document.querySelector(`.script__settings`).addEventListener('click', function() {
			if (name && version) {
				let parent = document.querySelector('.script__body .settings__body > div');
				parent.insertAdjacentHTML('beforeend', `<div class="button__ game__" ${name}><span style='text-transform: uppercase;'>${name}</span></div>`);
				document.querySelector(`.settings__body .button__[${name}]`).addEventListener('click', function() {
					let script__settings = ScriptUpdateSettings(name);
					document.querySelector('.script__text.settings__').innerHTML = `
						<div class="settings__body" style='grid-column-start: span 2;'>
							<div data-text='Настройки — Специальные настройки ${name}'><div class="button__ back__"><span>Общие настройки</span></div></div>
						</div>
						<div class="settings__body">
							<div data-text='Отображаемые блоки'>
								<input type="checkbox" id="_1" ${script__settings[name]._1 == true ? 'checked' : ''}><label for="_1">Статусы<span>Блок со статусами пользователя</span></label>
								<input type="checkbox" id="_6" ${script__settings[name]._6 == true ? 'checked' : ''}><label for="_6">Информация гильдии<span>Блок с информацией гильдии пользователя</span></label>
								<input type="checkbox" id="_9" ${script__settings[name]._9 == true ? 'checked' : ''}><label for="_9">Улучшения гильдии<span>Блок с улучшениями гильдии пользователя</span></label>
								<input type="checkbox" id="_7" ${script__settings[name]._7 == true ? 'checked' : ''}><label for="_7">Состав гильдии<span>Блок с составом гильдии пользователя</span></label>
								<input type="checkbox" id="_2" ${script__settings[name]._2 == true ? 'checked' : ''}><label for="_2">Навыки игрока<span>Блок с навыками пользователя</span></label>
								<input type="checkbox" id="_5" ${script__settings[name]._5 == true ? 'checked' : ''}><label for="_5">Миссии игрока<span>Блок с миссиями пользователя</span></label>
								<input type="checkbox" id="_3" ${script__settings[name]._3 == true ? 'checked' : ''}><label for="_3">Характеристики игрока<span>Блок с характеристиками пользователя</span></label>
							</div>
						</div>
						<div class="settings__body">
							<div data-text='Сортировка состава'>
								<input name="_8" type="radio" id="_8_1" value="1" ${script__settings[name]._8 == 1 ? 'checked' : ''}><label for="_8_1">Уровень<span>От большего к меньшему</span></label>
								<input name="_8" type="radio" id="_8_2" value="4" ${script__settings[name]._8 == 2 ? 'checked' : ''}><label for="_8_2">Дата входа<span>От новой к старой</span></label>
							</div>
							<div data-text='Сервер игры'>
								<input name="_4" type="radio" id="_4_1" value="1" ${script__settings[name]._4 == 1 ? 'checked' : ''}><label for="_4_1">Пламя<span>kahoxa.ru/s1</span></label>
								<input name="_4" type="radio" id="_4_2" value="2" ${script__settings[name]._4 == 2 ? 'checked' : ''}><label for="_4_2">Лёд<span>kahoxa.ru/s2</span></label>
								<input name="_4" type="radio" id="_4_3" value="3" ${script__settings[name]._4 == 3 ? 'checked' : ''}><label for="_4_3">Пустыня<span>kahoxa.ru/s3</span></label>
							</div>
						</div>
					`;
					document.querySelector(`.settings__body .back__`).addEventListener('click', function() {
						document.querySelector(`.script__settings`).click();
					});
					document.querySelectorAll(`.settings__ input[type="checkbox"]`).forEach((item) => {
						item.addEventListener('click', function(e) {
							let script__settings = ScriptUpdateSettings(name);
							script__settings[name][e.target.id] = e.target.checked;
							localStorage.setItem('script__settings', JSON.stringify(script__settings));
						});
					});
					document.querySelectorAll(`.settings__ input[type="radio"]`).forEach((item) => {
						item.addEventListener('click', function(e) {
							let script__settings = ScriptUpdateSettings(name);
							script__settings[name][e.target.name] = Number(e.target.value);
							localStorage.setItem('script__settings', JSON.stringify(script__settings));
						});
					});
				});
			}
		});
	}
	if (type == 'friends') {
		document.querySelectorAll('.friends_user_row').forEach((item, x) => {
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
				if (document.querySelector(`.friends_user_row + .script__ [script__${u_id}]`) == null) {
					item.insertAdjacentHTML('afterend', `<div class="script__" friends style="display: none;"><div class="script__body" script__${u_id}></div></div>`);
				}
				item.querySelector('.friends_user_info > div').insertAdjacentHTML('afterend', `<div style="display: table-cell;" class="friends_lists clear_fix" script__id__${name}><span id="script__${name}__${u_id}" class="friends_lists_group group2" style="background-color: #faead8; color: #764f14">${text}</span></div>`);
				document.querySelector(`#script__${name}__${u_id}`).addEventListener('click', async function() {
					if (this.getAttribute('disabled') == null) {
						this.setAttribute('disabled', '');
						document.querySelector(`[script__${u_id}]`).parentElement.removeAttribute('style');
						await ScriptProfileLoad(name, my_id, u_id);
						this.removeAttribute('disabled');
					}
				}, false);
			}
		});
	}
}