let ScriptName = "deadland";
let ScriptTitle = "DeadLand";
let ScriptVersion = "1.1.5";
let isNew = false;
ScriptRun('event');
ScriptRun('load');

const ScriptProfileLoad = async(name, myID, uID) => {
	log(`Script try load user: ${uID}.`);
	let script_body = document.querySelector(`.script__body[script__${uID}]`);
	try {
		script_body.firstChild.innerText = '\n\nОбновляем настройки скрипта';
		let script_ = script_body.parentElement;
		let script__settings = ScriptUpdateSettings(name);
		script__settings._1 == true ? script_.setAttribute('_1', '') : script_.removeAttribute('_1');
		script__settings._2 == true ? script_.setAttribute('_2', '') : script_.removeAttribute('_2');
		script__settings._3 == true ? script_.setAttribute('_3', '') : script_.removeAttribute('_3');
		let my_id = Number(myID);
		let u_id = Number(uID);
		let content_id = 0;
		function builder(body) {
			let code = '';
			code += `<div class="__container"><input type="checkbox" id="${name}_${content_id}_${u_id}" ${content_id!==0?'checked':''}/><label class="__title" for="${name}_${content_id}_${u_id}">${body.title}</label><div class="__items">`;
				body.cards.forEach((item) => {
					code += `<div class="__item" ${item.hint == false ? '' : 'hint="'+item.hint+'"'} ${item.style == false ? '' : 'style="'+item.style+'"'}><div class="__text">${item.text}</div><div class="__title">${item.title}</div></div>`;
				});
			code += `</div></div>`;
			content_id += 1;
			return code;
		}
		function banners(body) {
			let code = `<div class="__item" ${body.background !== false ? 'style="background-image: url('+body.background+');"' : ''}>${body.text}</div>`;
			return code;
		}
		if (name == ScriptName) {
			script_body.firstChild.innerText = '\n\nПолучаем статусы игроков';
			let status = await getData('json', `https://dobriy-vecher-vlad.github.io/warlord/dl_status.json?${uID}`);
			if (!status) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при получении данных статусов</div>`;
				return;
			} else if (status.statusBLOCK.includes(my_id)) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Для Вас доступ к скрипту ограничен</div>`;
				return;
			} else if (status.statusINVISIBLE.includes(u_id) && my_id != u_id && !status.scriptADMIN.includes(my_id)) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Информация пользователя скрыта</div>`;
				return;
			} else {
				script_body.firstChild.innerText = '\n\nПолучаем информацию игрока';
				let profile = await getData('xml', `https://backup5.geronimo.su/vk_deadland/game.php?api_uid=${status.api_vk_id}&api_type=vk&api_id=${status.api_id}&auth_key=${status.api_vk_auth_key}&f_data=<data><u>${uID}</u></data>&i=7&UID=${status.api_vk_uid}`);
				if (profile === '') {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Персонаж не зарегистрирован в игре</div>`;
					return;
				} if (profile === null) {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных персонажа</div>`;
					return;
				} else {
					let clan = 0;
					if (profile.u._clan_id !== '0' && (script__settings[name]._3 || script__settings[name]._4)) {
						script_body.firstChild.innerText = '\n\nПолучаем информацию клана';
						clan = await fetch(`https://backup5.geronimo.su/vk_deadland/data_clan.php?id=${profile.u._clan_id}`);
						clan = await x2js.xml_str2json(`<data>${await clan.text()}</data>`);
						if (clan && clan.data && clan.data.clan) {
							typeof clan.data.clanmmbrs.u.length == 'undefined' ? clan.data.clanmmbrs.u = [clan.data.clanmmbrs.u] : '';
							clan = {
								...clan.data.clan,
								_leader: clan.data.clanmmbrs.u.find(user => Number(user._clan_r) == 1),
								_members: clan.data.clanmmbrs.u
							};
						} else {
							script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных клана</div>`;
							return;
						}
					}
					try {
						profile = profile.u;
						let profile_id = Number(u_id);
						let profile_name_bad = 'Я - Клоун';
						let profile_name = (status.nickBLOCK.includes(profile_id) ? profile_name_bad : typeof status.nickCUSTOM[profile_id] != 'undefined' ? status.nickCUSTOM[profile_id] : profile._name ? profile._name : `Player${profile._id}`).replace(/ /g, " ");
						let profile_hp = numberSpaces(profile._hp);
						let profile_dmg = numberSpaces(profile._dmg);
						let profile_def = numberSpaces(profile._def);
						let profile_exp = numberSpaces(profile._exp);
						let profile_days = numberSpaces(Math.round(Number(profile._bd) / 60 / 60 / 24));
						let profile_loc_array = [{"id":"1","name":"Поселение Найтстоун","ds":"Безопасная зона."},{"id":"2","name":"Карантинная зона","ds":"Карантинная зона"},{"id":"3","name":"Закусочная Амелия","ds":"Безопасная зона. "},{"id":"4","name":"Военная база","ds":""},{"id":"35","name":"Тайник выжившего","ds":"Опасность: Очень низкая"},{"id":"38","name":"Место привала","ds":"Опасность: Низкая"},{"id":"39","name":"Разрушенный мост","ds":""},{"id":"40","name":"Шоссе 85","ds":"Опасность: Средняя"},{"id":"41","name":"Пляж","ds":"Опасность: Средняя"},{"id":"42","name":"Берег","ds":"Опасность: Высокая"},{"id":"43","name":"Большой лагерь выживших","ds":"Опасность: Средняя"},{"id":"44","name":"Место крушения","ds":"Опасность: Очень высокая"},{"id":"45","name":"Блокпост на дороге","ds":"Опасность: Очень высокая"},{"id":"46","name":"Гуманитарный груз","ds":"Опасность: Очень высокая"},{"id":"51","name":"Гуманитарный груз","ds":"Опасность: Высокая"},{"id":"52","name":"Сломанные автомобили","ds":"Опасность: Средняя"},{"id":"53","name":"Шоссе 66","ds":"Опасность: Средняя"},{"id":"54","name":"Автотрасса","ds":"Опасность: Средняя"},{"id":"55","name":"Затор на автотрассе","ds":"Опасность: Высокая"},{"id":"56","name":"Лагерь наемников","ds":"Опасность: Высокая"},{"id":"58","name":"Палаточный лагерь","ds":"Опасность: Средняя"},{"id":"59","name":"Место крушения","ds":"Опасность: Высокая"},{"id":"60","name":"Лагерь мародеров","ds":"Опасность: Средняя"},{"id":"61","name":"Брошенный лагерь","ds":"Опасность: Низкая"},{"id":"62","name":"Стоянка выжившего","ds":"Опасность: Низкая"},{"id":"63","name":"Тайник мародеров","ds":"Опасность: Средняя"},{"id":"64","name":"Дорога","ds":"Опасность: Средняя"},{"id":"65","name":"Лагерь выживших","ds":"Опасность: Высокая"},{"id":"66","name":"Бухта","ds":"Опасность: Высокая"},{"id":"67","name":"Прибрежье","ds":"Опасность: Низкая"},{"id":"68","name":"Место привала байкеров","ds":"Опасность: Низкая"},{"id":"69","name":"Свалка фургонов","ds":"Опасность: Средняя"},{"id":"70","name":"Странное место","ds":"Опасность: Низкая"},{"id":"71","name":"Лесная поляна","ds":"Опасность: Низкая"},{"id":"72","name":"Оставленный транспорт","ds":"Опасность: Средняя"},{"id":"73","name":"Крупный лагерь","ds":"Опасность: Высокая"},{"id":"74","name":"Тайник с провизией","ds":"Опасность: Низкая"},{"id":"75","name":"Тайник с ресурсами","ds":"Опасность: Средняя"},{"id":"76","name":"Тайник мародера","ds":"Опасность: Высокая"},{"id":"77","name":"Армейский тайник","ds":"Опасность: Очень высокая"},{"id":"78","name":"Тайник с ресурсами","ds":"Опасность: Средняя"},{"id":"79","name":"Тайник мародера","ds":"Опасность: Высокая"},{"id":"80","name":"Тайник мародера","ds":"Опасность: Высокая"},{"id":"81","name":"Армейский тайник","ds":"Опасность: Очень высокая"},{"id":"82","name":"Армейский тайник","ds":"Опасность: Очень высокая"},{"id":"83","name":"Сломанная машина","ds":"Место, где Вам пришлось оставить свой автомобиль."},{"id":"84","name":"Армейский тайник","ds":"Особо опасный противник."},{"id":"85","name":"Роща","ds":"Опасность: Низкая"},{"id":"86","name":"Стоянка выжившего","ds":"Опасность: Низкая"},{"id":"87","name":"Лагерь выживших","ds":"Опасность: Низкая"},{"id":"88","name":"Брошенные дома","ds":"Опасность: Низкая"},{"id":"89","name":"Лесная поляна","ds":"Опасность: Низкая"},{"id":"90","name":"Прибрежье","ds":"Опасность: Низкая"},{"id":"91","name":"Брошенные автомобили","ds":"Опасность: Низкая"},{"id":"92","name":"Стоянка выжившего","ds":"Опасность: Низкая"},{"id":"93","name":"Затор на дороге","ds":"Опасность: Низкая"},{"id":"94","name":"Место привала","ds":"Опасность: Низкая"},{"id":"95","name":"Стоянка выжившего","ds":"Опасность: Низкая"},{"id":"96","name":"Прибрежье","ds":"Опасность: Низкая"},{"id":"97","name":"Пепелище","ds":"Опасность: Низкая"},{"id":"98","name":"Аванпост мародеров","ds":"Опасность: Низкая"},{"id":"99","name":"Блокпост мародеров","ds":"Опасность: Низкая"},{"id":"100","name":"Стоянка налетчиков","ds":"Опасность: Низкая"},{"id":"101","name":"Пустой переулок","ds":"Опасность: Низкая"},{"id":"102","name":"Гуманитарный груз","ds":"Опасность: Высокая"},{"id":"103","name":"Переулок","ds":"Опасность: Низкая"},{"id":"104","name":"Военный Блокпост","ds":"Опасность: Высокая"},{"id":"105","name":"Военный Лагерь","ds":"Опасность: Высокая"}];
						let profile_loc = profile_loc_array.find(x => Number(x.id) === Number(profile._loc));
						let profile_clan_name = profile._clan_id !== '0' ? clan !== 0 ? clan._name : profile._clan_id : "Нет клана";
						let profile_clan_rang_array = ["Командир клана", "Офицер клана", "Сержант клана", "Рядовой клана", "Новичок клана"];
						let profile_clan_rang = profile._clan_id !== '0' ? profile_clan_rang_array[profile._clan_r-1] : 'нет';
						let profile_clan_days = profile._clan_id !== '0' ? numberSpaces(Math.floor(Number(profile._clan_d) / 60 / 60 / 24)) + ' дн.' : "нет";
						let profile_date = function (ms = 0, format = 'big') {
							let date = new Date(new Date() - (Number(ms) * 1000));
							return format === 'big' ? date.toLocaleString("ru", {
								timezone: 'UTC',
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							}) : format === 'small' ? date.toLocaleString("ru", {
								timezone: 'UTC',
								hour: 'numeric',
								minute: 'numeric',
								second: 'numeric'
							}) : null;
						};
						let structure = [
							{
								'title': 'Основные характеристики игрока',
								'cards': [
									{
										'text': profile._id,
										'title': 'ID ИГРОВОГО ПРОФИЛЯ',
										'hint': 'ID: '+profile._id+'\nVK ID: '+profile._vkId+'\nOK ID: '+profile._okId+'\nFB ID: '+profile._fbId+'\nKG ID: '+profile._kgId+'\nEX ID: '+profile._exId+'\nGM ID: '+profile._gmId+'\nMM ID: '+profile._mmId+'\nMOB ID: '+profile._mobId+'\nRB ID: '+profile._rbId,
										'style': false
									}, {
										'text': profile_name,
										'title': 'ИГРОВОЙ НИК',
										'hint': false,
										'style': false
									}, {
										'text': profile_clan_name,
										'title': clan == 0 ? 'ID КЛАНА' : 'КЛАН',
										'hint': 'Ранг: '+profile_clan_rang+'\nСтаж: '+profile_clan_days,
										'style': false
									}, {
										'text': profile._lvl,
										'title': 'УРОВЕНЬ ИГРОКА',
										'hint': profile_exp+' опыта',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': profile_hp,
										'title': 'ЗДОРОВЬЕ ИГРОКА',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': profile_dmg,
										'title': 'УРОН ИГРОКА',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': profile_def,
										'title': 'ЗАЩИТА ИГРОКА',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}
								]
							}, {
								'title': 'Прочие характеристики игрока',
								'cards': [
									{
										'text': profile_days,
										'title': 'ДНЕЙ В ИГРЕ',
										'hint': false,
										'style': false
									}, {
										'text': profile_date(profile._bd, 'big'),
										'title': 'ПЕРВЫЙ ВХОД В ИГРУ',
										'hint': 'В '+profile_date(profile._bd, 'small'),
										'style': false
									}, {
										'text': profile_date(profile._l_t, 'big'),
										'title': 'ПОСЛЕДНИЙ ВХОД В ИГРУ',
										'hint': 'В '+profile_date(profile._l_t, 'small'),
										'style': false
									}, {
										'text': profile_loc.name,
										'title': 'НАХОДИТСЯ В ЛОКАЦИИ',
										'hint': `${profile_loc.ds}`,
										'style': 'grid-column-start: span 12;'
									}
								]
							}, {
								'title': 'Основная информация клана '+clan._name,
								'cards': [
									{
										'text': clan&&clan._leader?`<a href="http://vk.com/id${clan._leader._vkId}" target="_blank">${clan._leader._name == '' ? `Player${clan._leader._id}` : clan._leader._name}</a>`:'',
										'title': 'Глава',
										'hint': false,
										'style': false
									}, {
										'text': clan._id,
										'title': 'ID клана',
										'hint': false,
										'style': false
									}, {
										'text': clan._mmbrs+' / ' + 15,
										'title': 'СОСТАВ',
										'hint': false,
										'style': false
									}, {
										'text': clan._lvl,
										'title': 'УРОВЕНЬ',
										'hint': false,
										'style': false
									}, {
										'text': numberSpaces(clan._exp),
										'title': 'ОПЫТ',
										'hint': false,
										'style': false
									}, {
										'text': clan._invite == 1 ? 'По заявке' : 'Свободное',
										'title': 'Вступление',
										'hint': false,
										'style': false
									}
								]
							}, {
								'title': 'Состав клана '+clan._name
							}
						];
						let html = `<div class="__body" ${name}>`;
						if (script__settings[name]._1 == true) {
							let bannersCode = '';
							status.scriptUPDATE != ScriptVersion ? bannersCode += banners({'background': false, 'text': `Вы используете неактуальную версию скрипта<br>Ваша версия: ${ScriptVersion}, актуальная: ${status.scriptUPDATE}`}) : '';
							status.Alert != 'off' ? bannersCode += banners({'background': false, 'text': status.Alert}) : '';
							//status.statusRED.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Ntev.gif', 'text': `<span style="color: #fff;">Имеет дело в суде<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							//status.statusGREEN.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Nteu.gif', 'text': `<span style="color: #fff;">Доверенное и подтверждённое лицо</span>`}) : '';
							//status.statusORANGE.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Nteq.gif', 'text': `<span style="color: #fff;">Имеет дело в суде, но претензии сняты<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							//status.statusYELLOW.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Ntet.gif', 'text': `<span style="color: #fff;">Неадекватное поведение</span>`}) : '';
							typeof status.statusAnimate[u_id] != 'undefined' ? bannersCode += banners({'background': status.statusAnimate[u_id].href, 'text': status.statusAnimate[u_id].nick === true ? `<span style="${(status.statusAnimate[u_id].fontsize) ? 'font-size: '+status.statusAnimate[u_id].fontsize : ''}; ${(status.statusAnimate[u_id].fontfamily) ? 'font-family: '+status.statusAnimate[u_id].fontfamily : ''}; ${(status.statusAnimate[u_id].fontcolor) ? 'color: '+status.statusAnimate[u_id].fontcolor : ''};">${status.statusAnimate[u_id].text}</span>` : ''}) : '';
							typeof status.statusGUILD[profile._clan_id] != 'undefined' && !status.statusGUILD_ban.includes(u_id) ? bannersCode += banners({'background': status.statusGUILD[profile._clan_id], 'text': ''}) : '';
							bannersCode !== '' ? html += `<div class="__banners">${bannersCode}</div>` : '';
						}
						html += builder(structure[0]);
						if (profile._clan_id > 0 && (script__settings[name]._3 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan1_${u_id}" checked/><label class="__title" for="${name}_clan1_${u_id}">${structure[2].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[2]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._4 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[3].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								let html_1 = `<div class="__list">`;
								let clan_all_dmg = 0;
								let clan_all_hp = 0;
								let clan_all_lvl = 0;
								clan._members.sort(function(a, b) {
									return Number(script__settings[name]._5) === 1 ?
										Number(b._clan_r) < Number(a._clan_r) ? 1 : -1 :
										Number(script__settings[name]._5) === 2 ?
										Number(b._dmg) < Number(a._dmg) ? -1 : 1 :
										Number(script__settings[name]._5) === 3 ?
										Number(b._hp) < Number(a._hp) ? -1 : 1 :
										Number(script__settings[name]._5) === 4 ?
										Number(b._l_t) < Number(a._l_t) ? 1 : -1 :
										Number(b._clan_r) < Number(a._clan_r) ? 1 : -1
									;
								});
								clan._members.forEach((item, x) => {
									clan_all_dmg += Number(item._dmg);
									clan_all_hp += Number(item._hp);
									clan_all_lvl += Number(item._lvl);
									html_1 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title"><a href="http://vk.com/id${item._vkId}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a></div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${profile_clan_rang_array[item._clan_r-1]}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${numberSpaces(item._hp)}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${numberSpaces(item._dmg)}</div></div>
										<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${profile_date(item._l_t, 'big')}</div></div>
									`;
								});
								html_1 += `</div>`;
								html += `
									<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[3].title}</label><div class="__items">
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${clan._mmbrs} / 15</div><div class="__title">СОСТАВ</div></div>
									<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_lvl)} суммарный уровень"><div class="__text">${numberSpaces(Math.floor(clan_all_lvl/clan._mmbrs))}</div><div class="__title">СРЕДНИЙ УРОВЕНЬ</div></div>
									<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_hp)} суммарное здоровье"><div class="__text">${numberSpaces(Math.floor(clan_all_hp/clan._mmbrs))}</div><div class="__title">СРЕДНЕЕ ЗДОРОВЬЕ</div></div>
									<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_dmg)} суммарный урон"><div class="__text">${numberSpaces(Math.floor(clan_all_dmg/clan._mmbrs))}</div><div class="__title">СРЕДНИЙ УРОН</div></div>
									${html_1}
								`;
								html += `</div></div>`;
							}
						}
						script__settings[name]._2 == true ? html += builder(structure[1]) : '';
						html += `</div>`;
						script_body.innerHTML = html;
					} catch (error) {
						log(error);
						script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при обработке данных персонажа</div>`;
						return;
					}
				}
			}
		}
	} catch(error) {
		log(error);
		script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при обновлении настроек скрипта</div>`;
		return;
	}
};