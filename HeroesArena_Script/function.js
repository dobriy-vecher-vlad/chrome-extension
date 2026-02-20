const x2js = new X2JS();
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
		if (data?.data) data = data.data;
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
		_3: true,
		_4: 1,
		_5: true,
		_6: true,
		_7: true,
		_8: 1,
		_9: true
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
						const interval = setInterval(async() => {
							try {
								let from = Number(/window\.vk.*?id: (\d+),/gms.exec(document.documentElement.innerHTML)[1]);
								let to = Number(/window\.cur.*?\[\{"id":(\d+),/gms.exec(document.documentElement.innerHTML)[1]);
								clearInterval(interval);
								document.querySelector('.script__body').setAttribute(`script__${to}`, '');
								await ScriptProfileLoad(name, from, to);
								tab.removeAttribute('disabled');
							} catch (error) {
								console.error(error);
							}
						}, 1000);
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
				const interval = setInterval(async() => {
					try {
						let my_id = Number(/window\.vk.*?id: (\d+),/gms.exec(document.documentElement.innerHTML)[1]);
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
									console.error(item, error);
								}
							}
						}
						clearInterval(interval);
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
					} catch (error) {
						console.error(error);
					}
				}, 1000);
			}
		}
	}
};