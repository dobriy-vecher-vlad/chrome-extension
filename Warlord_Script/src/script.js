import React, { useState, useEffect } from 'react';
import {
	Avatar,
	Card,
	CardGrid,
	Footer,
	IconButton,
	InitialsAvatar,
	Link,
	Placeholder,
	Separator,
	SimpleCell,
	Spinner,
	TabsItem,
	Counter,
	ButtonGroup,
	Button,
	Banner,
	Div,
	Chip,
	Gallery,
} from '@vkontakte/vkui';
import {
	RichTooltip,
	TextTooltip
} from '@vkontakte/vkui/dist/unstable';
import {
	Icon16Cancel,
	Icon16ChevronOutline,
	Icon16Crown,
	Icon16Done,
	Icon16DropdownOutline,
	Icon16Flash,
	Icon16User,
	Icon16View,
	Icon20BookOutline,
	Icon20HomeOutline,
	Icon20MoneyTransferOutline,
	Icon20NotificationOutline,
	Icon20ShieldLineOutline,
	Icon20SkullOutline,
	Icon20Stars,
	Icon20UserOutline,
	Icon20Users3Outline,
	Icon24SadFaceOutline,
} from '@vkontakte/icons';


const tagEmoji = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦝', '🐺'];
const arenaLeagues = ['Нет лиги', 'Лига Новичков', 'Лига Воинов I', 'Лига Воинов II', 'Лига Мастеров', 'Лига Рыцарей', 'Лига Чемпионов', 'Тёмная Лига', 'Кровавая Лига', 'Легендарная Лига'];
const clanRangs = ['Лидер гильдии', 'Генерал гильдии', 'Офицер гильдии', 'Ветеран гильдии', 'Рядовой гильдии', 'Рекрут гильдии'];
const pets = ['Нет питомца', 'Полярный Тигр', 'Северный Волк', 'Дух Воды', 'Панда', 'Грабоид'];
const mapLocations = ['Южный Риверфорт', 'Риверфорт', 'Северный Риверфорт', 'Паучий лес', 'Лесной отшельник', 'Разбойничий лагерь', 'Руины древнего форта', 'Перевал мертвецов', 'Заброшенная деревня', 'Северный Растхельм', 'Крепость Растхельма', 'Южный Растхельм', 'Форт Надежда', 'Долина Тайн', 'Мыс Буря Запада', 'Город Шимерран', 'Южный тракт', 'Рыбацкая деревня', 'Перешеек дракона', 'Межводье', 'Рыбацкая деревня', 'Руины Мидгарда', 'Пустыня безмолвия', 'Оазис', 'Город Гримдрифт', 'Южная деревня', 'Тёмный лес', 'Руины отчаяния', 'Ястребиный мыс', 'Заброшенная тюрьма', 'Гринвол', 'Лесной перешеек', 'Разделённое ущелье', 'Серозимняя застава', 'Захваченный порт', 'Лесная дорога', 'Глиндейл', 'Северный перевал', 'Руины Мион', 'Цитадель Эльоддура'];
const rooms = ['Риверфорт', 'Башня Растхельма', 'Военный лагерь', 'Пустынная застава', 'Личные покои', 'Пиратский корабль'];
const badName = 'Я - Клоун';
const pathImages = 'https://dobriy-vecher-vlad.github.io/warlord-helper/media/images/';
const calcInitialsAvatarColor = (v) => v%6+1;
const calcTag = async(name, id, reserve) => {
	if (name) {
		let search = /^(.+?) /.exec(name.replace(/{|}|\[|]|-|_/g, ' ').replace(/ +/g, ' ').replace(/^\s/g, ''));
		if (search?.[1]?.length < 5) {
			name = search[1];
		} else if (reserve) {
			name = await this.calcTag(reserve, id);
		} else name = tagEmoji[id%tagEmoji.length];
	} else name = name.slice(0, 2);
	return name.slice(0, 3);
};
const removeEmptyObject = async(object) => {
	for (let prop of Object.getOwnPropertyNames(object)) if (object[prop] == false || object[prop] == null || object[prop] == undefined || String(object[prop]) == 'NaN' || (typeof object[prop] == 'object' && object[prop].includes(NaN))) delete object[prop];
	return object;
};
const numberSpaces = (number, symbol = ' ') => ((typeof number == 'string' ? number : JSON.stringify(number)) || '').toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol) || 0;
const numberForm = (number, titles) => {
	number = Math.abs(number);
	let cases = [2, 0, 1, 1, 1, 2];
	return titles[(number%100>4&&number%100<20)?2:cases[(number%10<5)?number%10:5]];
};
const parseDate = (ms = 0) => new Date(new Date() - ms);
const dateForm = (ms = 0, format) => format === 'large' ? new Date(ms).toLocaleString('ru', {
	timezone: 'UTC',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
}) : format === 'medium' ? new Date(ms).toLocaleString('ru', {
	timezone: 'UTC',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
}) : format === 'small' ? new Date(ms).toLocaleString('ru', {
	timezone: 'UTC',
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
}) : `${dateForm(ms, 'large')} в ${dateForm(ms, 'medium')}`;
const buildPhrase = (data) => {
	let phrase = '';
	let {
		number = 0,
		before = [],
		after = [],
		needNumber = true,
		symbol = ' ',
	} = data || {};
	if (before.length) {
		if (phrase.length) phrase += ' ';
		phrase += numberForm(number, before);
	}
	if (needNumber) {
		if (phrase.length) phrase += ' ';
		phrase += numberSpaces(number, symbol);
	}
	if (after.length) {
		if (phrase.length) phrase += ' ';
		phrase += numberForm(number, after);
	}
	return phrase;
};
const parseFight = async(fight = {}, statuses = false) => {
	if (Number(fight.dmg) == 0) return false;
	if (!fight.users) fight.users = [];
	if (!fight.users.length) fight.users = [fight.users];
	fight = {
		boss: {
			id: Number(fight.eid),
			name: fight.name,
			dmg: Number(fight.dmg),
			hp: Number(fight.mhp),
		},
		id: Number(fight.fid),
		hp: Number(fight.hp),
		members: fight.users,
		creator: {},
		limit: 0,
		timeout: Number(fight.time) * 1000,
	};
	for (let [key, user] of Object.entries(fight.members)) fight.members[key] = await parseUser(user, statuses);
	fight.creator = fight.members[0];
	fight.limit = fight.boss.id == 291 ? 175 : 300;
	return fight;
};
const parseClan = async(clan = {}, statuses = false) => {
	if (!clan?.mmbrs?.u) clan.mmbrs = { u: [] };
	if (!clan.mmbrs.u.length) clan.mmbrs.u = [...Array.isObject(clan.mmbrs.u) ? [clan.mmbrs.u] : clan.mmbrs.u];
	if (!clan?.inv?.u) clan.inv = { u: [] };
	if (!clan.inv.u.length) clan.inv.u = [...Array.isObject(clan.inv.u) ? [clan.inv.u] : clan.inv.u];
	if (!clan?.hist?.h) clan.hist = { h: [] };
	if (!clan.hist.h.length) clan.hist.h = [...Array.isObject(clan.hist.h) ? [clan.hist.h] : clan.hist.h];
	if (!clan?.info1?.c) clan.info1 = { c: [] };
	if (!clan.info1.c.length) clan.info1.c = [...Array.isObject(clan.info1.c) ? [clan.info1.c] : clan.info1.c];
	if (!clan?.info7?.c) clan.info7 = { c: [] };
	if (!clan.info7.c.length) clan.info7.c = [...Array.isObject(clan.info7.c) ? [clan.info7.c] : clan.info7.c];
	clan = {
		id: Number(clan.id), // номер
		name: clan.name, // название
		lvl: Number(clan.lvl) + 2, // уровень
		leader: Number(clan.leader), // номер лидера
		invitations: clan.inv.u.length, // количество приглашений
		actions: {
			create: clan.hist.h.filter(hist => Number(hist?.t) == 4).map(hist => ({
				time: Number(hist.d.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2)-1, Number(p1)).getTime())), // время, миллисекунды
			})), // создание гильдии
			members: clan.hist.h.filter(hist => Number(hist?.t) == 0).map(hist => ({
				id: Number(hist.v1), // номер
				time: Number(hist.d.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2)-1, Number(p1)).getTime())), // время, миллисекунды
			})), // новый участник
			bosses: clan.hist.h.filter(hist => Number(hist?.t) == 23).map(hist => ({
				id: Number(hist.v2), // номер
				time: Number(hist.d.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2)-1, Number(p1)).getTime())), // время, миллисекунды
			})), // боссы
			wars: {
				to: clan.hist.h.filter(hist => Number(hist?.t) == 18).map(hist => ({
					title: hist.v4, // название
					win: Number(hist.v3) != 0, // победа
					time: Number(hist.d.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2)-1, Number(p1)).getTime())), // время, миллисекунды
				})), // нападение
				from: clan.hist.h.filter(hist => Number(hist?.t) == 19).map(hist => ({
					title: hist.v4, // название
					win: Number(hist.v3) == 0, // победа
					time: Number(hist.d.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2)-1, Number(p1)).getTime())), // время, миллисекунды
				})), // оборона
			}, // боевые действия
			upgrades: clan.hist.h.filter(hist => Number(hist?.t) == 17).map(hist => ({
				id: Number(hist.v2), // номер
				lvl: Number(hist.v3), // уровень
				time: Number(hist.d.replace(/(\d\d).(\d\d).(\d\d)/, (match, p1, p2, p3) => new Date(`20${p3}`, Number(p2)-1, Number(p1)).getTime())), // время, миллисекунды
			})), // улучшения
			treasury: {
				day: [...clan.info1.c], // день
				week: [...clan.info7.c], // неделя
			}, // пополнение казны
		}, // действия активности
		academy: [
			Number(clan.u1),
			Number(clan.u2),
			Number(clan.u3),
			Number(clan.u4),
			Number(clan.u5),
			Number(clan.u6),
		], // академия
		treasury: [
			Number(clan.m1),
			Number(clan.m3),
		], // казна
		guard: [
			Number(clan.wu1),
			Number(clan.wu2),
		], // стража
		ram: [
			Number(clan.wu3),
			Number(clan.wu4),
		], // таран
		builds: clan.bldngs.b.map(item => Number(item.lvl)), // постройки
		members: clan.mmbrs.u, // участники
	};
	for (let [key, user] of Object.entries(clan.members)) clan.members[key] = await parseUser(user, statuses);
	clan.actions.treasury.day = clan.actions.treasury.day.map(hist => {
		let user = clan.members.find(user => user.id == Number(hist.id));
		if (user) return {
			user: user,
			currency: Number(hist.t),
			amount: Number(hist.v),
		};
	});
	clan.actions.treasury.week = clan.actions.treasury.week.map(hist => {
		let user = clan.members.find(user => user.id == Number(hist.id));
		if (user) return {
			user: user,
			currency: Number(hist.t),
			amount: Number(hist.v),
		};
	});
	clan.leader = clan.members.find(user => user.id == clan.leader) || 0;
	return clan;
};
const parseUser = async(user = {}, statuses = false) => {
	user = {
		id: Number(user.id), // номер игрового профиля
		vkId: Number(user.vkId), // номер профиля
		exp: Number(user.exp), // опыт
		lvl: Number(user.lvl), // уровень
		name: user.name || user.n, // имя
		avatar: Number(user.aid), // аватар
		room: Number(user.room), // задний фон
		date: [Number(user.bd)*1000, Number(user.l_t)*1000, Number(user.clan_d)*1000], // [первый вход, последний вход, участие в гильдии], секунды
		hp: Number(user.end) + Number(user.endi), // выносливость
		dmg: Number(user.dmgi) || Number(user.dd), // урон
		guild: Number(user.clan_id) || false, // номер гильдии
		rang: Number(user.clan_r) || false, // ранг в гильдии
		premium: Number(user.va) == 1, // наличие премиума
		location: Number(user.loc), // номер активной локации
		pet: Number(user.pet) || false, // номер питомца
		skills: [Number(user.end), Number(user.s1), Number(user.s2), Number(user.s3), Number(user.s4)], // [ВЫНОСЛИВОСТЬ, СВИРЕПЫЙ УДАР, БЛОК ЩИТОМ, НЕВИДИМЫЙ УДАР, МАСТЕР ЦЕЛИТЕЛЬ]
		league: Number(user.al), // номер лиги арены
		cups: Number(user.ap), // кубки арены
		chest: Number(user.a_c) || false, // сундук арены
	};
	user.name = (user.name || '').replace(/\s/g, '').length ? user.name.trim() : `Player${user.id}`;
	if (statuses) {
		user.name = statuses.nickBLOCK.includes(user.vkId) ? badName : user.name;
		user.name = Object.keys(statuses.nickCUSTOM).map(key => parseInt(key)).includes(user.vkId) ? statuses.nickCUSTOM[user.vkId] : user.name;
		user.isVerified = statuses.statusGREEN.includes(user.vkId);
		user.isAdmin = statuses.scriptADMIN.includes(user.vkId);
		user.isBad = statuses.statusRED.includes(user.vkId) || statuses.statusORANGE.includes(user.vkId) || statuses.statusYELLOW.includes(user.vkId);
	}
	user.isGeneral = user.rang == 2;
	user.isLeader = user.rang == 1;
	user.tag = await calcTag(user.name, user.vkId || user.id || 0);
	user = await removeEmptyObject(user);
	return user;
};
const getUserIcons = (data, embedded = false) => {
	let {
		isVerified = false,
		isAdmin = false,
		isBad = false,
		isGeneral = false,
		isLeader = false,
	} = data || {};
	return (<>
		{isVerified&&getTextTooltip(<Icon16Done/>, 'Порядочный игрок', embedded)}
		{isBad&&getTextTooltip(<Icon16Cancel/>, 'Недобросовестный игрок', embedded)}
		{isAdmin&&getTextTooltip(<Icon16Flash/>, 'Разработчик расширения', embedded)}
		{isGeneral&&getTextTooltip(<Icon16User/>, 'Генерал гильдии', embedded)}
		{isLeader&&getTextTooltip(<Icon16Crown/>, 'Лидер гильдии', embedded)}
	</>);
};
const getUserCell = (data) => {
	let {
		user = {},
		key = 0,
		rows = [],
		tooltip = false,
		placement = 'top-start',
	} = data || {};
	let sizes = {
		gap: 8,
		key: 32,
		avatar: 32,
		name: 25,
	};
	sizes.columns = `${sizes.key?`${sizes.key}px `:''}${typeof user.avatar != 'undefined'?`${sizes.avatar}px `:''}${sizes.name?`${sizes.name}% `:''}repeat(${rows.length-(sizes.name ? 1 : 0)}, calc(${(100 - sizes.name) / (rows.length-(sizes.name ? 1 : 0))}% - ${(sizes.key + (typeof user.avatar != 'undefined' ? sizes.avatar : 0) + sizes.gap * (rows.length+(typeof user.avatar != 'undefined' ? 1 : 0))) / (rows.length-(sizes.name ? 1 : 0))}px))`;
	let component = (<SimpleCell key={key} {...{href: user.vkId&&`https://vk.com/id${user.vkId}`, target: user.vkId&&'_blank'}} className='TableCell'>
		<div className='TableCell__content' style={{display: 'grid', alignItems: 'center', gridTemplateColumns: sizes.columns, gridGap: `${sizes.gap}px`, minHeight: `${sizes.avatar}px`}}>
			<div className='TableCell__row TableCell__row--count' title={String(key)}><span>{key}</span></div>
			{typeof user.avatar != 'undefined'&&<div className='TableCell__row TableCell__row--avatar' title={`avatar_${user.avatar}.png`}>{String(user.avatar).length?<Avatar src={`${pathImages}bot/arena/avatar_${user.avatar}.png`} mode='app' size={sizes.avatar}/>:<InitialsAvatar mode='app' gradientColor={calcInitialsAvatarColor(user.vkId || user.id || 0)} size={sizes.avatar}>{user.tag || '#'}</InitialsAvatar>}</div>}
			{rows.map((row, x) => <div key={x} className='TableCell__row' title={typeof row.title == 'string' ? row.title : undefined} style={{justifyContent: row.right ? 'flex-end' : 'space-between'}}><span>{row.title}</span></div>)}
		</div>
	</SimpleCell>);
	return tooltip ? getRichTooltip(component, tooltip, key, placement) : component;
};
const getUserCard = (user) => (<div className='UserCard'>
	<SimpleCell
		disabled
		before={user.avatar ? <Avatar src={`${pathImages}bot/arena/avatar_${user.avatar}.png`} mode='app' size={48}/> : <InitialsAvatar mode='app' gradientColor={calcInitialsAvatarColor(user.vkId || user.id || 0)} size={48}>{user.tag}</InitialsAvatar>}
		badgeAfterTitle={getUserIcons(user, true)}
		subtitle={<Link href={`https://vk.com/id${user.vkId}`} target='_blank'>vk.com/id{user.vkId}</Link>}
	>
		{user.name}
	</SimpleCell>
	<ButtonGroup mode='horizontal' gap='s' stretched>
		<Button href={`https://vk.com/id${user.vkId}`} target='_blank' after={<Icon16ChevronOutline/>} appearance='accent' mode='secondary' size='m' stretched>Открыть</Button>
		<Button href={`https://vk.com/im?sel=${user.vkId}`} target='_blank' after={<Icon16ChevronOutline/>} appearance='accent' mode='secondary' size='m' stretched>Написать</Button>
	</ButtonGroup>
</div>);
const getTextTooltip = (component, tooltip, embedded) => <TextTooltip style={{maxWidth: 160}} text={tooltip} appearance={embedded?'black':'inversion'}>{component}</TextTooltip>;
const getRichTooltip = (component, tooltip, key = 0, placement = 'top-start') => (<RichTooltip arrow={false} key={key} style={{maxWidth: 320}} content={tooltip} placement={placement} appearance='white'>{component}</RichTooltip>);
const getBanner = (banner) => {
	const renderMethod = (element, link = undefined) => link?.length ? <a href={link} target={link.slice(0, 1) == '?' ? '' : '_blank'}>{element}</a> : <span>{element}</span>;
	return renderMethod(<Banner
		mode={banner.image?.length ? 'image' : undefined}
		header={banner.header || ' '}
		subheader={banner.subheader || ' '}
		asideMode={banner.link?.length && !banner.image?.length ? 'expand' : undefined}
		background={banner.image?.length ? <div style={{ backgroundColor: '#000', backgroundImage: `url(${banner.image})`, backgroundPosition: 'center', backgroundSize: 'cover' }}/> : undefined}
	/>, banner.link || undefined);
};
const getActions = (actions) => {
	return (<>
		<Div className='ActionsGroup'>
			{actions.map((banner, key) => <React.Fragment key={key}>
				{key != 0 && <Separator/>}
				{getBanner(banner)}
			</React.Fragment>)}
		</Div>
	</>)
};
const getBanners = (banners) => {
	return (<>
		<Gallery className='BannerGroup' align='center' isDraggable={true} showArrows={true}>
			{banners.map((banner, key) => <React.Fragment key={key}>
				{getBanner(banner)}
			</React.Fragment>)}
		</Gallery>
	</>)
};
const Content = (props) => {
	const { script, log, getData, settings } = props;
	let { from, to, server, timestamp, setServer, setSelected } = props;
	const { beforeLoad, afterLoad } = props;
	const [hint, setHint] = useState('Загружаем данные');
	const [error, setError] = useState(null);
	const [dataStatuses, setDataStatuses] = useState(null);
	const [dataServers, setDataServers] = useState(null);
	const [dataProfile, setDataProfile] = useState(null);
	const [dataClan, setDataClan] = useState(null);
	const [dataFight, setDataFight] = useState(null);
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		setSelected(true);
		const reset = () => {
			setHint('Загружаем данные');
			setError(null);
			setDataStatuses(null);
			setDataServers(null);
			setDataProfile(null);
			setDataClan(null);
			setDataFight(null);
			setLoaded(false);
		};
		const load = async() => {
			reset();
			try {
				setHint('Получаем номер профиля');
				if (!from && to) from = to;
				if (!to && from) to = from;
				if (!from || !to) return setError('Ошибка при получении номера профиля');
				setHint('Получаем настройки');
				if (!script || typeof script != 'object') return setError('Ошибка при получении настроек');
				setHint('Получаем статусы');
				let status = await getData(`${script.statuses}?${+new Date}`);
				if (!status || typeof status != 'object') return setError('Ошибка при получении статусов');
				if (status.statusBLOCK.includes(from)) return setError('Для Вас доступ к скрипту ограничен');
				if (status.statuses[server-1].statusINVISIBLE.includes(to) && from != to && !status.statuses[server-1].scriptADMIN.includes(from)) return setError('Информация игрока скрыта');
				status = {
					...status.statuses[server-1],
					scriptUPDATE: status.scriptUPDATE,
					api_vk_id: status.api_vk_id,
					api_id: status.api_id,
					api_vk_auth_key: status.api_vk_auth_key,
					api_vk_sslt: status.api_vk_sslt,
				};
				setHint('Выбираем сервер');
				let servers = await getData(`https://tmp1-fb.geronimo.su/gameHub/index.php?api_uid=${to}&api_type=vk`);
				if (!servers?.s) return setError('Ошибка при выборе сервера игры');
				let _servers = [];
				for (let server of servers.s) {
					if (Number(server.uid) != 0) _servers.push({
						id: Number(server.id),
						title: server.n,
						link: server.url,
						user: await parseUser({
							name: server.un,
							lvl: server.ulvl,
							id: server.uid,
							vkId: to,
						}, status),
					});
				}
				servers = _servers;
				if (!servers) return setError('Ошибка при выборе сервера игры');
				server = servers.find(_server => _server.id == server);
				if (servers.findIndex(_server => _server == server) != -1) servers.splice(servers.findIndex(_server => _server == server), 1);
				setDataServers(servers);
				if (!server || server.uid == 0) return setError('Игрок не зарегистрирован на сервере');
				setHint('Получаем информацию игрока');
				let profile = await getData(`https://${server.link}udata.php?user=${to}`);
				if (/зарегистрирован/.exec(profile)) return setError('Игрок не зарегистрирован на сервере');
				if (!profile?.u) return setError('Ошибка при чтении данных персонажа');
				let clan = false;
				if (settings.showGuild || settings.showGuildUpgrades || settings.showGuildPersonnel || settings.showGuildEvents || settings.showGuildDeposits) {
					if (Number(profile.u.clan_id) != 0) {
						setHint('Получаем информацию гильдии');
						clan = await getData(`https://${server.link}game.php?api_uid=${status.api_vk_id}&UID=${status.api_vk_uid}&api_type=vk&api_id=${status.api_id}&auth_key=${status.api_vk_auth_key}&i=49&t1=${profile.u.clan_id}&sslt=${status.api_vk_sslt}`);
						if (!clan?.clan) return setError('Ошибка при чтении данных гильдии');
						clan = await parseClan(clan.clan, status);
					}
				}
				setDataClan(clan);
				setHint('Получаем информацию боя');
				let fight = false;
				if (profile.fight) fight = await parseFight(profile.fight, status);
				setDataFight(fight);
				profile = await parseUser(profile.u, status);
				setDataProfile(profile);
				setDataStatuses({
					actions: [
						...status?.actions || [],
						// ...status.scriptUPDATE != script.version ? [{
						// 	header: <>Устаревшая версия</>,
						// 	subheader: <>Вы используете <Chip removable={false}>{script.version}</Chip>, актуальная <Chip removable={false}>{status.scriptUPDATE}</Chip></>,
						// }] : [],
					],
					banners: [
						...status.statusRED.includes(to) ? [{
							header: <>Замечен в суде</>,
							subheader: <>Посмотри запись в суде и будь осторожен с ним</>,
							link: `https://vk.com/wall-133931816?q=${to}`,
							image: `https://i.yapx.ru/MPz2R.gif`,
						}] : [],
						...status.statusGREEN.includes(to) ? [{
							header: <>Порядочный игрок</>,
							subheader: <>Доверенное и подтверждённое лицо</>,
							image: `https://i.yapx.ru/MP0H1.gif`,
						}] : [],
						...status.statusORANGE.includes(to) ? [{
							header: <>Замечен в суде, но претензии сняты</>,
							subheader: <>Посмотри запись в суде и будь осторожен с ним</>,
							link: `https://vk.com/wall-133931816?q=${to}`,
							image: `https://i.yapx.ru/MP0OL.gif`,
						}] : [],
						...status.statusYELLOW.includes(to) ? [{
							header: <>Неадекватное поведение</>,
							subheader: <>Избегай контакта с ним</>,
							image: `https://i.yapx.ru/MP0Wz.gif`,
						}] : [],
						...status.statusAnimate[to] ? [{
							image: status.statusAnimate[to].href,
						}] : [],
						...(profile.guild && status.statusGUILD[profile.guild] && !status.statusGUILD_ban.includes(to)) ? [{
							image: status.statusGUILD[profile.guild],
						}] : [],
					],
				});
				return setLoaded(true);
			} catch (error) {
				console.log(error);
				setError(error?.message || 'Ошибка при чтении данных');
				return setLoaded(false);
			}
		};
		const start = async() => {
			if (beforeLoad) beforeLoad();
			await load();
			if (afterLoad) afterLoad();
		};
		start();
		return () => {
			setSelected(false);
			reset();
		};
	}, [to, server, timestamp]);
	return (
		loaded && dataProfile ? <>
			{settings.showBanners ? <>
				{dataStatuses?.banners?.length ? getBanners(dataStatuses.banners) : false}
				{dataStatuses?.actions?.length ? getActions(dataStatuses.actions) : false}
			</> : false}
			{settings.showServers && dataServers?.length ? <>
				{dataServers.map((server, key) => <SimpleCell
					onClick={() => setServer(server.id)}
					key={key}
					after={<IconButton aria-label='Перейти'><Icon16ChevronOutline width={16} height={16} style={{ padding: 8, color: 'var(--accent)' }}/></IconButton>}
					subtitle={`Профиль на сервере ${server.title}`}
					before={<InitialsAvatar mode='app' gradientColor={calcInitialsAvatarColor(server.user.vkId || server.user.id || 0)} size={32}>{server.user.tag}</InitialsAvatar>}
				>{server.user.name}, {server.user.lvl || 0} уровень</SimpleCell>)}
				<Separator/>
			</> : false}
			<details className='dvvDetails' open>
				<summary className='dvvDetails__summary'>
					<SimpleCell
						after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
						subtitle={`${dataProfile.name}, ${numberSpaces(dataProfile.dmg)} урона и ${numberSpaces(dataProfile.hp*15)} здоровья`}
						before={<Avatar size={32} shadow={false} mode='app'><Icon20UserOutline/></Avatar>}
					>Характеристики игрока</SimpleCell>
				</summary>
				<div className='dvvDetails__content'>
					<CardGrid size='s'>
						<Card>
							{getRichTooltip(
								<SimpleCell
									disabled
									subtitle='номер профиля'
									after={getUserIcons(dataProfile)}
								><Link href={`https://vk.com/id${dataProfile.vkId}`} target='_blank'>{dataProfile.id}</Link></SimpleCell>,
								getUserCard(dataProfile)
							)}
						</Card>
						<Card>
							<SimpleCell
								disabled
								subtitle='никнейм'
							>{dataProfile.name}</SimpleCell>
						</Card>
						<Card>
							<TextTooltip text={<span>{numberSpaces(dataProfile.exp)} опыта</span>} placement={'top'} appearance='inversion'>
								<SimpleCell
									disabled
									subtitle='уровень'
								>{numberSpaces(dataProfile.lvl)}</SimpleCell>
							</TextTooltip>
						</Card>
						<Card>
							<SimpleCell
								disabled
								subtitle='урон'
							>{numberSpaces(dataProfile.dmg)}</SimpleCell>
						</Card>
						<Card>
							<SimpleCell
								disabled
								subtitle='здоровье'
							>{numberSpaces(dataProfile.hp*15)}</SimpleCell>
						</Card>
						<Card>
							<TextTooltip text={dataProfile.guild?<span>Ранг — {clanRangs[dataProfile.rang-1].toLowerCase()}<br/>Стаж — {buildPhrase({ number: Math.floor(Number(dataProfile.date[2]) / 1000 / 60 / 60 / 24), after: ['день', 'дня', 'дней'] })}</span>:<span>Игрок не состоит в гильдии</span>} placement={'top'} appearance='inversion'>
								<SimpleCell
									disabled
									subtitle={dataProfile.guild ? dataClan ? 'гильдия' : 'номер гильдии' : 'гильдия'}
								>{dataProfile.guild ? dataClan ? dataClan.name : dataProfile.guild : 'Нет гильдии'}</SimpleCell>
							</TextTooltip>
						</Card>
					</CardGrid>
				</div>
			</details>
			{settings.showSkills ? <>
				<details className='dvvDetails'>
					<summary className='dvvDetails__summary'>
						<SimpleCell
							after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
							subtitle={buildPhrase({ number: dataProfile.skills?.reduce((x, y) => x + y), before: ['Прокачен', 'Прокачено', 'Прокачено'], after: ['уровень', 'уровня', 'уровней'] })}
							before={<Avatar size={32} shadow={false} mode='app'><Icon20BookOutline/></Avatar>}
						>Навыки игрока</SimpleCell>
					</summary>
					<div className='dvvDetails__content'>
						<CardGrid size='s'>
							<Card>
								<TextTooltip text={<span>Наносит {buildPhrase({ number: dataProfile.dmg, after: ['урон', 'урона', 'урона'] })} по противнику</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='урон'
									>{numberSpaces(dataProfile.dmg)}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<TextTooltip text={<span>На {buildPhrase({ number: (dataProfile.skills?.[0] || 0) * 15, after: ['здоровье', 'здоровья', 'здоровья'] })} больше у персонажа</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='выносливость'
									>{numberSpaces(dataProfile.skills?.[0])}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<TextTooltip text={<span>Наносит {buildPhrase({ number: (dataProfile.skills?.[1] || 0) * 5 + dataProfile.dmg, after: ['урон', 'урона', 'урона'] })} по противнику</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='свирепый удар'
									>{numberSpaces(dataProfile.skills?.[1])}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<TextTooltip text={<span>Блокирует {buildPhrase({ number: (dataProfile.skills?.[2] || 0), after: ['урон', 'урона', 'урона'] })} от противника</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='блок щитом'
									>{numberSpaces(dataProfile.skills?.[2])}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<TextTooltip text={<span>Наносит {buildPhrase({ number: (dataProfile.skills?.[3] || 0) * 7 + dataProfile.dmg, after: ['урон', 'урона', 'урона'] })} по противнику</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='невидимый удар'
									>{numberSpaces(dataProfile.skills?.[3])}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<TextTooltip text={<span>Восстанавливает {buildPhrase({ number: (dataProfile.skills?.[4] || 0) * 3 + 250, after: ['здоровье', 'здоровья', 'здоровья'] })} персонажу</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='мастер целитель'
									>{numberSpaces(dataProfile.skills?.[4])}</SimpleCell>
								</TextTooltip>
							</Card>
						</CardGrid>
					</div>
				</details>
			</> : false}
			{settings.showExtra ? <>
				<details className='dvvDetails'>
					<summary className='dvvDetails__summary'>
						<SimpleCell
							after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
							subtitle={`Первый вход ${buildPhrase({ number: Math.round(Number(dataProfile.date?.[0]) / 1000 / 60 / 60 / 24), after: ['день', 'дня', 'дней'] })} назад,  ${dataProfile.premium ? 'использует' : 'не использует'} премиум`}
							before={<Avatar size={32} shadow={false} mode='app'><Icon20Stars/></Avatar>}
						>Прочие характеристики игрока</SimpleCell>
					</summary>
					<div className='dvvDetails__content'>
						<CardGrid size='s'>
							<Card>
								{[0].map(() => {
									let days = Math.round(Number(dataProfile.date?.[0]) / 1000 / 60 / 60 / 24);
									let years = Math.floor(days / 365);
									return (<TextTooltip key={0} text={<span>{buildPhrase({ number: years, after: ['год', 'года', 'лет'] })} и {buildPhrase({ number: (days - 365 * years), after: ['день', 'дня', 'дней'] })}</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle={numberForm(days, ['день в игре', 'дня в игре', 'дней в игре'])}
										>{numberSpaces(days)}</SimpleCell>
									</TextTooltip>);
								})}
							</Card>
							<Card>
								<TextTooltip text={<span>{dateForm(parseDate(dataProfile.date?.[0]))}</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='первый вход в игру'
									>{dateForm(parseDate(dataProfile.date?.[0]), 'large')}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<TextTooltip text={<span>{dateForm(parseDate(dataProfile.date?.[1]))}</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='последний вход в игру'
									>{dateForm(parseDate(dataProfile.date?.[1]), 'large')}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<SimpleCell
									disabled
									subtitle='установленный фон'
								>{rooms[dataProfile.room-1] || 'Не установлен'}</SimpleCell>
							</Card>
							<Card>
								<TextTooltip text={<span>Номер локации — {dataProfile.location} из {mapLocations.length}</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='текущая локация'
									>{mapLocations[dataProfile.location-1]}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<SimpleCell
									disabled
									subtitle='активный питомец'
								>{pets[dataProfile.pet] || 'Не установлен'}</SimpleCell>
							</Card>
							<Card>
								<TextTooltip text={<span>Номер подписки — {Number(dataProfile.premium) || 0}</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='премиум'
									>{dataProfile.premium ? 'Активирован' : 'Отключен'}</SimpleCell>
								</TextTooltip>
							</Card>
							<Card>
								<SimpleCell
									disabled
									subtitle={numberForm(dataProfile.cups || 0, ['кубок арены', 'кубка арены', 'кубков арены'])}
								>{numberSpaces(dataProfile.cups || 0)}</SimpleCell>
							</Card>
							<Card>
								<TextTooltip text={<span>Сундук — {dataProfile.chest ? 'не собран' : 'собран'}<br/>Уровень лиги — {dataProfile.league} из {arenaLeagues.length-1}</span>} placement={'top'} appearance='inversion'>
									<SimpleCell
										disabled
										subtitle='лига арены'
									>{arenaLeagues[dataProfile.league]}</SimpleCell>
								</TextTooltip>
							</Card>
						</CardGrid>
					</div>
				</details>
			</> : false}
			{dataClan ? <>
				<Separator/>
				{settings.showGuild ? <>
					<details className='dvvDetails'>
						<summary className='dvvDetails__summary'>
							<SimpleCell
								after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
								subtitle={`${dataClan.name}, ${numberSpaces(dataClan.lvl)} уровень и ${buildPhrase({ number: dataClan.members.length, after: ['участник', 'участника', 'участников'] })} в составе`}
								before={<Avatar size={32} shadow={false} mode='app'><Icon20HomeOutline/></Avatar>}
							>Характеристики гильдии</SimpleCell>
						</summary>
						<div className='dvvDetails__content'>
							<CardGrid size='s'>
								<Card>
									{getRichTooltip(
										<SimpleCell
											disabled
											subtitle='лидер'
											after={getUserIcons(dataClan.leader)}
										><Link href={`https://vk.com/id${dataClan.leader?.vkId}`} target='_blank'>{dataClan.leader?.name}</Link></SimpleCell>,
										getUserCard(dataClan.leader)
									)}
								</Card>
								<Card>
									<SimpleCell
										disabled
										subtitle='номер гильдии'
									>{numberSpaces(dataClan.id)}</SimpleCell>
								</Card>
								<Card>
									<TextTooltip text={<span>
										Крепость — {dataClan.builds[0]} уровня<br/>
										Кузница — {dataClan.builds[1]} уровня<br/>
										Академия — {dataClan.builds[2]} уровня<br/><br/>
										Потом и кровью — {dataClan.academy[0]} уровня<br/>
										Отдышался - в бой — {dataClan.academy[1]} уровня<br/>
										Большие карманы — {dataClan.academy[2]} уровня<br/>
										Советы кузнеца — {dataClan.academy[3]} уровня<br/>
										Вместе сила — {dataClan.academy[4]} уровня<br/>
										Опытный охотник — {dataClan.academy[5]} уровня
									</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='суммарный уровень'
										>{numberSpaces(dataClan.lvl)}</SimpleCell>
									</TextTooltip>
								</Card>
							</CardGrid>
							<CardGrid size='xs'>
								<Card>
									<SimpleCell
										disabled
										subtitle={numberForm(dataClan.treasury[0], ['серебро в казне', 'серебра в казне', 'серебра в казне'])}
									>{numberSpaces(dataClan.treasury[0])}</SimpleCell>
								</Card>
								<Card>
									<SimpleCell
										disabled
										subtitle={numberForm(dataClan.treasury[1], ['золото в казне', 'золота в казне', 'золота в казне'])}
									>{numberSpaces(dataClan.treasury[1])}</SimpleCell>
								</Card>
								<Card>
									<TextTooltip text={<span>+10 стандартных мест<br/>+{buildPhrase({ number: dataClan.academy[4] * 4, after: ['место', 'места', 'мест'] })} за {dataClan.academy[4]} уровень «Вместе сила»</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='состав'
										>{dataClan.members.length} из {dataClan.academy[4] * 4 + 10}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<SimpleCell
										disabled
										subtitle={numberForm(dataClan.invitations, ['приглашение', 'приглашения', 'приглашений'])}
									>{dataClan.invitations}</SimpleCell>
								</Card>
							</CardGrid>
						</div>
					</details>
				</> : false}
				{settings.showGuildUpgrades ? <>
					<details className='dvvDetails'>
						<summary className='dvvDetails__summary'>
							<SimpleCell
								after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
								subtitle={`${buildPhrase({ number: dataClan.lvl, before: ['Прокачен', 'Прокачено', 'Прокачено'], after: ['уровень', 'уровня', 'уровней'] })}, ${numberSpaces(dataClan.guard?.reduce((x, y) => x + y))} уровень стражи и ${numberSpaces(dataClan.ram?.reduce((x, y) => x + y))} уровень тарана`}
								before={<Avatar size={32} shadow={false} mode='app'><Icon20ShieldLineOutline/></Avatar>}
							>Улучшения гильдии</SimpleCell>
						</summary>
						<div className='dvvDetails__content'>
							<CardGrid size='s'>
								<Card>
									<TextTooltip text={<span>Позволяет улучшать «Кузницу» и «Академию» до {dataClan.builds[0]} уровня</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='уровень Крепости'
										>{dataClan.builds[0]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>Позволяет создавать предметы в кузнице {dataClan.builds[1]} уровня</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='уровень Кузницы'
										>{dataClan.builds[1]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>Позволяет улучшать навыки гильдии до {dataClan.builds[2]} уровня</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='уровень Академии'
										>{dataClan.builds[2]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>На {buildPhrase({ number: dataClan.academy[0], after: ['энергию', 'энергии', 'энергии'] })} больше в максимальном запасе</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='потом и кровью'
										>{dataClan.academy[0]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>На {buildPhrase({ number: dataClan.academy[1], after: ['секунду', 'секунды', 'секунд'] })} быстрее восстановление энергии</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='отдышался - в бой'
										>{dataClan.academy[1]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>На {buildPhrase({ number: dataClan.academy[2], after: ['подарок', 'подарка', 'подарков'] })} от друзей больше в день</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='большие карманы'
										>{dataClan.academy[2]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>На {dataClan.academy[3]}% больше шанс успешной заточки в кузнице</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='советы кузнеца'
										>{dataClan.academy[3]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>На {buildPhrase({ number: dataClan.academy[4] * 4, after: ['место', 'места', 'мест'] })} больше в составе гильдии</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='вместе сила'
										>{dataClan.academy[4]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>На {dataClan.academy[5] * 5}% больше опыта за победу над боссом</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='опытный охотник'
										>{dataClan.academy[5]}</SimpleCell>
									</TextTooltip>
								</Card>
							</CardGrid>
							<CardGrid size='xs'>
								<Card>
									<TextTooltip text={<span>При обороне наносит {numberSpaces(dataClan.guard[0] * 50 + 100)} урона</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='атака стражи'
										>{dataClan.guard[0]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>При обороне поглощает {numberSpaces(dataClan.guard[1] * 5000 + 1000)} урона</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='защита стражи'
										>{dataClan.guard[1]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>При набеге наносит {numberSpaces(dataClan.ram[0] * 50 + 100)} урона</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='атака тарана'
										>{dataClan.ram[0]}</SimpleCell>
									</TextTooltip>
								</Card>
								<Card>
									<TextTooltip text={<span>При набеге поглощает {numberSpaces(dataClan.ram[1] * 5000 + 1000)} урона</span>} placement={'top'} appearance='inversion'>
										<SimpleCell
											disabled
											subtitle='защита тарана'
										>{dataClan.ram[1]}</SimpleCell>
									</TextTooltip>
								</Card>
							</CardGrid>
						</div>
					</details>
				</> : false}
				{settings.showGuildPersonnel ? <>
					<details className='dvvDetails'>
						<summary className='dvvDetails__summary'>
							<SimpleCell
								after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
								subtitle={`${buildPhrase({ number: dataClan.members.length, after: ['участник', 'участника', 'участников'] })} в составе`}
								before={<Avatar size={32} shadow={false} mode='app'><Icon20Users3Outline/></Avatar>}
							>Состав гильдии</SimpleCell>
						</summary>
						<div className='dvvDetails__content'>
							{[0].map(() => {
								if (!dataClan.members.length) return (<Footer key={0}>нет участников в составе</Footer>);
								let maxLvl = dataClan.members.map(member => member.lvl).reduce((x, y) => x + y);
								let maxDmg = dataClan.members.map(member => member.dmg).reduce((x, y) => x + y);
								let maxHp = dataClan.members.map(member => member.hp * 15).reduce((x, y) => x + y);
								return (<React.Fragment key={0}>
									<CardGrid size='xs'>
										<Card>
											<TextTooltip text={<span>+10 стандартных мест<br/>+{buildPhrase({ number: dataClan.academy[4] * 4, after: ['место', 'места', 'мест'] })} за {dataClan.academy[4]} уровень «Вместе сила»</span>} placement={'top'} appearance='inversion'>
												<SimpleCell
													disabled
													subtitle='состав'
												>{dataClan.members.length} из {dataClan.academy[4] * 4 + 10}</SimpleCell>
											</TextTooltip>
										</Card>
										<Card>
											<TextTooltip text={<span>{numberSpaces(maxDmg)} суммарный урон</span>} placement={'top'} appearance='inversion'>
												<SimpleCell
													disabled
													subtitle='средний урон'
												>{numberSpaces(Math.floor(maxDmg/dataClan.members.length))}</SimpleCell>
											</TextTooltip>
										</Card>
										<Card>
											<TextTooltip text={<span>{numberSpaces(maxHp)} суммарное здоровье</span>} placement={'top'} appearance='inversion'>
												<SimpleCell
													disabled
													subtitle='среднее здоровье'
												>{numberSpaces(Math.floor(maxHp/dataClan.members.length))}</SimpleCell>
											</TextTooltip>
										</Card>
										<Card>
											<TextTooltip text={<span>{numberSpaces(maxLvl)} суммарный уровень</span>} placement={'top'} appearance='inversion'>
												<SimpleCell
													disabled
													subtitle='средний уровень'
												>{numberSpaces(Math.floor(maxLvl/dataClan.members.length))}</SimpleCell>
											</TextTooltip>
										</Card>
									</CardGrid>
									<div className='TableCells'>
										{dataClan.members.sort((a, b) => a.rang - b.rang).map((member, x) => getUserCell({ user: member, key: x+1, rows: [{
												title: member.name
											}, {
												title: clanRangs[member.rang-1].toLowerCase(),
											}, {
												title: `${numberSpaces(member.dmg, ' ')} DMG`,
											}, {
												title: `${numberSpaces(member.hp * 15, ' ')} HP`,
										}], tooltip: getUserCard(member) }))}
									</div>
								</React.Fragment>);
							})}
						</div>
					</details>
				</> : false}
				{settings.showGuildEvents ? <>
					<details className='dvvDetails'>
						<summary className='dvvDetails__summary'>
							<SimpleCell
								after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
								subtitle={`${buildPhrase({ number: dataClan.actions.wars.to.length, before: ['Совершен', 'Совершено', 'Совершено'], after: ['набег', 'набега', 'набегов'] })} и ${buildPhrase({ number: dataClan.actions.bosses.length, before: ['убит', 'убито', 'убито'], after: ['босс', 'босса', 'боссов'] })}`}
								before={<Avatar size={32} shadow={false} mode='app'><Icon20NotificationOutline/></Avatar>}
							>События гильдии</SimpleCell>
						</summary>
						<div className='dvvDetails__content'>
							{[0].map(() => {
								let actions = [
									...dataClan.actions.bosses.map(item => ({
										time: item.time,
										text: `попытка убить рейд-босса ${
											item.id == 469 ? 'Катра Хитоэль' : 
											item.id == 465 ? 'Сартана' : 
											item.id == 454 ? 'Зачарованное Древо' : 
											item.id == 342 ? 'Кровавый Молох' : 
											item.id == 286 ? 'Древо Страж' : 
											item.id == 285 ? 'Ассасин' : 
											item.id == 284 ? 'Главарь Скелетов' : 
											item.id == 287 ? 'Северный Гоблин' : 'Неизвестно'
										}`,
									})),
									...dataClan.actions.create.map(item => ({
										time: item.time,
										text: 'создание гильдии',
									})),
									...dataClan.actions.members.map(item => ({
										time: item.time,
										text: `новый участник гильдии Player${item.id}`,
									})),
									...dataClan.actions.upgrades.map(item => ({
										time: item.time,
										text: `улучшение ${['Крепости', 'Кузницы', 'Академии'][item.id-1]} до ${item.lvl} уровня`,
									})),
									...dataClan.actions.wars.to.map(item => ({
										time: item.time,
										text: `${item.win ? 'успешный набег' : 'безуспешный набег'} на ${item.title}`,
									})),
									...dataClan.actions.wars.from.map(item => ({
										time: item.time,
										text: `${item.win ? 'успешная оборона от гильдии' : 'оборона пробита гильдией'} ${item.title}`,
									})),
								];
								if (!actions.length) return (<Footer key={0}>нет событий в истории</Footer>);
								return (<React.Fragment key={0}>
									<div className='TableCells'>
										{actions.sort((a, b) => b.time - a.time).map((action, x) => getUserCell({ key: x+1, rows: [{
												title: dateForm(action.time, 'large'),
											}, {
												title: action.text,
										}] }))}
									</div>
								</React.Fragment>);
							})}
						</div>
					</details>
				</> : false}
				{settings.showGuildDeposits ? <>
					<details className='dvvDetails'>
						<summary className='dvvDetails__summary'>
							<SimpleCell
								after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
								subtitle={`${buildPhrase({ number: dataClan.actions.treasury.day.length, after: ['пополнение', 'пополнения', 'пополнений'] })} за день и ${buildPhrase({ number: dataClan.actions.treasury.week.length, after: ['пополнение', 'пополнения', 'пополнений'] })} за неделю`}
								before={<Avatar size={32} shadow={false} mode='app'><Icon20MoneyTransferOutline/></Avatar>}
							>Пополнения гильдии</SimpleCell>
						</summary>
						<div className='dvvDetails__content'>
							{[0].map(() => {
								if (!dataClan.actions.treasury.day.length) return (!dataClan.actions.treasury.week.length ? false : <Footer key={0}>нет пополнений за текущий день</Footer>);
								let m1 = dataClan.actions.treasury.day.filter(action => action.currency == 1).sort((a, b) => b.amount - a.amount);
								if (m1.length) {
									m1 = m1.map(action => action.amount).reduce((x, y) => x + y);
								} else m1 = 0;
								let m3 = dataClan.actions.treasury.day.filter(action => action.currency == 3).sort((a, b) => b.amount - a.amount);
								if (m3.length) {
									m3 = m3.map(action => action.amount).reduce((x, y) => x + y);
								} else m3 = 0;
								return (<React.Fragment key={0}>
									<CardGrid size='m'>
										<Card>
											<SimpleCell
												disabled
												subtitle={numberForm(m1, ['серебро за день', 'серебра за день', 'серебра за день'])}
											>{numberSpaces(m1)}</SimpleCell>
										</Card>
										<Card>
											<SimpleCell
												disabled
												subtitle={numberForm(m3, ['золото за день', 'золота за день', 'золота за день'])}
											>{numberSpaces(m3)}</SimpleCell>
										</Card>
									</CardGrid>
									<div className='TableCells'>
										{dataClan.actions.treasury.day.map((action, x) => getUserCell({ user: action.user, key: x+1, rows: [{
												title: action.user.name
											}, {
												title: '',
											}, {
												title: `${numberSpaces(action.amount)} ${numberForm(action.amount, action.currency == 1 ? ['серебро', 'серебра', 'серебра'] : ['золото', 'золота', 'золота'])}`,
										}], tooltip: getUserCard(action.user) }))}
									</div>
								</React.Fragment>);
							})}
							{[0].map(() => {
								if (!dataClan.actions.treasury.week.length) return (<Footer key={0}>{!dataClan.actions.treasury.day.length ? 'нет пополнений за текущую неделю и день' : 'нет пополнений за текущую неделю'}</Footer>);
								let m1 = dataClan.actions.treasury.week.filter(action => action.currency == 1).sort((a, b) => b.amount - a.amount);
								if (m1.length) {
									m1 = m1.map(action => action.amount).reduce((x, y) => x + y);
								} else m1 = 0;
								let m3 = dataClan.actions.treasury.week.filter(action => action.currency == 3).sort((a, b) => b.amount - a.amount);
								if (m3.length) {
									m3 = m3.map(action => action.amount).reduce((x, y) => x + y);
								} else m3 = 0;
								return (<React.Fragment key={0}>
									<CardGrid size='m'>
										<Card>
											<SimpleCell
												disabled
												subtitle={numberForm(m1, ['серебро за день', 'серебра за день', 'серебра за день'])}
											>{numberSpaces(m1)}</SimpleCell>
										</Card>
										<Card>
											<SimpleCell
												disabled
												subtitle={numberForm(m3, ['золото за день', 'золота за день', 'золота за день'])}
											>{numberSpaces(m3)}</SimpleCell>
										</Card>
									</CardGrid>
									<div className='TableCells'>
										{dataClan.actions.treasury.week.map((action, x) => getUserCell({ user: action.user, key: x+1, rows: [{
												title: action.user.name
											}, {
												title: '',
											}, {
												title: `${numberSpaces(action.amount)} ${numberForm(action.amount, action.currency == 1 ? ['серебро', 'серебра', 'серебра'] : ['золото', 'золота', 'золота'])}`,
										}], tooltip: getUserCard(action.user) }))}
									</div>
								</React.Fragment>);
							})}
						</div>
					</details>
				</> : false}
			</> : false}
			{settings.showFight ? <>
				{dataFight && dataFight.boss ? <>
					<Separator/>
					<details className='dvvDetails' open>
						<summary className='dvvDetails__summary'>
							<SimpleCell
								after={<IconButton aria-label='Подробнее'><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }}/></IconButton>}
								subtitle={`${dataFight.boss.name}, в бою ${buildPhrase({ number: dataFight.members.length, after: ['участник', 'участника', 'участников'] })}`}
								before={<Avatar size={32} shadow={false} mode='app'><Icon20SkullOutline/></Avatar>}
							>Состояние боя</SimpleCell>
						</summary>
						<div className='dvvDetails__content'>
							{[0].map(() => {
								if (!dataFight.members.length) return (<Footer key={0}>нет участников в бою</Footer>);
								return (<React.Fragment key={0}>
									<CardGrid size='l'>
										<Card>
											<TextTooltip text={<span>Противник — {dataFight.boss.name}<br/>Урон — {numberSpaces(dataFight.boss.dmg)}<br/>Здоровье — {numberSpaces(dataFight.boss.hp)}<br/><br/>Создатель боя — <Link href={`https://vk.com/id${dataFight.creator?.vkId}`} target='_blank'>{dataFight.creator?.name}</Link><br/>Номер боя — {numberSpaces(dataFight.id)}<br/>В бою — {dataFight.members.length} из {dataFight.limit}</span>} placement={'top'} appearance='inversion'>
												<div className='Card__in'>
													<SimpleCell
														disabled
														subtitle='конец боя через'
													>{dataFight.timeout < 7200000 ? new Date(7200000 - dataFight.timeout).toUTCString().split(' ')[4] : '00:00:00'}</SimpleCell>
													<SimpleCell
														disabled
														subtitle='осталось здоровья'
													>{numberSpaces(dataFight.hp)}</SimpleCell>
													<SimpleCell
														disabled
														subtitle='урон игрока'
													>{numberSpaces(dataFight.members.find(member => member.id == dataProfile.id)?.dmg || 0)}</SimpleCell>
												</div>
											</TextTooltip>
										</Card>
									</CardGrid>
									<div className='TableCells'>
										{dataFight.members.sort((a, b) => b.dmg - a.dmg).map((member, x) => getUserCell({ user: {...member, avatar: ''}, key: x+1, rows: [{
												title: member.name
											}, {
												title: [0].map(() => <span className='TableCell__row-icons' key={0}>
													{member.id == dataProfile.id&&getTextTooltip(<Icon16View/>, 'Текущий игрок')}
													{member.id == dataFight.creator.id&&getTextTooltip(<Icon16Crown/>, 'Создатель боя')}
													{getUserIcons(member)}
												</span>),
											}, {
												title: numberSpaces(member.dmg, ' '),
										}], tooltip: getUserCard(member) }))}
									</div>
								</React.Fragment>);
							})}
						</div>
					</details>
				</> : false}
			</> : false}
		</>:<>
			<Placeholder icon={error ? <Icon24SadFaceOutline/> : <Spinner size='regular'/>} stretched>{error || hint}</Placeholder>
			{settings.showServers ? <>
				{error&&dataServers&&dataServers?.length ? <>
					<Separator/>
					{dataServers.map((server, key) => <SimpleCell
						onClick={() => setServer(server.id)}
						key={key}
						after={<IconButton aria-label='Перейти'><Icon16ChevronOutline width={16} height={16} style={{ padding: 8, color: 'var(--accent)' }}/></IconButton>}
						subtitle={`Профиль на сервере ${server.title}`}
						before={<InitialsAvatar mode='app' gradientColor={calcInitialsAvatarColor(server.user.vkId || server.user.id || 0)} size={32}>{server.user.tag}</InitialsAvatar>}
					>{server.user.name}, {server.user.lvl || 0} уровень</SimpleCell>)}
				</> : false}
			</> : false}
		</>
	);
};
const Script = (props) => {
	const { script, log, getData, getSettings, setSettings } = props;
	const globalSettings = getSettings();
	const settings = globalSettings[script.id]?.settings || script.settings;
	const {
		from = 0,
		to = 0,
		setPanel = () => log('Error render content by setPanel'),
		setContent = () => log('Error render content by setContent'),
	} = window.ScriptRoot || {};
	const [timestamp, setTimestamp] = useState(0);
	const [server, setServer] = useState(settings.selectedServer);
	const [selected, setSelected] = useState(false);
	const [loaded, setLoaded] = useState(false);
	log('Window.ScriptRoot', window.ScriptRoot);
	useEffect(() => {
		if (server != 0 && loaded) {
			log('Render content', { from, to, timestamp, server });
			setLoaded(false);
			setContent(<Content id={script.id} script={script} from={from} to={to} server={server} log={log} getData={getData} settings={settings} setServer={setServer} setSelected={setSelected} afterLoad={() => setLoaded(true)} timestamp={timestamp}/>);
			setSettings({
				key: 'selectedServer',
				value: server,
				id: script.id,
			});
		}
	}, [server, timestamp]);
	useEffect(() => {
		setLoaded(true);
	}, []);
	return (
		<TabsItem
			selected={selected}
			onClick={() => {
				setPanel('home');
				setTimestamp(+new Date());
			}}
			id={script.id}
			status={globalSettings.showVersion?<div className='vkuiTabsItem__status--count vkuiSubhead vkuiSubhead--sizeY-compact vkuiSubhead--w-2'>{script.version}</div>:false}
			after={server?<Counter size='s' mode='primary'>{['Эрмун', 'Антарес'][server-1]}</Counter>:false}
		>{script.title}</TabsItem>
	);
};


export default Script;