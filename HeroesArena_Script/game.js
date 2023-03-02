let ScriptName = "heroesarena";
let ScriptTitle = "HeroesArena";
let ScriptVersion = "1.1.1";
let isNew = false;
ScriptRun('event');
ScriptRun('load');

async function ScriptProfileLoad(name, myID, uID) {
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
		function fight_slot(body) {
			let code = `<a href="http://vk.com/id${body.id}" target="_blank" class="__slot" ${body.type}><span>${body.n}</span><span>${body.id}</span><span>${body.name}</span><span>${body.dmg}</span></a>`;
			return code;
		}
		if (name == ScriptName) {
			script_body.firstChild.innerText = '\n\nПолучаем статусы игроков';
			let status = await getData('json', `https://dobriy-vecher-vlad.github.io/warlord/hs_status.json?${+new Date}`);
			if (!status) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при получении данных статусов</div>`;
				return;
			} else if (status.statusBLOCK.includes(my_id)) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Для Вас доступ к скрипту ограничен</div>`;
				return;
			} else if (status.statuses[script__settings[name]._4-1].statusINVISIBLE.includes(u_id) && my_id != u_id && !status.statuses[script__settings[name]._4-1].scriptADMIN.includes(my_id)) {
				script_body.innerHTML = `<div class="script__text error__"><br><br>Информация пользователя скрыта</div>`;
				return;
			} else {
				script_body.firstChild.innerText = '\n\nПолучаем номер игрока';
				let pid = await getDataChrome(`http://kahoxa.ru/games/rpg/heroes_arena/load.php`, `target=getTopFriends&uid=${status.uid}&uids=${uID}&page=0&countFriends=1&pid=0&auth_key=${status.auth_key}&site=vk&s=s${[script__settings[name]._4]}`);
				if (pid && pid.length && pid[0] && pid[0].id) {
					pid = Number(pid[0].id);
				} else {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Персонаж не зарегистрирован в игре</div>`;
					return;
				}
				script_body.firstChild.innerText = '\n\nПолучаем информацию игрока';
				let profile = await getDataChrome(`http://kahoxa.ru/games/rpg/heroes_arena/reg.php`, `target=updateInfo&uid=${status.uid}&pid=${pid}&auth_key=${status.auth_key}&site=vk&s=s1`);
				if (profile === null) {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных персонажа</div>`;
					return;
				} else {
					let clan = 0;
					if (profile.guild !== '0' && (script__settings[name]._6 || script__settings[name]._7 || script__settings[name]._9)) {
						script_body.firstChild.innerText = '\n\nПолучаем информацию гильдии';
						clan = await getDataChrome(`http://kahoxa.ru/games/rpg/heroes_arena/load.php`, `target=myGuild&uid=${status.uid}&pid=${pid}&gid=${profile.guild}&auth_key=${status.auth_key}&site=vk&s=s1`);
						if (clan && clan.members && clan.guild) {
							clan = {
								...clan.guild,
								leader: clan.members.find(user => Number(user.id) == Number(clan.guild.pid)),
								members: clan.members
							};
						} else {
							script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных гильдии</div>`;
							return;
						}
					}
					try {
						status.statuses[script__settings[name]._4-1]['scriptUPDATE'] = status.scriptUPDATE;
						status = status.statuses[script__settings[name]._4-1];
						let profile_id = Number(u_id);
						let profile_name_bad = 'Я - Клоун';
						let profile_name = (status.nickBLOCK.includes(profile_id) ? profile_name_bad : typeof status.nickCUSTOM[profile_id] != 'undefined' ? status.nickCUSTOM[profile_id] : profile.nickname ? profile.nickname : `Player${profile.id}`).replace(/ /g, " ");
						
						let profile_clan_name = profile.guild !== '0' ? clan !== 0 ? clan.name : profile.guild : "Нет гильдии";
						let profile_clan_rang = profile.guild !== '0' ? profile.guild_leader == '1' ? 'Лидер гильдии' : profile.guild_sub == '1' ? 'Генерал гильдии' : 'Рядовой гильдии' : 'нет';
						
						let hpSkill = 0;
						let defSkill = 1;
						let atkSkill = 1;
						if (Number(profile.rankSkill[1]) > 0) {
							hpSkill = Number(profile.rankSkill[1]) * 10 / 100 + 1;
							if (Number(profile.hp_max) == Number(profile.hp)) {
								profile.hp = Math.ceil(Number(profile.hp) * hpSkill);
							}
							profile.hp_max = Math.ceil(Number(profile.hp_max) * hpSkill);
						}
						if(Number(profile.rankSkill[2]) > 0) {
							defSkill = Number(profile.rankSkill[2])*10/100+1;
						}
						if(Number(profile.rankSkill[3]) > 0) {
							atkSkill = Number(profile.rankSkill[3])*10/100+1;
						}
						let atck = Math.round((Number(profile.attack)+Number(profile.atck_item))*atkSkill);
						let def = Math.round((Number(profile.defence)+Number(profile.def_item))*defSkill);

						let buff_hands = 0;
						let guild_bonus_atck = 0;
						let guild_bonus_def = 0;
						if (Number(profile.guild_lvl) > 0) {
							guild_bonus_atck = Math.ceil(Number(atck) * (Number(profile.guild_lvl) * 3 / 100));
							guild_bonus_def = Math.ceil(Number(def) * (Number(profile.guild_forge) * 3 / 100));
						}
						if (Number(profile.buff_hands) > 0) {
							buff_hands = Math.ceil(Number(atck) * 0.2);
						}
						atck = atck + guild_bonus_atck + buff_hands;
						def = def + guild_bonus_def;

						if (Number(profile.buff_eyes) > 0) {
							if (Number(profile.hp_max) == Number(profile.hp)) {
								profile.hp = Math.ceil(Number(profile.hp) * 1.2);
							}
							profile.hp_max = Math.ceil(Number(profile.hp_max) * 1.2);
						}

						let profile_date = function (ms = 0, format = 'big') {
							let date = new Date(Number(ms) * 1000);
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
								'cards': [{
									'text': profile.id,
									'title': 'ID ИГРОВОГО ПРОФИЛЯ',
									'hint': 'ID: '+profile.id+'\nVK ID: '+profile.uid,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': profile_name,
									'title': 'ИГРОВОЙ НИК',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.lvl),
									'title': 'УРОВЕНЬ ИГРОКА',
									'hint': numberSpaces(profile.exp)+' опыта',
									'style': 'grid-column-start: span 3;'
								}, {
									'text': profile_clan_name,
									'title': clan == 0 ? 'ID ГИЛЬДИИ' : 'ГИЛЬДИЯ',
									'hint': 'Уровень гильдии: '+profile.guild_lvl+'\nРанг: '+profile_clan_rang,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.hp_max),
									'title': 'ЗДОРОВЬЕ ИГРОКА',
									'hint': numberSpaces(profile.hp)+' текущее здоровье',
									'style': false
								}, {
									'text': numberSpaces(atck),
									'title': 'УРОН ИГРОКА',
									'hint': `${numberSpaces(profile.attack)} + ${numberSpaces(profile.atck_item)} + ${numberSpaces(guild_bonus_atck)} + ${numberSpaces(buff_hands)}`,
									'style': false
								}, {
									'text': numberSpaces(def),
									'title': 'ЗАЩИТА ИГРОКА',
									'hint': `${numberSpaces(profile.defence)} + ${numberSpaces(profile.def_item)} + ${numberSpaces(guild_bonus_def)}`,
									'style': false
								}]
							}, {
								'title': 'Навыки игрока',
								'cards': [{
									'text': numberSpaces(profile.dealer),
									'title': 'ТОРГОВЕЦ',
									'hint': (profile.dealer * 0.3)+'% к навыку торговли',
									'style': false
								}, {
									'text': numberSpaces(profile.critical),
									'title': 'Критический урон',
									'hint': (profile.critical * 1)+'% к шансу критического урона',
									'style': false
								}, {
									'text': numberSpaces(profile.antiCritical),
									'title': 'Анти критический урон',
									'hint': (profile.antiCritical * 1)+'% к шансу анти критического урона',
									'style': false
								}, {
									'text': numberSpaces(profile.evasion),
									'title': 'Уклонение',
									'hint': (profile.evasion * 1)+'% к шансу уклонения',
									'style': false
								}, {
									'text': numberSpaces(profile.antiEvasion),
									'title': 'Анти уклонение',
									'hint': (profile.antiEvasion * 1)+'% к шансу анти уклонения',
									'style': false
								}, {
									'text': numberSpaces(profile.firstAttack),
									'title': 'Первый удар',
									'hint': (profile.firstAttack * 1)+'% к скорости атаки',
									'style': false
								}, {
									'text': numberSpaces(profile.stamina),
									'title': 'Здоровье',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(profile.strength),
									'title': 'Защита',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(profile.power),
									'title': 'Урон',
									'hint': false,
									'style': false
								}]
							}, {
								'title': 'Прочие характеристики игрока',
								'cards': [{
									'text': numberSpaces(profile.entryDay),
									'title': 'ДНЕЙ В ИГРЕ',
									'hint': false,
									'style': false
								}, {
									'text': profile_date(profile.reg_date, 'big'),
									'title': 'ПЕРВЫЙ ВХОД В ИГРУ',
									'hint': 'В '+profile_date(profile.reg_date, 'small'),
									'style': false
								}, {
									'text': numberSpaces(profile.home),
									'title': 'УРОВЕНЬ ИНТЕРЬЕРА',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(profile.rank),
									'title': 'ОТКРЫТО ГЛАВ',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(profile.cJob),
									'title': 'ВЫПОЛНЕНО РАБОТ',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(profile.win)+' / '+numberSpaces(profile.lost),
									'title': 'АРЕНА',
									'hint': numberSpaces(profile.win)+' побед\n'+numberSpaces(profile.lost)+' поражений',
									'style': false
								}]
							}, {
								'title': 'Миссии игрока',
								'cards': [{
									'text': numberSpaces(profile.mission[0]),
									'title': 'Бои на арене',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[1]),
									'title': 'Побед на арене',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[2]),
									'title': 'Сыграть в компанию',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[3]),
									'title': 'Пройти главы',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[4]),
									'title': 'Получить звание',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[5]),
									'title': 'Купить SP',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[6]),
									'title': 'Поработать',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(profile.mission[7]),
									'title': 'Заходить в игру',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}]
							}, {
								'title': 'Основная информация гильдии '+clan.name,
								'cards': [{
									'text': clan.leader?`<a href="http://vk.com/id${clan.leader.uid}" target="_blank">${clan.leader.nickname == '' ? `Player${clan.leader.id}` : clan.leader.nickname}</a>`:'',
									'title': 'Лидер',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': clan.id,
									'title': 'ID гильдии',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': clan.lvl,
									'title': 'Уровень',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': clan.persons+' / ' + clan.max_persons,
									'title': 'СОСТАВ',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(clan.active),
									'title': 'Вымпелы',
									'hint': numberSpaces(clan.active1)+' за день',
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(clan.golds),
									'title': 'ЗОЛОТО В КАЗНЕ',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': numberSpaces(clan.coins),
									'title': 'СЕРЕБРО В КАЗНЕ',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}, {
									'text': Number(clan.war) == 0 ? 'Нет войны' : 'Активная война',
									'title': 'СТАТУС ВОЙНЫ',
									'hint': false,
									'style': 'grid-column-start: span 3;'
								}]
							}, {
								'title': 'Состав гильдии '+clan.name
							}, {
								'title': 'Улучшения гильдии '+clan.name,
								'cards': [{
									'text': numberSpaces(clan.barracks),
									'title': 'КАЗАРМЫ',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(clan.forge),
									'title': 'КУЗНИЦА',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(clan.warcraft),
									'title': 'ВОЕННОЕ РЕМЕСЛО',
									'hint': false,
									'style': false
								}, {
									'text': numberSpaces(clan.aura_atck),
									'title': 'АТАКА АУРЫ',
									'hint': false,
									'style': 'grid-column-start: span 6;'
								}, {
									'text': numberSpaces(clan.aura_def),
									'title': 'ЗАЩИТА АУРЫ',
									'hint': false,
									'style': 'grid-column-start: span 6;'
								}]
							}
						];
						let html = `<div class="__body" ${name}>`;
						if (script__settings[name]._1 == true) {
							let bannersCode = '';
							status.scriptUPDATE != ScriptVersion ? bannersCode += banners({'background': false, 'text': `Вы используете неактуальную версию скрипта<br>Ваша версия: ${ScriptVersion}, актуальная: ${status.scriptUPDATE}`}) : '';
							status.Alert != 'off' ? bannersCode += banners({'background': false, 'text': status.Alert}) : '';
							// server_more.forEach((item) => {
							// 	bannersCode += banners({'background': false, 'text': `Имеет аккаунт на сервере ${item._n}<br>${item._un}, ${item._ulvl} уровень`});
							// });
							status.statusRED.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MPz2R.gif', 'text': `<span style="color: #fff;">Имеет дело в суде<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							status.statusGREEN.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0H1.gif', 'text': `<span style="color: #fff;">Доверенное и подтверждённое лицо</span>`}) : '';
							status.statusORANGE.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0OL.gif', 'text': `<span style="color: #fff;">Имеет дело в суде, но претензии сняты<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							status.statusYELLOW.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0Wz.gif', 'text': `<span style="color: #fff;">Неадекватное поведение</span>`}) : '';
							typeof status.statusAnimate[u_id] != 'undefined' ? bannersCode += banners({'background': status.statusAnimate[u_id].href, 'text': status.statusAnimate[u_id].nick === true ? `<span style="${(status.statusAnimate[u_id].fontsize) ? 'font-size: '+status.statusAnimate[u_id].fontsize : ''}; ${(status.statusAnimate[u_id].fontfamily) ? 'font-family: '+status.statusAnimate[u_id].fontfamily : ''}; ${(status.statusAnimate[u_id].fontcolor) ? 'color: '+status.statusAnimate[u_id].fontcolor : ''};">${status.statusAnimate[u_id].text}</span>` : ''}) : '';
							// typeof status.statusGUILD[profile._clan_id] != 'undefined' && !status.statusGUILD_ban.includes(u_id) ? bannersCode += banners({'background': status.statusGUILD[profile._clan_id], 'text': ''}) : '';
							bannersCode !== '' ? html += `<div class="__banners">${bannersCode}</div>` : '';
						}
						html += builder(structure[0]);
						if (clan != 0 && (script__settings[name]._6 == true)) {
							html += builder(structure[4]);
						}
						if (clan != 0 && (script__settings[name]._9 == true)) {
							html += builder(structure[6]);
						}
						if (clan != 0 && (script__settings[name]._7 == true)) {
							let html_1 = `<div class="__list">`;
							let clan_all_win = 0;
							let clan_all_lost = 0;
							let clan_all_lvl = 0;
							clan.members.sort(function(a, b) {
								return Number(script__settings[name]._8) === 1 ?
									Number(b.lvl) < Number(a.lvl) ? 1 : -1 :
									Number(script__settings[name]._8) === 2 ?
									Number(b.last_date) < Number(a.last_date) ? -1 : 1 :
									Number(b.lvl) < Number(a.lvl) ? 1 : -1
								;
							});
							clan.members.forEach((item, x) => {
								clan_all_win += Number(item.win);
								clan_all_lost += Number(item.lost);
								clan_all_lvl += Number(item.lvl);
								html_1 += `
									<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
									<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title"><a href="http://vk.com/id${item.uid}" target="_blank">${item.nickname == '' ? `Player${item.id}` : item.nickname}</a></div></div>
									<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${numberSpaces(item.win)} побед</div></div>
									<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${numberSpaces(item.lost)} поражений</div></div>
									<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${item.last_date}</div></div>
								`;
							});
							html_1 += `</div>`;
							html += `
								<div class="__container"><input type="checkbox" id="${name}_clan1_${u_id}" checked/><label class="__title" for="${name}_clan1_${u_id}">${structure[5].title}</label><div class="__items">
								<div class="__item" style="grid-column-start: span 3;"><div class="__text">${clan.persons} / ${clan.max_persons}</div><div class="__title">СОСТАВ</div></div>
								<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_lvl)} суммарный уровень"><div class="__text">${numberSpaces(Math.floor(clan_all_lvl/clan.members.length))}</div><div class="__title">СРЕДНИЙ УРОВЕНЬ</div></div>
								<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_win)} суммарное здоровье"><div class="__text">${numberSpaces(Math.floor(clan_all_win/clan.members.length))}</div><div class="__title">СРЕДНЕЕ ПОБЕД</div></div>
								<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_all_lost)} суммарный урон"><div class="__text">${numberSpaces(Math.floor(clan_all_lost/clan.members.length))}</div><div class="__title">СРЕДНЕЕ ПОРАЖЕНИЙ</div></div>
								${html_1}
							`;
							html += `</div></div>`;
						}
						script__settings[name]._2 == true ? html += builder(structure[1]) : '';
						script__settings[name]._5 == true ? html += builder(structure[3]) : '';
						script__settings[name]._3 == true ? html += builder(structure[2]) : '';
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