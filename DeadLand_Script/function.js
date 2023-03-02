const x2js = new X2JS();
const numberSpaces = (number, symbol = ' ') => Number.isInteger(Number(number)) ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol) : null;
const log = (title) => console.log(`[${new Date().toLocaleTimeString()}] — [${ScriptName}] — ${title}`);
const ScriptRun = (type) => {
	if (type == 'event' && document.querySelector('#page_body')) {
		log('Script run Mutation event.');
		document.querySelector('#page_body').addEventListener('DOMNodeInserted', (event) => {
			if (event.relatedNode.id == 'wrap3' || event.relatedNode.id == 'list_content' || event.relatedNode.querySelector('.Profile__column')) ScriptRun('load');
		}, false);
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
		if (data?.data) data = data.data;
		return data;
	} catch (error) {
		log(error);
		return null;
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
		_3: true,
		_4: false,
		_5: 1
	};
	localStorage.setItem('script__settings', JSON.stringify(script__settings));
	return script__settings;
}
const ScriptLoad = async(type, name, text, version) => {
	if (type == 'page') {
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
						let my_id = /id: (.*),/gim.exec(document.documentElement.innerHTML)[1];
						let u_id = 0;
						try {
							if (isNew) {
								try {
									u_id = await (await fetch(window.location.href)).text();
									try {
										u_id = Number(/ProfileWrapper.*?data-exec.*?(\d+).*?hashes/gim.exec(u_id)[1]);
									} catch (error) {
										try {
											u_id = Number(/ownerId":(\d+).*?,/gim.exec(u_id)[1]);
										} catch (error) {
											try {
												u_id = Number(/user_id":(\d+).*?,"/gim.exec(u_id)[1]);
											} catch (error) {
												u_id = Number(/"loc":"\?id=(\d+).*?"/gim.exec(u_id)[1]);
											}
										}
									}
								} catch (error) {
									u_id = document.querySelector('[data-task-click="ProfileAction/abuse"]').getAttribute('data-user_id');
								}
							} else u_id = document.querySelector('[data-task-click="ProfileAction/abuse"]').getAttribute('data-user_id');
						} catch (error) {
							if (document.querySelector('.profile_deleted_text > br') !== null) {
								try {
									let vk = await getData('json', `https://api.vk.com/method/utils.resolveScreenName?screen_name=${location.pathname.slice(1)}&access_token=27af1df427af1df427af1df46e27c552ac227af27af1df47b67845e29d5bbda714938b8&v=5.131`);
									u_id = vk.response.object_id;
								} catch (error) {
									u_id = my_id;
								}
							} else u_id = my_id;
						}
						document.querySelector('.script__body').setAttribute(`script__${u_id}`, '');
						await ScriptProfileLoad(name, my_id, u_id);
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
										<input type="checkbox" id="_3" ${script__settings[name]._3 == true ? 'checked' : ''}><label for="_3">Информация клана<span>Блок с информацией клана пользователя</span></label>
										<input type="checkbox" id="_4" ${script__settings[name]._4 == true ? 'checked' : ''}><label for="_4">Состав клана<span>Блок с составом клана пользователя</span></label>
										<input type="checkbox" id="_2" ${script__settings[name]._2 == true ? 'checked' : ''}><label for="_2">Характеристики игрока<span>Блок с характеристиками пользователя</span></label>
									</div>
								</div>
								<div class="settings__body">
									<div data-text='Сортировка состава'>
										<input name="_5" type="radio" id="_5_1" value="1" ${script__settings[name]._5 == 1 ? 'checked' : ''}><label for="_5_1">Ранг<span>От командира до новичка</span></label>
										<input name="_5" type="radio" id="_5_3" value="3" ${script__settings[name]._5 == 3 ? 'checked' : ''}><label for="_5_3">Здоровье<span>От большего к меньшему</span></label>
										<input name="_5" type="radio" id="_5_2" value="2" ${script__settings[name]._5 == 2 ? 'checked' : ''}><label for="_5_2">Урон<span>От большего к меньшему</span></label>
										<input name="_5" type="radio" id="_5_4" value="4" ${script__settings[name]._5 == 4 ? 'checked' : ''}><label for="_5_4">Дата входа<span>От новой к старой</span></label>
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
			isNew = document.querySelector('.Profile__column');
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