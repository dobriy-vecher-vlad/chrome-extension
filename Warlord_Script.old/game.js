let ScriptName = "warlord";
let ScriptTitle = "Warlord";
let ScriptVersion = "2.3.1";
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
		const builder = (body) => {
			content_id++;
			return `
				<div class="__container">
					<input type="checkbox" id="${name}_${content_id}_${u_id}" ${content_id!==1?'checked':''}/>
					<label class="__title" for="${name}_${content_id}_${u_id}">${body.title}</label>
					<div class="__items">
						${body.cards.map(item => `<div class="__item" ${item.hint == false ? '' : 'hint="'+item.hint+'"'} ${item.style == false ? '' : 'style="'+item.style+'"'}><div class="__text">${item.text}</div><div class="__title">${item.title}</div></div>`).join('')}
					</div>
				</div>
			`;
		};
		const banners = (body) => `<div class="__item" ${body.background !== false ? 'style="background-image: url('+body.background+');"' : ''}>${body.text}</div>`;
		const fight_slot = (body) => `<a href="http://vk.com/id${body.id}" target="_blank" class="__slot" ${body.type}><span>${body.n}</span><span>${body.id}</span><span>${body.name}</span><span>${body.dmg}</span></a>`;
		if (name == ScriptName) {
			script_body.firstChild.innerText = '\n\nВыбираем сервер игры';
			let server = await getData('xml', `https://tmp1-fb.geronimo.su/gameHub/index.php?api_uid=${uID}&api_type=vk`);
			let server_more = [];
			if (server == null) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при выборе сервера игры</div>`;
				return;
			} else {
				for (let item of server.s) {
					if (Number(item._uid) !== 0 && Number(item._id) !== script__settings[name]._9) {
						server_more.push(item);
					}
				}
				server = server.s[script__settings[name]._9-1];
			}
			if (Number(server?._uid) == 0) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Персонаж не зарегистрирован в игре</div>${server_more.map((item) => `<div class="script__text banners__"><div class="__item">Имеет аккаунт на сервере ${item._n}<br>${item._un}, ${item._ulvl} уровень</div></div>`).join('')}`;
				return;
			}
			script_body.firstChild.innerText = '\n\nПолучаем статусы игроков';
			let status = await getData('json', `https://dobriy-vecher-vlad.github.io/warlord/wl_status.json?${+new Date}`);
			if (!status) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при получении данных статусов</div>`;
				return;
			} else if (status.statusBLOCK.includes(my_id)) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Для Вас доступ к скрипту ограничен</div>`;
				return;
			} else if (status.statuses[script__settings[name]._9-1].statusINVISIBLE.includes(u_id) && my_id != u_id && !status.statuses[script__settings[name]._9-1].scriptADMIN.includes(my_id)) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Информация пользователя скрыта</div>`;
				return;
			} else {
				script_body.firstChild.innerText = '\n\nПолучаем информацию игрока';
				let profile = await getFakeData('xml', `https://${server._url}udata.php?user=${uID}`);
				if (/зарегистрирован/.exec(profile)) {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Персонаж не зарегистрирован в игре</div>`;
					return;
				} if (profile === null) {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных персонажа</div>`;
					return;
				} else {
					let clan = 0;
					if (profile.u._clan_id !== '0' && (script__settings[name]._2 || script__settings[name]._3 || script__settings[name]._4 || script__settings[name]._5 || script__settings[name]._11)) {
						script_body.firstChild.innerText = '\n\nПолучаем информацию гильдии';
						clan = await getData('xml', `https://${server._url}game.php?api_uid=${status.clan_id}&UID=${status.clan_id}&api_type=vk&api_id=${status.api_id}&auth_key=${status.clan_auth}&i=49&t1=${profile.u._clan_id}`);
						if (clan?.clan) {
							clan = clan.clan;
							typeof clan.mmbrs.u.length == 'undefined' ? clan.mmbrs.u = [clan.mmbrs.u] : '';
							clan = {
								...clan,
								_leader: clan.mmbrs.u.find(user => Number(user._clan_r) == 1),
								mmbrs: clan.mmbrs.u,
							};
						} else {
							script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных гильдии</div>`;
							return;
						}
					}
					try {
						fight = profile.fight;
						profile = profile.u;
						status.statuses[script__settings[name]._9-1]['scriptUPDATE'] = status.scriptUPDATE;
						status = status.statuses[script__settings[name]._9-1];
						let profile_id = Number(u_id);
						let profile_name_bad = 'Я - Клоун';
						let profile_name = (status.nickBLOCK.includes(profile_id) ? profile_name_bad : typeof status.nickCUSTOM[profile_id] != 'undefined' ? status.nickCUSTOM[profile_id] : profile._name ? profile._name : `Player${profile._id}`).replace(/ /g, " ");
						let profile_hp = numberSpaces(Math.round((Number(profile._end) + Number(profile._endi)) * 15));
						let profile_dmg = numberSpaces(profile._dmgi);
						let profile_exp = numberSpaces(profile._exp);
						let profile_perk1 = numberSpaces(profile._s1);
						let profile_perk2 = numberSpaces(profile._s2);
						let profile_perk3 = numberSpaces(profile._s3);
						let profile_perk4 = numberSpaces(profile._s4);
						let profile_perk5 = numberSpaces(profile._end);
						let profile_days = numberSpaces(Math.round(Number(profile._bd) / 60 / 60 / 24));
						let profile_loc_array = ["Южный Риверфорт", "Риверфорт", "Северный Риверфорт", "Паучий лес", "Лесной отшельник", "Разбойничий лагерь", "Руины древнего форта", "Перевал мертвецов", "Заброшенная деревня", "Северный Растхельм", "Крепость Растхельма", "Южный Растхельм", "Форт Надежда", "Долина Тайн", "Мыс Буря Запада", "Город Шимерран", "Южный тракт", "Рыбацкая деревня", "Перешеек дракона", "Межводье", "Рыбацкая деревня", "Руины Мидгарда", "Пустыня безмолвия", "Оазис", "Город Гримдрифт", "Южная деревня", "Тёмный лес", "Руины отчаяния", "Ястребиный мыс", "Заброшенная тюрьма", "Гринвол", "Лесной перешеек", "Разделённое ущелье", "Серозимняя застава", "Захваченный порт", "Лесная дорога"];
						let profile_loc = profile_loc_array[profile._loc-1];
						let profile_room_array = ["Риверфорт", "Башня Растхельма", "Военный лагерь", "Пустынная застава", "Личные покои", "Пиратский корабль"];
						let profile_room = profile_room_array[profile._room-1];
						let profile_pet_array = ["Нет питомца", "Полярный Тигр", "Северный Волк", "Дух Воды", "Панда", "Грабоид"];
						let profile_pet = profile_pet_array[profile._pet];
						let profile_vip = profile._va == '0' ? "Отключён" : "Активирован";
						let profile_arena_point = numberSpaces(profile._ap);
						let profile_arena_league_array = ["Нет лиги", "Лига Новичков", "Лига Воинов I", "Лига Воинов II", "Лига Мастеров", "Лига Рыцарей", "Лига Чемпионов", "Тёмная Лига", "Кровавая Лига", "Легендарная Лига"];
						let profile_arena_league = profile_arena_league_array[profile._al];
						let profile_arena_chest = profile._a_c == '0' ? "собран" : "ID: " + profile._a_c;
						let profile_clan_name = profile._clan_id !== '0' ? clan !== 0 ? clan._name : profile._clan_id : "Нет гильдии";
						let profile_clan_rang_array = ["Лидер гильдии", "Генерал гильдии", "Офицер гильдии", "Ветеран гильдии", "Рядовой гильдии", "Рекрут гильдии"];
						let profile_clan_rang = profile._clan_id !== '0' ? profile_clan_rang_array[profile._clan_r-1] : 'нет';
						let profile_clan_days = profile._clan_id !== '0' ? numberSpaces(Math.floor(Number(profile._clan_d) / 60 / 60 / 24)) + ' дн.' : "нет";
						let profile_date = (ms = 0, format = 'big') => {
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
										'text': profile._lvl,
										'title': 'УРОВЕНЬ ИГРОКА',
										'hint': profile_exp+' опыта',
										'style': false
									}, {
										'text': profile_hp,
										'title': 'ЗДОРОВЬЕ ИГРОКА',
										'hint': false,
										'style': false
									}, {
										'text': profile_dmg,
										'title': 'УРОН ИГРОКА',
										'hint': false,
										'style': false
									}, {
										'text': profile_clan_name,
										'title': clan == 0 ? 'ID ГИЛЬДИИ' : 'ГИЛЬДИЯ',
										'hint': 'Ранг: '+profile_clan_rang+'\nСтаж: '+profile_clan_days,
										'style': false
									}
								]
							}, {
								'title': 'Навыки игрока',
								'cards': [
									{
										'text': profile_perk5,
										'title': 'ВЫНОСЛИВОСТЬ',
										'hint': false,
										'style': false
									}, {
										'text': profile_dmg,
										'title': 'УРОН',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk1,
										'title': 'СВИРЕПЫЙ УДАР',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk2,
										'title': 'БЛОК ЩИТОМ',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk3,
										'title': 'НЕВИДИМЫЙ УДАР',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk4,
										'title': 'МАСТЕР ЦЕЛИТЕЛЬ',
										'hint': false,
										'style': false
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
										'text': profile_room,
										'title': 'ИСПОЛЬЗУЕТ ФОН',
										'hint': false,
										'style': false
									}, {
										'text': profile_loc,
										'title': 'НАХОДИТСЯ В ЛОКАЦИИ',
										'hint': false,
										'style': false
									}, {
										'text': profile_pet,
										'title': 'АКТИВНЫЙ ПИТОМЕЦ',
										'hint': false,
										'style': false
									}, {
										'text': profile_vip,
										'title': 'ПРЕМИУМ СТАТУС',
										'hint': 'ID: '+profile._vi,
										'style': false
									}, {
										'text': profile_arena_point,
										'title': 'КУБКИ АРЕНЫ',
										'hint': false,
										'style': false
									}, {
										'text': profile_arena_league,
										'title': 'ЛИГА АРЕНЫ',
										'hint': 'Сундук за лигу: '+profile_arena_chest+'\nУровень лиги: '+profile._al+' из '+(profile_arena_league_array.length-1),
										'style': false
									}
								]
							}, {
								'title': 'Основная информация гильдии '+clan._name,
								'cards': [
									{
										'text': clan&&clan._leader?`<a href="http://vk.com/id${clan._leader._vkId}" target="_blank">${clan._leader._name == '' ? `Player${clan._leader._id}` : clan._leader._name}</a>`:'',
										'title': 'Лидер',
										'hint': false,
										'style': false
									}, {
										'text': clan._id,
										'title': 'ID гильдии',
										'hint': false,
										'style': false
									}, {
										'text': clan._lvl,
										'title': 'СУММАРНЫЙ УРОВЕНЬ',
										'hint': false,
										'style': false
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m1),
										'title': 'СЕРЕБРО В КАЗНЕ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m3),
										'title': 'ЗОЛОТО В КАЗНЕ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._mcnt+' / ' + (clan._u5 * 4 + 10),
										'title': 'СОСТАВ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': profile._clan_id > 0 ? clan.inv !== undefined ? typeof clan.inv.u.length == 'undefined' ? [clan.inv.u].length : clan.inv.u.length : 0 : 0,
										'title': 'ПРИГЛАШЕНИЙ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}
								]
							}, {
								'title': 'Состав гильдии '+clan._name
							}, {
								'title': 'События гильдии '+clan._name
							}, {
								'title': 'Пополнения гильдии '+clan._name
							}, {
								'title': 'Улучшения гильдии '+clan._name,
								'cards': [
									{
										'text': clan.bldngs && clan.bldngs.b[0]._lvl,
										'title': 'УРОВЕНЬ КРЕПОСТИ',
										'hint': false,
										'style': false
									}, {
										'text': clan.bldngs && clan.bldngs.b[1]._lvl,
										'title': 'УРОВЕНЬ КУЗНИЦЫ',
										'hint': false,
										'style': false
									}, {
										'text': clan.bldngs && clan.bldngs.b[2]._lvl,
										'title': 'УРОВЕНЬ АКАДЕМИИ',
										'hint': false,
										'style': false
									}, {
										'text': clan._u1,
										'title': 'Потом и кровью',
										'hint': (clan._u1 * 1)+' к максимальному запасу энергии',
										'style': false
									}, {
										'text': clan._u2,
										'title': 'Отдышался - в бой',
										'hint': (clan._u2 * 1)+' сек. к времени восстановления энергии',
										'style': false
									}, {
										'text': clan._u3,
										'title': 'Большие карманы',
										'hint': (clan._u3 * 1)+' к лимиту получения подарков от друзья',
										'style': false
									}, {
										'text': clan._u4,
										'title': 'Советы кузнеца',
										'hint': (clan._u4 * 1)+'% к шансу успешной заточки в кузнице',
										'style': false
									}, {
										'text': clan._u5,
										'title': 'Вместе сила',
										'hint': (clan._u5 * 4)+' места для людей в гильдии',
										'style': false
									}, {
										'text': clan._u6,
										'title': 'Опытный охотник',
										'hint': (clan._u6 * 5)+'% к опыту за победу над боссом',
										'style': false
									}, {
										'text': clan._wu1,
										'title': 'АТАКА СТРАЖИ',
										'hint': numberSpaces(clan._wu1 * 50 + 100)+' урон стражи',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._wu2,
										'title': 'ЗАЩИТА СТРАЖИ',
										'hint': numberSpaces(clan._wu2 * 5000 + 1000)+' здоровье стражи',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._wu3,
										'title': 'АТАКА ТАРАНА',
										'hint': numberSpaces(clan._wu3 * 50 + 100)+' урон тарана',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._wu4,
										'title': 'ЗАЩИТА ТАРАНА',
										'hint': numberSpaces(clan._wu4 * 5000 + 1000)+' здоровье тарана',
										'style': 'grid-column-start: span 3;'
									}
								]
							}
						];
						let html = `<div class="__body" ${name}>`;
						if (script__settings[name]._1 == true) {
							let bannersCode = '';
							status.scriptUPDATE != ScriptVersion ? bannersCode += banners({'background': false, 'text': `Вы используете неактуальную версию скрипта<br>Ваша версия: ${ScriptVersion}, актуальная: ${status.scriptUPDATE}`}) : '';
							status.Alert != 'off' ? bannersCode += banners({'background': false, 'text': status.Alert}) : '';
							for (let item of server_more) bannersCode += banners({'background': false, 'text': `Имеет аккаунт на сервере ${item._n}<br>${item._un}, ${item._ulvl} уровень`});
							status.statusRED.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MPz2R.gif', 'text': `<span style="color: #fff;">Имеет дело в суде<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							status.statusGREEN.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0H1.gif', 'text': `<span style="color: #fff;">Доверенное и подтверждённое лицо</span>`}) : '';
							status.statusORANGE.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0OL.gif', 'text': `<span style="color: #fff;">Имеет дело в суде, но претензии сняты<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							status.statusYELLOW.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0Wz.gif', 'text': `<span style="color: #fff;">Неадекватное поведение</span>`}) : '';
							typeof status.statusAnimate[u_id] != 'undefined' ? bannersCode += banners({'background': status.statusAnimate[u_id].href, 'text': status.statusAnimate[u_id].nick === true ? `<span style="${(status.statusAnimate[u_id].fontsize) ? 'font-size: '+status.statusAnimate[u_id].fontsize : ''}; ${(status.statusAnimate[u_id].fontfamily) ? 'font-family: '+status.statusAnimate[u_id].fontfamily : ''}; ${(status.statusAnimate[u_id].fontcolor) ? 'color: '+status.statusAnimate[u_id].fontcolor : ''};">${status.statusAnimate[u_id].text}</span>` : ''}) : '';
							typeof status.statusGUILD[profile._clan_id] != 'undefined' && !status.statusGUILD_ban.includes(u_id) ? bannersCode += banners({'background': status.statusGUILD[profile._clan_id], 'text': ''}) : '';
							bannersCode !== '' ? html += `<div class="__banners">${bannersCode}</div>` : '';
						}
						html += builder(structure[0]);
						if (profile._clan_id > 0 && (script__settings[name]._2 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan1_${u_id}" checked/><label class="__title" for="${name}_clan1_${u_id}">${structure[3].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация гильдии скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[3]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._11 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan5_${u_id}" checked/><label class="__title" for="${name}_clan5_${u_id}">${structure[7].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация гильдии скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[7]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._3 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[4].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация гильдии скрыта</div></div></div></div>`;
							} else {
								let html_1 = `<div class="__list">`;
								let clan_all_dmg = 0;
								let clan_all_hp = 0;
								let clan_all_lvl = 0;
								clan.mmbrs.sort((a, b) => Number(script__settings[name]._10) === 1 ?
									Number(b._clan_r) < Number(a._clan_r) ? 1 : -1 :
									Number(script__settings[name]._10) === 2 ?
									Number(b._dmgi) < Number(a._dmgi) ? -1 : 1 :
									Number(script__settings[name]._10) === 3 ?
									Number(b._end)+Number(b._endi) < Number(a._end)+Number(a._endi) ? -1 : 1 :
									Number(script__settings[name]._10) === 4 ?
									Number(b._l_t) < Number(a._l_t) ? 1 : -1 :
									Number(b._clan_r) < Number(a._clan_r) ? 1 : -1
								);
								for (let [x, item] of clan.mmbrs.entries()) {
									clan_all_dmg += Number(item._dmgi);
									clan_all_hp += (Number(item._end) + Number(item._endi)) * 15;
									clan_all_lvl += Number(item._lvl);
									html_1 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title"><a href="http://vk.com/id${item._vkId}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a></div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${profile_clan_rang_array[item._clan_r-1]}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${numberSpaces(Math.round((Number(item._end) + Number(item._endi)) * 15))}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${numberSpaces(item._dmgi)}</div></div>
										<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${profile_date(item._l_t, 'big')}</div></div>
									`;
								}
								html_1 += `</div>`;
								html += `
									<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[4].title}</label><div class="__items">
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${clan._mcnt} / ${clan._u5 * 4 + 10}</div><div class="__title">СОСТАВ</div></div>
									<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_lvl)} суммарный уровень"><div class="__text">${numberSpaces(Math.floor(clan_all_lvl/clan.mmbrs.length))}</div><div class="__title">СРЕДНИЙ УРОВЕНЬ</div></div>
									<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_hp)} суммарное здоровье"><div class="__text">${numberSpaces(Math.floor(clan_all_hp/clan.mmbrs.length))}</div><div class="__title">СРЕДНЕЕ ЗДОРОВЬЕ</div></div>
									<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_dmg)} суммарный урон"><div class="__text">${numberSpaces(Math.floor(clan_all_dmg/clan.mmbrs.length))}</div><div class="__title">СРЕДНИЙ УРОН</div></div>
									${html_1}
								`;
								html += `</div></div>`;
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._4 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan3_${u_id}" checked/><label class="__title" for="${name}_clan3_${u_id}">${structure[5].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация гильдии скрыта</div></div></div></div>`;
							} else {
								let html_2 = `<div class="__list">`;
								clan.hist == undefined ? clan.hist = {h: []} : '';
								typeof clan.hist.h.length == 'undefined' ? clan.hist.h = [clan.hist.h] : '';
								let data_hist = [];
								for (let [x, item] of clan.hist.h.entries()) {
									if (item._t == 0) {
										data_hist.push([item._d, `Новый участник гильдии <a href="http://vk.com/id${item._v1}" target="_blank">Player${item._v1}</a>`]);
									}
									if (item._t == 4) {
										data_hist.push([item._d, `Создание гильдии`]);
									}
									if (item._t == 17) {
										data_hist.push([item._d, `Улучшение ${['Крепости', 'Кузницы', 'Академии'][item._v2-1]} до ${item._v3} уровня`]);
									}
									if (item._t == 18) {
										data_hist.push([item._d, `${item._v3 == 0 ? 'Безуспешный набег' : 'Успешный набег'} на ${item._v4}`]);
									}
									if (item._t == 19) {
										data_hist.push([item._d, `${item._v3 == 0 ? 'Успешная оборона от гильдии' : 'Оборона пробита гильдией'} ${item._v4}`]);
									}
									if (item._t == 23) {
										data_hist.push([item._d, `Попытка убить рейд-босса ${
											item._v2 == 465 ? 'Сартана' : 
											item._v2 == 454 ? 'Зачарованное Древо' : 
											item._v2 == 342 ? 'Кровавый Молох' : 
											item._v2 == 286 ? 'Древо Страж' : 
											item._v2 == 285 ? 'Ассасин' : 
											item._v2 == 284 ? 'Главарь Скелетов' : 
											item._v2 == 287 ? 'Северный Гоблин' : 'Неизвестно'
										}`]);
									}
								}
								data_hist.map((item, x) => {
									html_2 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${item[0]}</div></div>
										<div class="__item" style="grid-column-start: span 9;"><div class="__title">${item[1]}</div></div>
									`;
								});
								html_2 += `</div>`;
								html += `<div class="__container"><input type="checkbox" id="${name}_clan3_${u_id}" checked/><label class="__title" for="${name}_clan3_${u_id}">${structure[5].title}</label><div class="__items">${html_2}</div></div>`;
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._5 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan4_${u_id}" checked/><label class="__title" for="${name}_clan4_${u_id}">${structure[6].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация гильдии скрыта</div></div></div></div>`;
							} else {
								clan.info1 == undefined ? clan.info1 = {c: []} : '';
								typeof clan.info1.c.length == 'undefined' ? clan.info1.c = [clan.info1.c] : '';
								clan.info7 == undefined ? clan.info7 = {c: []} : '';
								typeof clan.info7.c.length == 'undefined' ? clan.info7.c = [clan.info7.c] : '';

								clan.info1.c.map((item, x) => {
									let user = clan.mmbrs.find(x => Number(x._id) === Number(item._id));
									if (user) {
										item._id = user._vkId;
										item._name = user._name;
									}
								});
								clan.info7.c.map((item, x) => {
									let user = clan.mmbrs.find(x => Number(x._id) === Number(item._id));
									if (user) {
										item._id = user._vkId;
										item._name = user._name;
									}
								});

								let clan_treasury_day_m1 = clan.info1.c.filter(x => x._t == 1);
								let clan_treasury_day_m3 = clan.info1.c.filter(x => x._t == 3);
								let clan_treasury_week_m1 = clan.info7.c.filter(x => x._t == 1);
								let clan_treasury_week_m3 = clan.info7.c.filter(x => x._t == 3);
								let getUserTreasury = (array) => {
									let user = array.length !== 0 ? array.reduce((x, y) => Number(x._v) > Number(y._v) ? x : y) : {_id: 0, _name: null, _v: 0};
									return [user._id, user._name, user._v];
								};
								let clan_treasury = {
									m1: [0, 0],
									m3: [0, 0],
									day_top: [getUserTreasury(clan_treasury_day_m1), getUserTreasury(clan_treasury_day_m3)],
									week_top: [getUserTreasury(clan_treasury_week_m1), getUserTreasury(clan_treasury_week_m3)]
								};
								let html_3 = `<div class="__list">`;
								clan.info1.c.sort((a, b) => b._t - a._t || b._v - a._v);
								for (let [x, item] of clan.info1.c.entries()) {
									item._t == 1 ? clan_treasury.m1[0] += Number(item._v) : clan_treasury.m3[0] += Number(item._v);
									html_3 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 8;"><div class="__title"><a href="http://vk.com/id${item._id}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a> пополнил казну ${item._t == 1 ? 'серебром' : 'золотом'}</div></div>
										<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${numberSpaces(item._v)} ${item._t == 1 ? 'серебра' : 'золота'}</div></div>
									`;
								}
								html_3 += `</div>`;
								let html_4 = `<div class="__list">`;
								clan.info7.c.sort((a, b) => b._t - a._t || b._v - a._v);
								for (let [x, item] of clan.info7.c.entries()) {
									item._t == 1 ? clan_treasury.m1[1] += Number(item._v) : clan_treasury.m3[1] += Number(item._v);
									html_4 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 8;"><div class="__title"><a href="http://vk.com/id${item._id}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a> пополнил казну ${item._t == 1 ? 'серебром' : 'золотом'}</div></div>
										<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${numberSpaces(item._v)} ${item._t == 1 ? 'серебра' : 'золота'}</div></div>
									`;
								}
								html_4 += `</div>`;
								html += `
									<div class="__container"><input type="checkbox" id="${name}_clan4_${u_id}" checked/><label class="__title" for="${name}_clan4_${u_id}">${structure[6].title}</label>
										<div class="__items">
											${clan.info1.c.length !== 0 ? `<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m1[0])}</div><div class="__title">СЕРЕБРА ЗА ДЕНЬ</div></div>
											<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m3[0])}</div><div class="__title">ЗОЛОТА ЗА ДЕНЬ</div></div>
											${clan_treasury.day_top[0][1] ? 
												`<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.day_top[0][2])} серебра"><div class="__text"><a href="http://vk.com/id${clan_treasury.day_top[0][0]}" target="_blank">${clan_treasury.day_top[0][1]}</a></div><div class="__title">ВНЁС СЕРЕБРА БОЛЬШЕ ВСЕХ</div></div>` : 
												`<div class="__item" style="grid-column-start: span 3;"><div class="__text"></div><div class="__title"></div></div>`
											}
											${clan_treasury.day_top[1][1] ? 
												`<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.day_top[1][2])} золота"><div class="__text"><a href="http://vk.com/id${clan_treasury.day_top[1][0]}" target="_blank">${clan_treasury.day_top[1][1]}</a></div><div class="__title">ВНЁС ЗОЛОТА БОЛЬШЕ ВСЕХ</div></div>` : 
												`<div class="__item" style="grid-column-start: span 3;"><div class="__text"></div><div class="__title"></div></div>`
											}
											${html_3}` : '<div class="__item" style="grid-column-start: span 12;"><div class="__hint">Нет пополнений за текущий день</div></div>'}
											${clan.info7.c.length !== 0 ? `<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m1[1])}</div><div class="__title">СЕРЕБРА ЗА НЕДЕЛЮ</div></div>
											<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m3[1])}</div><div class="__title">ЗОЛОТА ЗА НЕДЕЛЮ</div></div>
											${clan_treasury.week_top[0][1] ? 
												`<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.week_top[0][2])} серебра"><div class="__text"><a href="http://vk.com/id${clan_treasury.week_top[0][0]}" target="_blank">${clan_treasury.week_top[0][1]}</a></div><div class="__title">ВНЁС СЕРЕБРА БОЛЬШЕ ВСЕХ</div></div>` : 
												`<div class="__item" style="grid-column-start: span 3;"><div class="__text"></div><div class="__title"></div></div>`
											}
											${clan_treasury.week_top[0][1] ? 
												`<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.week_top[1][2])} золота"><div class="__text"><a href="http://vk.com/id${clan_treasury.week_top[1][0]}" target="_blank">${clan_treasury.week_top[1][1]}</a></div><div class="__title">ВНЁС ЗОЛОТА БОЛЬШЕ ВСЕХ</div></div>` : 
												`<div class="__item" style="grid-column-start: span 3;"><div class="__text"></div><div class="__title"></div></div>`
											}
											${html_4}` : '<div class="__item" style="grid-column-start: span 12;"><div class="__hint">Нет пополнений за текущую неделю</div></div>'}
										</div>
									</div>
								`;
							}
						}
						script__settings[name]._6 == true ? html += builder(structure[1]) : '';
						script__settings[name]._7 == true ? html += builder(structure[2]) : '';
						if (fight && (script__settings[name]._8 == true)) {
							typeof fight.users.length == 'undefined' ? fight.users = [fight.users] : '';
							let fight_boss_id = Number(fight._eid);
							let fight_boss_link = fight_boss_id;
							let fight_boss_name = fight._dmg == 0 ? 'Арена / Набег' : fight._name;
							let fight_boss_hp = numberSpaces(fight._hp);
							let fight_boss_hpMax = numberSpaces(fight._mhp);
							let fight_boss_dmg = numberSpaces(fight._dmg);
							let fight_creator_id = Number(fight.users[0]._vkId);
							let fight_creator_name = (status.nickBLOCK.includes(fight_creator_id) ? profile_name_bad : typeof status.nickCUSTOM[fight_creator_id] != 'undefined' ? status.nickCUSTOM[fight_creator_id] : fight.users[0]._n ? fight.users[0]._n : `Player${fight.users[0]._id}`).replace(/ /g, " ");
							let fight_id = numberSpaces(fight._fid);
							let fight_limit = fight_boss_id == 291 ? 175 : 300;
							let fight_myDmg = typeof (fight.users.find(x => Number(x._vkId) === u_id)) == 'undefined' ? 0 : numberSpaces(fight.users.find(x => Number(x._vkId) === u_id)._dd);
							let fight_procent = fight._hp > 0 ? Math.round(fight._hp / (fight._mhp / 100)) + '%' : 'убит';
							let fight_time = fight._time < 7200 ? (new Date((7200 - fight._time) * 1000)).toUTCString().split(' ')[4] : '00:00:00';
							html += `
								<div class="__container"><input type="checkbox" id="${name}_fight_${u_id}"/><label class="__title" for="${name}_fight_${u_id}">Информация по боссу ${fight_boss_name}</label>
									<div class="__items">
										<div class="__item __fight" style="grid-column-start: span 12;" hint="Имя босса: ${fight_boss_name}, ID: ${fight_boss_link}\nЗдоровье: ${fight_boss_hpMax}, урон: ${fight_boss_dmg}\n\nСоздатель боя: ${fight_creator_name}, ID: ${fight_creator_id}\nПорядковый номер боя: ${fight_id}\nЛюдей на боссе: ${fight.users.length} / ${fight_limit}">
											<div class="__text">
												Босс <b>${fight_boss_name}</b> до конца боя осталось <b>${fight_time}</b><br>
												Здоровье <b>${fight_boss_hp}</b> / <b>${fight_boss_hpMax}</b> ${fight_procent}<br>
												Урон игрока <b>${fight_myDmg}</b>
											</div>
										</div>
										<div class="__item __fight" style="grid-area: 2 / 2 / 2 / 12;">
							`;
							fight.users.sort((a, b) => Number(a._dd) < Number(b._dd) ? 1 : -1);
							for (let [x, item] of fight.users.entries()) {
								let id = Number(item._vkId);
								html += fight_slot({type: status.statusRED.includes(id) ? 'jail' : id == fight_creator_id && id == u_id ? 'all' : id == fight_creator_id && id != u_id ? 'creator' : id != fight_creator_id && id == u_id ? 'viewing' : 'common', n: x+1, id: id, name: (status.nickBLOCK.includes(id) ? profile_name_bad : typeof status.nickCUSTOM[id] != 'undefined' ? status.nickCUSTOM[id] : item._n ? item._n : `Player${item.id}`).replace(/ /g, " "), dmg: numberSpaces(item._dd)});
							}
							html += '</div></div></div>';
						}
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