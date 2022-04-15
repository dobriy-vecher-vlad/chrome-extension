let ScriptName = "timetrap";
let ScriptTitle = "TimeTrap";
let ScriptVersion = "1.0.5";
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
		if (name == ScriptName) {
			script_body.firstChild.innerText = '\n\nПолучаем статусы игроков';
			let status = await getData('json', `https://dobriy-vecher-vlad.github.io/warlord/tt_status.json?${uID}`);
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
				let profile = await getData('xml', `https://tmp1-fb.geronimo.su/VK_TT/game.php?viewer_id=${status.api_vk_id}&api_id=${status.api_id}&t1=${uID}&i=34&auth_key=${status.api_vk_auth_key}`);
				if (profile === '') {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Персонаж не зарегистрирован в игре</div>`;
					return;
				} if (profile === null) {
					script_body.innerHTML = `<div class="script__text error__"><br><br>Ошибка при чтении данных персонажа</div>`;
					return;
				} else {
					let clan = 0;
					if (profile.u._clan_id !== '0' && (script__settings[name]._2 || script__settings[name]._3 || script__settings[name]._4)) {
						script_body.firstChild.innerText = '\n\nПолучаем информацию клана';
						clan = await getData('xml', `https://tmp1-fb.geronimo.su/VK_TT/game.php?viewer_id=${status.api_vk_id}&api_id=${status.api_id}&t1=${profile.u._clan_id}&i=89&auth_key=${status.api_vk_auth_key}`);
						if (clan && clan.clan) {
							clan = clan.clan;
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
						profile = profile.u;
						let profile_id = Number(u_id);
						let profile_name_bad = 'Я - Клоун';
						let profile_name = (status.nickBLOCK.includes(profile_id) ? profile_name_bad : typeof status.nickCUSTOM[profile_id] != 'undefined' ? status.nickCUSTOM[profile_id] : profile._name ? profile._name : `Player${profile._id}`).replace(/ /g, " ");
						let profile_hp = numberSpaces(profile._eq);
						let profile_dmg = numberSpaces(profile._dmg);
						let profile_exp = numberSpaces(profile._exp);
						let profile_days = numberSpaces(Math.round(Number(profile._bd) / 60 / 60 / 24));
						let profile_loc_array = ["Средневековье", "Заражение", "Война", "Будущее"];
						let profile_loc = profile_loc_array[profile._loc-1];
						let profile_clan_name = profile._clan_id !== '0' ? clan !== 0 ? clan._name : profile._clan_id : "Нет клана";
						let profile_clan_rang_array = ["Глава", "Заместитель главы", "Лейтенант", "Капитан", "Сержант", "Рядовой"];
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
										'text': profile_clan_name,
										'title': clan == 0 ? 'ID КЛАНА' : 'КЛАН',
										'hint': profile._clan_id !== '0' ? `Ранг: ${profile_clan_rang}\n\nУровень клана: ${clan._r}\nОпыт клана: ${numberSpaces(clan._exp)}\nУчастников клана: ${clan._mcnt}` : false,
										'style': false
									}, {
										'text': profile._lvl,
										'title': 'УРОВЕНЬ ИГРОКА',
										'hint': profile_exp+' опыта',
										'style': false
									}, {
										'text': profile_hp,
										'title': 'Экипировка ИГРОКА',
										'hint': false,
										'style': false
									}, {
										'text': profile_dmg,
										'title': 'УРОН ИГРОКА',
										'hint': false,
										'style': false
									}
								]
							}, {
								'title': 'Прочие характеристики игрока',
								'cards': [
									{
										'text': Number(profile._sex) == 2 ? 'Мужской' : 'Женский',
										'title': 'ПОЛ ПЕРСОНАЖА',
										'hint': false,
										'style': false
									}, {
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
										'text': profile._dog1,
										'title': 'ИМЯ ПИТОМЦА',
										'hint': false,
										'style': false
									}, {
										'text': profile._dog2,
										'title': 'УРОВЕНЬ ПИТОМЦА',
										'hint': numberSpaces(profile._dog4)+' опыта',
										'style': false
									}, {
										'text': profile_loc,
										'title': 'ТЕКУЩАЯ ЭПОХА',
										'hint': false,
										'style': false
									}
								]
							}, {
								'title': 'Основная информация клана '+clan._name,
								'cards': [
									{
										'text': clan&&clan._leader?`<a href="http://vk.com/id${clan._leader._id}" target="_blank">${clan._leader._name == '' ? `Player${clan._leader._id}` : clan._leader._name}</a>`:'',
										'title': 'Глава',
										'hint': false,
										'style': false
									}, {
										'text': clan._id,
										'title': 'ID клана',
										'hint': false,
										'style': false
									}, {
										'text': clan._r,
										'title': 'УРОВЕНЬ',
										'hint': numberSpaces(clan._exp)+' опыта',
										'style': false
									}, {
										'text': clan._sp,
										'title': 'ОЧКИ НАВЫКОВ',
										'hint': Number(clan._u1)+Number(clan._u2)+Number(clan._u3)+Number(clan._u4)+Number(clan._u5)+Number(clan._u6)+Number(clan._u7)+Number(clan._u8)+Number(clan._u9)+Number(clan._u10)+' улучшений',
										'style': false
									}, {
										'text': clan._mcnt+' / ' + (clan._u2 * 2 + 10),
										'title': 'СОСТАВ',
										'hint': false,
										'style': false
									}, {
										'text': profile._clan_id > 0 ? clan.inv !== undefined ? typeof clan.inv.u.length == 'undefined' ? [clan.inv.u].length : clan.inv.u.length : 0 : 0,
										'title': 'ПРИГЛАШЕНИЙ',
										'hint': false,
										'style': false
									}
								]
							}, {
								'title': 'Состав клана '+clan._name
							}, {
								'title': 'Улучшения клана '+clan._name,
								'cards': [
									{
										'text': clan._u1,
										'title': 'Обыск',
										'hint': (clan._u1 * 10)+'% к количеству серебра и инструментов за победу над боссом',
										'style': false
									}, {
										'text': clan._u2,
										'title': 'Дисциплина',
										'hint': (clan._u2 * 2)+' к свободным местам в клане',
										'style': false
									}, {
										'text': clan._u3,
										'title': 'Боевой дух',
										'hint': (clan._u3 * 10)+'% к количеству опыта за победу над боссом',
										'style': false
									}, {
										'text': clan._u4,
										'title': 'Командный дух',
										'hint': (clan._u4 * 5)+' минут к сокращению времени восстановления удара',
										'style': false
									}, {
										'text': clan._u5,
										'title': 'Взрывная волна',
										'hint': (clan._u5 * 25)+' к урону от разрывных гранат',
										'style': false
									}, {
										'text': clan._u6,
										'title': 'Стена огня',
										'hint': (clan._u6 * 30)+' к урону от зажигательных гранат',
										'style': false
									}, {
										'text': clan._u7,
										'title': 'Плазменный взрыв',
										'hint': (clan._u7 * 45)+' к урону от плазменных гранат',
										'style': false
									}, {
										'text': clan._u8,
										'title': 'Ярость',
										'hint': (clan._u8 * 1)+' к лимиту побед над боссом',
										'style': false
									}, {
										'text': clan._u9,
										'title': 'Гладиатор',
										'hint': (clan._u9 * 1)+' к дневному лимиту боёв на арене',
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
							//status.statusRED.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Ntev.gif', 'text': `<span style="color: #fff;">Имеет дело в суде<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							//status.statusGREEN.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Nteu.gif', 'text': `<span style="color: #fff;">Доверенное и подтверждённое лицо</span>`}) : '';
							//status.statusORANGE.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Nteq.gif', 'text': `<span style="color: #fff;">Имеет дело в суде, но претензии сняты<br><a style="text-decoration: underline;" href="https://vk.com/wall-133931816?q=${u_id}" target="_blank">запись в суде</a></span>`}) : '';
							//status.statusYELLOW.includes(u_id) ? bannersCode += banners({'background': 'https://i.gifer.com/3Ntet.gif', 'text': `<span style="color: #fff;">Неадекватное поведение</span>`}) : '';
							typeof status.statusAnimate[u_id] != 'undefined' ? bannersCode += banners({'background': status.statusAnimate[u_id].href, 'text': status.statusAnimate[u_id].nick === true ? `<span style="${(status.statusAnimate[u_id].fontsize) ? 'font-size: '+status.statusAnimate[u_id].fontsize : ''}; ${(status.statusAnimate[u_id].fontfamily) ? 'font-family: '+status.statusAnimate[u_id].fontfamily : ''}; ${(status.statusAnimate[u_id].fontcolor) ? 'color: '+status.statusAnimate[u_id].fontcolor : ''};">${status.statusAnimate[u_id].text}</span>` : ''}) : '';
							typeof status.statusGUILD[profile._clan_id] != 'undefined' && !status.statusGUILD_ban.includes(u_id) ? bannersCode += banners({'background': status.statusGUILD[profile._clan_id], 'text': ''}) : '';
							bannersCode !== '' ? html += `<div class="__banners">${bannersCode}</div>` : '';
						}
						html += builder(structure[0]);
						if (profile._clan_id > 0 && (script__settings[name]._2 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan1_${u_id}" checked/><label class="__title" for="${name}_clan1_${u_id}">${structure[3].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[2]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._3 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan3_${u_id}" checked/><label class="__title" for="${name}_clan3_${u_id}">${structure[7].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								html += builder(structure[4]);
							}
						}
						if (profile._clan_id > 0 && (script__settings[name]._4 == true)) {
							if (status.clanBLOCK[Number(profile._clan_id)] == 'full' && !status.scriptADMIN.includes(my_id)) {
								html += `<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[4].title}</label><div class="__items"><div class="__item" style="grid-column-start: span 12;"><div class="__hint">Информация клана скрыта</div></div></div></div>`;
							} else {
								let html_1 = `<div class="__list">`;
								let clan_all_dmg = 0;
								let clan_all_hp = 0;
								let clan_all_lvl = 0;
								clan.mmbrs.sort(function(a, b) {
									return Number(script__settings[name]._6) === 1 ?
										Number(b._clan_r) < Number(a._clan_r) ? 1 : -1 :
										Number(script__settings[name]._6) === 2 ?
										Number(b._dmgi) < Number(a._dmgi) ? -1 : 1 :
										Number(script__settings[name]._6) === 3 ?
										Number(b._end)+Number(b._endi) < Number(a._end)+Number(a._endi) ? -1 : 1 :
										Number(script__settings[name]._6) === 4 ?
										Number(b._l_t) < Number(a._l_t) ? 1 : -1 :
										Number(b._clan_r) < Number(a._clan_r) ? 1 : -1
									;
								});
								clan.mmbrs.forEach((item, x) => {
									clan_all_dmg += Number(item._dmg);
									clan_all_hp += Number(item._eq);
									clan_all_lvl += Number(item._lvl);
									html_1 += `
										<div class="__item" style="grid-column-start: span 1; text-align: center;"><div class="__title">${x+1}</div></div>
										<div class="__item" style="grid-column-start: span 2;"><div class="__title"><a href="http://vk.com/id${item._id}" target="_blank">${item._name == '' ? `Player${item._id}` : item._name}</a></div></div>
										<div class="__item" style="grid-column-start: span 2;"><div class="__title">${profile_clan_rang_array[item._clan_r-1]}</div></div>
										<div class="__item" style="grid-column-start: span 2;"><div class="__title">${numberSpaces(item._eq)}</div></div>
										<div class="__item" style="grid-column-start: span 2;"><div class="__title">${numberSpaces(item._dmg)}</div></div>
										<div class="__item" style="grid-column-start: span 3;"><div class="__title">${profile_date(item._bd, 'big')}</div></div>
									`;
								});
								html_1 += `</div>`;
								html += `
									<div class="__container"><input type="checkbox" id="${name}_clan2_${u_id}" checked/><label class="__title" for="${name}_clan2_${u_id}">${structure[3].title}</label><div class="__items">
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${clan._mcnt} / ${clan._u2 * 2 + 10}</div><div class="__title">СОСТАВ</div></div>
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(Math.floor(clan_all_lvl/clan.mmbrs.length))}</div><div class="__title">СРЕДНИЙ УРОВЕНЬ</div></div>
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(Math.floor(clan_all_hp/clan.mmbrs.length))}</div><div class="__title">СРЕДНЯЯ Экипировка</div></div>
									<div class="__item" style="grid-column-start: span 3;"><div class="__text">${numberSpaces(Math.floor(clan_all_dmg/clan.mmbrs.length))}</div><div class="__title">СРЕДНИЙ УРОН</div></div>
									${html_1}
								`;
								html += `</div></div>`;
							}
						}
						script__settings[name]._5 == true ? html += builder(structure[1]) : '';
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