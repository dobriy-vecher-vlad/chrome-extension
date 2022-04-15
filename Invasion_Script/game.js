let ScriptName = "invasion";
let ScriptTitle = "Invasion";
let ScriptVersion = "2.1.2";
ScriptRun('event');
ScriptRun('load');

async function ScriptProfileLoad(name, myID, uID) {
	log(`Script try load user: ${uID}.`);
	let script_body = document.querySelector(`.script__body[script__${uID}]`);
	try {
		script_body.innerHTML = '<div class="script__text loader__"><br><br>Обновляем настройки скрипта</div>';
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
			let status = await getData('json', `https://dobriy-vecher-vlad.github.io/warlord/inv_status.json?${+new Date}`);
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
				let profile = await getDataChrome(`https://tmp1-fb.geronimo.su/VK_INV/inv_user.php`, `id=${uID}`);
				if (profile && profile.data && profile.data.u && profile.data.u._id == '') {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Персонаж не зарегистрирован в игре</div>`;
					return;
				} if (profile === null) {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных персонажа</div>`;
					return;
				} else {
					profile = profile.data;
					let clan = 0;
					if (profile.u._clan_id !== '0' && (script__settings[name]._2 || script__settings[name]._3 || script__settings[name]._4 || script__settings[name]._5 || script__settings[name]._10)) {
						script_body.firstChild.innerText = '\n\nПолучаем информацию клана';
						clan = await getDataChrome(`https://tmp1-fb.geronimo.su/VK_INV/invasion.php`, `g_sig=${md5(`${profile.u._clan_id}hsK18`)}&viewer_id=${status.clan_id}&api_id=${status.api_id}&auth_key=${status.clan_auth}&i=49&t1=${profile.u._clan_id}`);
						if (clan && clan.data && clan.data.clan) {
							clan = clan.data.clan;
							typeof clan.mmbrs.u.length == 'undefined' ? clan.mmbrs.u = [clan.mmbrs.u] : '';
							clan = {
								...clan,
								_leader: clan.mmbrs.u.find(user => Number(user._clan_r) == 1),
								mmbrs: clan.mmbrs.u
							};
						} else {
							script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных клана</div>`;
							return;
						}
					}
					try {
						fight = profile.fight;
						profile = profile.u;
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
						let profile_loc_array = ["Хейвен", "Бренс", "Рафилд", "Харрис", "Эндроу", "Ньютаун", "Кинтон", "Нортед", "Грандтаун", "Стоки", "Канализация", "Таннбери", "Дорборн", "Харвер", "Стоунлет", "Уэрли", "Под временных боссов", "Стокпорт", "Мелдон", "Пул", "Редикс"];
						let profile_loc = profile_loc_array[profile._loc-1];
						let profile_room_array = ["Начальная комната", "Мини-маркет", "Госпиталь", "Полиция", "Озеро", "Метро", "Укрепление"];
						let profile_room = profile_room_array[profile._room-1];
						let profile_clan_name = profile._clan_id !== '0' ? clan !== 0 ? clan._name : profile._clan_id : "Нет клана";
						let profile_clan_rang_array = ["Глава клана", "Офицер клана", "Рядовой клана"];
						let profile_clan_rang = profile._clan_id !== '0' ? profile_clan_rang_array[profile._clan_r-1] : 'нет';
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
										'hint': false,
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
										'title': clan == 0 ? 'ID КЛАНА' : 'КЛАН',
										'hint': 'Ранг: '+profile_clan_rang,
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
										'text': numberSpaces(Number(profile._luck) + Number(profile._lucki)),
										'title': 'УДАЧА',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk1,
										'title': 'ВЛОМИТЬ',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk2,
										'title': 'ПРИКРЫТЬСЯ',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk3,
										'title': 'ПОДЛЫЙ УДАР',
										'hint': false,
										'style': false
									}, {
										'text': profile_perk4,
										'title': 'ОТДЫШАТЬСЯ',
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
										'text': profile._car1_lvl,
										'title': 'УРОВЕНЬ МАШИНЫ',
										'hint': false,
										'style': false
									}
								]
							}, {
								'title': 'Основная информация клана '+clan._name,
								'cards': [
									{
										'text': clan&&clan._leader?`<a href="http://vk.com/id${clan._leader._id}" target="_blank">${clan._leader._name == '' ? `Player${clan._leader._id}` : clan._leader._name}</a>`:'',
										'title': 'Лидер',
										'hint': false,
										'style': false
									}, {
										'text': clan._id,
										'title': 'ID клана',
										'hint': false,
										'style': false
									}, {
										'text': Number(clan._u1)+Number(clan._u2)+Number(clan._u3)+Number(clan._u4)+Number(clan._u5)+Number(clan._u6)+Number(clan._u7),
										'title': 'СУММАРНЫЙ УРОВЕНЬ',
										'hint': false,
										'style': false
									}, {
										'text': clan._mcnt+' / ' + (clan._u1 * 10 + 10),
										'title': 'СОСТАВ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': profile._clan_id > 0 ? clan.inv !== undefined ? typeof clan.inv.u.length == 'undefined' ? [clan.inv.u].length : clan.inv.u.length : 0 : 0,
										'title': 'ПРИГЛАШЕНИЙ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': numberSpaces(clan._r1),
										'title': 'СУММАРНО ОПЫТА',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m7),
										'title': 'Ранговых очков',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m1),
										'title': 'ПАТРОНЫ В КАЗНЕ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m2),
										'title': 'ЗОЛОТО В КАЗНЕ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m3),
										'title': 'ЖЕТОНЫ В КАЗНЕ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}, {
										'text': status.clanBLOCK[Number(profile._clan_id)] == 'treasury' && !status.scriptADMIN.includes(my_id) ? "Скрыто" : numberSpaces(clan._m4),
										'title': 'СПИЧКИ В КАЗНЕ',
										'hint': false,
										'style': 'grid-column-start: span 3;'
									}
								]
							}, {
								'title': 'Состав клана '+clan._name
							}, {
								'title': 'События клана '+clan._name
							}, {
								'title': 'Пополнения клана '+clan._name
							}, {
								'title': 'Улучшения клана '+clan._name,
								'cards': [
									{
										'text': clan._u1,
										'title': 'Казармы',
										'hint': (clan._u1*10+10)+' места для людей в клане',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._u2,
										'title': 'Наставник',
										'hint': (clan._u2*1)+'% к опыту в клановых боях',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._u3,
										'title': 'Собиратель',
										'hint': (clan._u3*1)+'% к патронам в клановых боях',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._u4,
										'title': 'Оружейная',
										'hint': numberSpaces(clan._u4*500+1000)+' урон от РПГ',
										'style': 'grid-column-start: span 3;'
									}, {
										'text': clan._u5,
										'title': 'Медпункт',
										'hint': numberSpaces(clan._u5*50+250)+' здоровье от аптеки',
										'style': false
									}, {
										'text': clan._u6,
										'title': 'Оборона',
										'hint': (new Date(clan._u6*30*60*1000).toUTCString().split(' ')[4])+' длительность защиты',
										'style': false
									}, {
										'text': clan._u7,
										'title': 'Транспортёр',
										'hint': (clan._u7*1)+'% к грабежу казны клана',
										'style': false
									}
								]
							}
						];
						let html = `<div class="__body" ${name}>`;
						if (script__settings[name]._1 == true) {
							let bannersCode = '';
							status.scriptUPDATE != ScriptVersion ? bannersCode += banners({'background': false, 'text': `Вы используете неактуальную версию скрипта<br>Ваша версия: ${ScriptVersion}, актуальная: ${status.scriptUPDATE}`}) : '';
							status.Alert != 'off' ? bannersCode += banners({'background': false, 'text': status.Alert}) : '';
							status.statusRED.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/PNz40.gif', 'text': `<span style="color: #fff;">Имеет дело в суде</span>`}) : '';
							status.statusGREEN.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/PNz5g.gif', 'text': `<span style="color: #fff;">Доверенное и подтверждённое лицо</span>`}) : '';
							status.statusORANGE.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/MP0OL.gif', 'text': `<span style="color: #fff;">Имеет дело в суде, но претензии сняты</span>`}) : '';
							status.statusYELLOW.includes(u_id) ? bannersCode += banners({'background': 'https://i.yapx.ru/PNzr5.gif', 'text': `<span style="color: #fff;">Неадекватное поведение</span>`}) : '';
							typeof status.statusAnimate[u_id] != 'undefined' ? bannersCode += banners({'background': status.statusAnimate[u_id].href, 'text': status.statusAnimate[u_id].nick === true ? `<span style="${(status.statusAnimate[u_id].fontsize) ? 'font-size: '+status.statusAnimate[u_id].fontsize : ''}; ${(status.statusAnimate[u_id].fontfamily) ? 'font-family: '+status.statusAnimate[u_id].fontfamily : ''}; ${(status.statusAnimate[u_id].fontcolor) ? 'color: '+status.statusAnimate[u_id].fontcolor : ''};">${status.statusAnimate[u_id].text}</span>` : ''}) : '';
							bannersCode !== '' ? html += `<div class="__banners">${bannersCode}</div>` : '';
						}
						html += builder(structure[0]);
						if (profile._clan_id > 0 && (script__settings[name]._2 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan1_${u_id}" checked/><label class="__title" for="${name}_clan1_${u_id}">${structure[3].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[3]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._10 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan5_${u_id}" checked/><label class="__title" for="${name}_clan5_${u_id}">${structure[7].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[7]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._3 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[4].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								let html_1 = `<div class="__list">`;
								let clan_all_dmg = 0;
								let clan_all_hp = 0;
								let clan_all_lvl = 0;
								clan.mmbrs.sort(function(a, b) {
									return Number(script__settings[name]._9) === 1 ?
										Number(b._clan_r) < Number(a._clan_r) ? 1 : -1 :
										Number(script__settings[name]._9) === 2 ?
										Number(b._dmgi) < Number(a._dmgi) ? -1 : 1 :
										Number(script__settings[name]._9) === 3 ?
										Number(b._end)+Number(b._endi) < Number(a._end)+Number(a._endi) ? -1 : 1 :
										Number(script__settings[name]._9) === 4 ?
										Number(b._l_t) < Number(a._l_t) ? 1 : -1 :
										Number(b._clan_r) < Number(a._clan_r) ? 1 : -1
									;
								});
								clan.mmbrs.forEach((item, x) => {
									clan_all_dmg += Number(item._dmgi);
									clan_all_hp += (Number(item._end) + Number(item._endi)) * 15;
									clan_all_lvl += Number(item._lvl);
									html_1 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title"><a href="http://vk.com/id${item._id}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a></div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${profile_clan_rang_array[item._clan_r-1]}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${numberSpaces(Math.round((Number(item._end) + Number(item._endi)) * 15))}</div></div>
										<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${numberSpaces(item._dmgi)}</div></div>
										<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${profile_date(item._l_t, 'big')}</div></div>
									`;
								});
								html_1 += `</div>`;
								html += `
									<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[4].title}</label><div class="__items">
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${clan._mcnt} / ${clan._u1 * 10 + 10}</div><div class="__title">СОСТАВ</div></div>
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
								html += `<div class="__container"><input type="checkbox" id="${name}_clan3_${u_id}" checked/><label class="__title" for="${name}_clan3_${u_id}">${structure[5].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								let html_2 = `<div class="__list">`;
								clan.hist == undefined ? clan.hist = {h: []} : '';
								typeof clan.hist.h.length == 'undefined' ? clan.hist.h = [clan.hist.h] : '';
								let data_hist = [];
								clan.hist.h.forEach((item) => {
									if (item._t == 10) {
										data_hist.push([item._d, `Нападение на клан ${item._v4}`]);
									}
									if (item._t == 11) {
										data_hist.push([item._d, `Нападение от клана ${item._v4}`]);
									}
									if (item._t == 12) {
										data_hist.push([item._d, `Победа в войне с кланом ${item._v4}`]);
									}
									if (item._t == 13) {
										data_hist.push([item._d, `Поражение в войне с кланом ${item._v4}`]);
									}
									if (item._t == 6) {
										data_hist.push([item._d, `Обновлено описание клана`]);
									}
									if (item._t == 0 || (item._t == 7 && item._v2 == 2)) {
										data_hist.push([item._d, `Новый участник клана <a href="http://vk.com/id${item._v1}" target="_blank">Player${item._v1}</a>`]);
									}
									if (item._t == 7 && item._v2 == 3) {
										data_hist.push([item._d, `<a href="http://vk.com/id${item._v1}" target="_blank">Player${item._v1}</a> был изменён в ранге`]);
									}
									if (item._t == 8) {
										data_hist.push([item._d, `<a href="http://vk.com/id${item._v1}" target="_blank">Player${item._v1}</a> назначен лидером клана`]);
									}
								});
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
								html += `<div class="__container"><input type="checkbox" id="${name}_clan4_${u_id}" checked/><label class="__title" for="${name}_clan4_${u_id}">${structure[6].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								clan.hist == undefined ? clan.hist = {h: []} : '';
								typeof clan.hist.h.length == 'undefined' ? clan.hist.h = [clan.hist.h] : '';
								clan.info == undefined ? clan.info = {c: []} : '';
								typeof clan.info.c.length == 'undefined' ? clan.info.c = [clan.info.c] : '';
								clan.hist.h.map((item, x) => {
									let user = clan.mmbrs.find(x => Number(x._id) === Number(item._v1));
									if (user) {
										item._id = user._id;
										item._name = user._name;
									} else {
										item._id = Number(item._v1);
										item._name = `Player${Number(item._v1)}`;
									}
								});
								let clan_treasury_m1 = clan.info.c.filter(x => x._t == 1);
								let clan_treasury_m2 = clan.info.c.filter(x => x._t == 2);
								let clan_treasury_m3 = clan.info.c.filter(x => x._t == 3);
								let clan_treasury_m4 = clan.info.c.filter(x => x._t == 4);
								let getUserTreasury = (array) => {
									for (let pay of array) clan_treasury[`m${pay._t}`] = clan_treasury[`m${pay._t}`] + Number(pay._v);
									let user = array.length !== 0 ? array.reduce((x, y) => Number(x._v) > Number(y._v) ? x : y) : {_id: 0, _name: null, _v: 0};
									let find = clan.mmbrs.find(x => Number(x._id) === Number(user._id));
									if (find) {
										user._name = find._name == '' ? `Player${user._id}` : find._name;
									} else {
										user._name = `Player${Number(user._id)}`;
									}
									return [user._id, user._name, user._v];
								};
								let clan_treasury = {
									m1: 0,
									m2: 0,
									m3: 0,
									m4: 0,
									top: [0, 0, 0, 0]
								};
								clan_treasury.top[0] = getUserTreasury(clan_treasury_m1);
								clan_treasury.top[1] = getUserTreasury(clan_treasury_m2);
								clan_treasury.top[2] = getUserTreasury(clan_treasury_m3);
								clan_treasury.top[3] = getUserTreasury(clan_treasury_m4);
								let html_3 = `<div class="__list">`;
								let hist_count = 0;
								clan.hist.h.forEach((item, x) => {
									if (item._t == 3) {
										hist_count += 1;
										html_3 += `
											<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${hist_count}</div></div>
											<div class="__item" style="grid-column-start: span 2; text-align: center;"><div class="__title">${item._d}</div></div>
											<div class="__item" style="grid-column-start: span 6;"><div class="__title"><a href="http://vk.com/id${item._id}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a> пополнил казну ${item._v2 == 1 ? 'патронами' : item._v2 == 2 ? 'золотом' : item._v2 == 3 ? 'жетонами' : 'спичками'}</div></div>
											<div class="__item" style="grid-column-start: span 3; text-align: center;"><div class="__title">${numberSpaces(item._v3)} ${item._v2 == 1 ? 'патронов' : item._v2 == 2 ? 'золота' : item._v2 == 3 ? 'жетонов' : 'спичек'}</div></div>
										`;
									}
								});
								html_3 += `</div>`;
								html += `
									<div class="__container"><input type="checkbox" id="${name}_clan4_${u_id}" checked/><label class="__title" for="${name}_clan4_${u_id}">${structure[6].title}</label>
										<div class="__items">
											${clan.hist.h.length !== 0 ? `
											<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m1)}</div><div class="__title">ПАТРОНОВ ЗА ВСЁ ВРЕМЯ</div></div>
											<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m2)}</div><div class="__title">ЗОЛОТА ЗА ВСЁ ВРЕМЯ</div></div>
											<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m3)}</div><div class="__title">ЖЕТОНОВ ЗА ВСЁ ВРЕМЯ</div></div>
											<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(clan_treasury.m4)}</div><div class="__title">СПИЧЕК ЗА ВСЁ ВРЕМЯ</div></div>
											${clan.info.c.length !== 0 ? html_3 : `<div class="__hint">Нет пополнений за последнее время</div></div>`}
											<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.top[0][2])} патронов"><div class="__text"><a href="http://vk.com/id${clan_treasury.top[0][0]}" target="_blank">${clan_treasury.top[0][1]}</a></div><div class="__title">ВНЁС Патронов БОЛЬШЕ ВСЕХ</div></div>
											<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.top[1][2])} золота"><div class="__text"><a href="http://vk.com/id${clan_treasury.top[1][0]}" target="_blank">${clan_treasury.top[1][1]}</a></div><div class="__title">ВНЁС Золота БОЛЬШЕ ВСЕХ</div></div>
											<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.top[2][2])} жетонов"><div class="__text"><a href="http://vk.com/id${clan_treasury.top[2][0]}" target="_blank">${clan_treasury.top[2][1]}</a></div><div class="__title">ВНЁС Жетонов БОЛЬШЕ ВСЕХ</div></div>
											<div class="__item" style="grid-column-start: span 3;" hint="${numberSpaces(clan_treasury.top[3][2])} спичек"><div class="__text"><a href="http://vk.com/id${clan_treasury.top[3][0]}" target="_blank">${clan_treasury.top[3][1]}</a></div><div class="__title">ВНЁС Спичек БОЛЬШЕ ВСЕХ</div></div>
											` : '<div class="__item" style="grid-column-start: span 12;"><div class="__hint">Нет пополнений</div></div>'}
										</div>
									</div>
								`;
							}
						}
						script__settings[name]._6 == true ? html += builder(structure[1]) : '';
						script__settings[name]._7 == true ? html += builder(structure[2]) : '';
						if (fight && (script__settings[name]._8 == true)) {
							typeof fight.l.length == 'undefined' ? fight.l = [fight.l] : '';
							let fight_boss_id = Number(fight._eid);
							let fight_boss_link = fight_boss_id;
							let fight_boss_name = fight._dmg == 0 ? 'Арена / Война' : fight.u._name;
							let fight_boss_hp = numberSpaces(fight._hp);
							let fight_boss_hpMax = numberSpaces(fight._mhp);
							let fight_boss_dmg = numberSpaces(fight._dmg);
							let fight_creator_id = Number(fight.l[0]._id);
							let fight_creator_name = (status.nickBLOCK.includes(fight_creator_id) ? profile_name_bad : typeof status.nickCUSTOM[fight_creator_id] != 'undefined' ? status.nickCUSTOM[fight_creator_id] : fight.l[0]._n ? fight.l[0]._n : `Player${fight.l[0]._id}`).replace(/ /g, " ");
							let fight_limit = fight_boss_id == 70 ? 50 : fight_boss_id == 18 ? "∞" : 300;
							let fight_myDmg = typeof (fight.l.find(x => Number(x._id) === u_id)) == 'undefined' ? 0 : numberSpaces(fight.l.find(x => Number(x._id) === u_id)._dd);
							let fight_procent = fight._hp > 0 ? Math.round(fight._hp / (fight._mhp / 100)) + '%' : 'убит';
							let fight_time = fight._time < 7200 ? (new Date((7200 - fight._time) * 1000)).toUTCString().split(' ')[4] : '00:00:00';
							html += `
								<div class="__container"><input type="checkbox" id="${name}_fight_${u_id}"/><label class="__title" for="${name}_fight_${u_id}">Информация по боссу ${fight_boss_name}</label>
									<div class="__items">
										<div class="__item __fight" style="grid-column-start: span 12;" hint="Имя босса: ${fight_boss_name}, ID: ${fight_boss_link}\nЗдоровье: ${fight_boss_hpMax}, урон: ${fight_boss_dmg}\n\nСоздатель боя: ${fight_creator_name}, ID: ${fight_creator_id}\nЛюдей на боссе: ${fight.l.length} / ${fight_limit}">
											<div class="__text">
												Босс <b>${fight_boss_name}</b> до конца боя осталось <b>${fight_time}</b><br>
												Здоровье <b>${fight_boss_hp}</b> / <b>${fight_boss_hpMax}</b> ${fight_procent}<br>
												Урон игрока <b>${fight_myDmg}</b>
											</div>
										</div>
										<div class="__item __fight" style="grid-area: 2 / 2 / 2 / 12;">
							`;
							fight.l.sort(function(a, b) {
								return Number(a._dd) < Number(b._dd) ? 1 : -1;
							});
							fight.l.forEach((item, x) => {
								let id = Number(item._id);
								html += fight_slot({type: status.statusRED.includes(id) ? 'jail' : id == fight_creator_id && id == u_id ? 'all' : id == fight_creator_id && id != u_id ? 'creator' : id != fight_creator_id && id == u_id ? 'viewing' : 'common', n: x+1, id: id, name: (status.nickBLOCK.includes(id) ? profile_name_bad : typeof status.nickCUSTOM[id] != 'undefined' ? status.nickCUSTOM[id] : item._n ? item._n : `Player${item.id}`).replace(/ /g, " "), dmg: numberSpaces(item._dd)});
							})
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
}