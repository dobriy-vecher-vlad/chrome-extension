import { useEffect, useState } from 'react';
import { Avatar, Footer, IconButton, Link, Placeholder, Separator, SimpleCell, Spinner } from '@vkontakte/vkui';
import {
	Icon16Crown,
	Icon16DropdownOutline,
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
	Icon16ChevronOutline,
} from '@vkontakte/icons';
import { loadPlayer, PATH_IMAGES } from '../lib/playerApi.js';
import { buildPhrase, dateForm, numberForm, numberSpaces, parseDate } from '../lib/format.js';
import { Actions, Banners } from './Banners.jsx';
import { Hint, Rich } from './Hints.jsx';
import { LazyRaidCard, TableRow } from './PlayerTable.jsx';
import { UserCard, UserIcons } from './UserCard.jsx';
import BOSS_NAMES from '../data/rangs.json';
import PETS from '../data/pets.json';
import ROOMS from '../data/rooms.json';
import REGIONS from '../data/regions.json';
import LEAGUES from '../data/leagues.json';

const RANGS = BOSS_NAMES;
const DAY = 1000 * 60 * 60 * 24;
const people = ['участник', 'участника', 'участников'];
const days = ['день', 'дня', 'дней'];

// Карточка с одним показателем: значение, подпись под ним и необязательная подсказка
function Stat({ label, value, tip, after, rich }) {
	let cell = <SimpleCell hasHover={false} hasActive={false} subtitle={label} after={after}>{value}</SimpleCell>;
	if (rich) cell = <Rich content={rich}>{cell}</Rich>;
	else if (tip) cell = <Hint text={tip}>{cell}</Hint>;
	return <div className="WarlordScriptStatCard">{cell}</div>;
}

// Ряд карточек: size — сколько их в строке (xs 4, s 3, m 2, l 1)
const GRID_COLUMNS = { xs: 4, s: 3, m: 2, l: 1 };
const Grid = ({ size, children }) => <div className={`WarlordScriptStatGrid WarlordScriptStatGrid--columns${GRID_COLUMNS[size]}`}>{children}</div>;

// Раскрывающийся раздел. В раскрытом состоянии одновременно только один (управляет родитель).
// Это не <details>: состоянием управляет родитель, а закрытое тело скрывается через CSS (см. styles.css).
// Содержимое создаётся при первом раскрытии, а не заранее: в закрытых разделах (таблицы состава гильдии, события, пополнения)
// сотни элементов, которые пользователь может ни разу не открыть.
function Section({ id, open, onToggle, icon, title, subtitle, children }) {
	const [mounted, setMounted] = useState(open);
	if (open && !mounted) setMounted(true);
	return (
		<div className={open ? 'WarlordScriptSection WarlordScriptSection--open' : 'WarlordScriptSection'}>
			<SimpleCell
				className="WarlordScriptSection__summary"
				aria-expanded={open}
				onClick={() => onToggle(id, !open)}
				after={<IconButton label="Подробнее"><Icon16DropdownOutline width={16} height={16} style={{ padding: 8 }} /></IconButton>}
				subtitle={subtitle}
				before={<Avatar size={32} className="WarlordScriptAppAvatar" noBorder>{icon}</Avatar>}
			>
				{title}
			</SimpleCell>
			<div className="WarlordScriptSection__body">
				<div className="WarlordScriptSection__content">{mounted && children}</div>
			</div>
		</div>
	);
}

const treasuryTotal = (list, currency) => list.filter((action) => action.currency === currency).map((action) => action.amount).reduce((x, y) => x + y, 0);

const BOSS_RAID_NAMES = {
	469: 'Катра Хитоэль',
	465: 'Сартана',
	454: 'Зачарованное Древо',
	342: 'Кровавый Молох',
	286: 'Древо Страж',
	285: 'Ассасин',
	284: 'Главарь Скелетов',
	287: 'Северный Гоблин',
};

const memberSorters = [
	(a, b) => a.rang - b.rang,
	(a, b) => b.dmg - a.dmg,
	(a, b) => b.hp - a.hp,
];

function PlayerSections({ data, settings, open, onToggle }) {
	const { profile, clan, fight, servers } = data;
	const guildName = profile.guild ? (clan ? clan.name : profile.guild) : 'Нет гильдии';
	return (
		<>
			{settings.showBanners && (
				<>
					{data.statuses.banners.length ? <Banners banners={data.statuses.banners} /> : false}
					{data.statuses.actions.length ? <Actions actions={data.statuses.actions} /> : false}
				</>
			)}
			{settings.showServers && servers.length ? (
				<>
					{servers.map((server) => <ServerRow key={server.id} server={server} onSelect={data.onServer} />)}
					<Separator padding />
				</>
			) : false}
			<Section
				id="profile"
				open={open.has('profile')}
				onToggle={onToggle}
				icon={<Icon20UserOutline />}
				title="Характеристики игрока"
				subtitle={`${profile.name}, ${numberSpaces(profile.dmg)} урона и ${numberSpaces(profile.hp * 15)} здоровья`}
			>
				<Grid size="s">
					<Stat label="номер профиля" after={<UserIcons user={profile} />} rich={<UserCard user={profile} />} value={<Link href={`https://vk.ru/id${profile.vkId}`} target="_blank">{profile.id}</Link>} />
					<Stat label="никнейм" value={profile.name} />
					<Stat label="уровень" value={numberSpaces(profile.lvl)} tip={<span>{numberSpaces(profile.exp)} опыта</span>} />
					<Stat label="урон" value={numberSpaces(profile.dmg)} />
					<Stat label="здоровье" value={numberSpaces(profile.hp * 15)} />
					<Stat
						label={profile.guild ? (clan ? 'гильдия' : 'номер гильдии') : 'гильдия'}
						value={guildName}
						tip={profile.guild
							? <span>Ранг — {RANGS[profile.rang - 1]?.title?.toLowerCase()}<br />Стаж — {buildPhrase({ number: Math.floor(Number(profile.date[2]) / 1000 / 60 / 60 / 24), after: days })}</span>
							: <span>Игрок не состоит в гильдии</span>}
					/>
				</Grid>
			</Section>
			{settings.showSkills && <SkillsSection profile={profile} open={open.has('skills')} onToggle={onToggle} />}
			{settings.showExtra && <ExtraSection profile={profile} open={open.has('extra')} onToggle={onToggle} />}
			{clan && (
				<>
					<Separator padding />
					{settings.showGuild && <GuildSection clan={clan} open={open.has('guild')} onToggle={onToggle} />}
					{settings.showGuildUpgrades && <UpgradesSection clan={clan} open={open.has('upgrades')} onToggle={onToggle} />}
					{settings.showGuildPersonnel && <PersonnelSection clan={clan} sorting={settings.sortingGuildPersonnel} open={open.has('personnel')} onToggle={onToggle} />}
					{settings.showGuildEvents && <EventsSection clan={clan} loadWar={data.loadWar} open={open.has('events')} onToggle={onToggle} />}
					{settings.showGuildDeposits && <DepositsSection clan={clan} open={open.has('deposits')} onToggle={onToggle} />}
				</>
			)}
			{settings.showFight && fight && fight.boss && (
				<>
					<Separator padding />
					<FightSection fight={fight} profile={profile} open={open.has('fight')} onToggle={onToggle} />
				</>
			)}
		</>
	);
}

function SkillsSection({ profile, open, onToggle }) {
	const [endurance, ferocious, shield, invisible, healer] = [0, 1, 2, 3, 4].map((i) => profile.skills?.[i]);
	const damage = (n) => buildPhrase({ number: n, after: ['урон', 'урона', 'урона'] });
	const health = (n) => buildPhrase({ number: n, after: ['здоровье', 'здоровья', 'здоровья'] });
	return (
		<Section
			id="skills"
			open={open}
			onToggle={onToggle}
			icon={<Icon20BookOutline />}
			title="Навыки игрока"
			subtitle={buildPhrase({ number: profile.skills?.reduce((x, y) => x + y), before: ['Прокачен', 'Прокачено', 'Прокачено'], after: ['уровень', 'уровня', 'уровней'] })}
		>
			<Grid size="s">
				<Stat label="урон" value={numberSpaces(profile.dmg)} tip={<span>Наносит {damage(profile.dmg)} по противнику</span>} />
				<Stat label="выносливость" value={numberSpaces(endurance)} tip={<span>На {health((endurance || 0) * 15)} больше у персонажа</span>} />
				<Stat label="свирепый удар" value={numberSpaces(ferocious)} tip={<span>Наносит {damage((ferocious || 0) * 5 + profile.dmg)} по противнику</span>} />
				<Stat label="блок щитом" value={numberSpaces(shield)} tip={<span>Блокирует {damage(shield || 0)} от противника</span>} />
				<Stat label="невидимый удар" value={numberSpaces(invisible)} tip={<span>Наносит {damage((invisible || 0) * 7 + profile.dmg)} по противнику</span>} />
				<Stat label="мастер целитель" value={numberSpaces(healer)} tip={<span>Восстанавливает {health((healer || 0) * 3 + 250)} персонажу</span>} />
			</Grid>
		</Section>
	);
}

function ExtraSection({ profile, open, onToggle }) {
	const firstDays = Math.round(Number(profile.date?.[0]) / DAY);
	const years = Math.floor(firstDays / 365);
	return (
		<Section
			id="extra"
			open={open}
			onToggle={onToggle}
			icon={<Icon20Stars />}
			title="Прочие характеристики игрока"
			subtitle={`Первый вход ${buildPhrase({ number: Math.round(Number(profile.date?.[0]) / DAY), after: days })} назад, ${profile.premium ? 'использует' : 'не использует'} премиум`}
		>
			<Grid size="s">
				<Stat
					label={numberForm(firstDays, ['день в игре', 'дня в игре', 'дней в игре'])}
					value={numberSpaces(firstDays)}
					tip={<span>{buildPhrase({ number: years, after: ['год', 'года', 'лет'] })} и {buildPhrase({ number: firstDays - 365 * years, after: days })}</span>}
				/>
				<Stat label="первый вход в игру" value={dateForm(parseDate(profile.date?.[0]), 'large')} tip={<span>{dateForm(parseDate(profile.date?.[0]))}</span>} />
				<Stat label="последний вход в игру" value={dateForm(parseDate(profile.date?.[1]), 'large')} tip={<span>{dateForm(parseDate(profile.date?.[1]))}</span>} />
				<Stat label="установленный фон" value={ROOMS[profile.room - 1]?.title || 'Не установлен'} />
				<Stat label="текущая локация" value={REGIONS[profile.location - 1]?.title} tip={<span>Номер локации — {profile.location} из {REGIONS.length}</span>} />
				<Stat label="активный питомец" value={[{ title: 'Нет питомца' }, ...PETS][profile.pet]?.title || 'Не установлен'} />
				<Stat label="премиум" value={profile.premium ? 'Активирован' : 'Отключён'} tip={<span>Номер подписки — {Number(profile.premium) || 0}</span>} />
				<Stat label={numberForm(profile.cups || 0, ['кубок арены', 'кубка арены', 'кубков арены'])} value={numberSpaces(profile.cups || 0)} />
				<Stat
					label="лига арены"
					value={[{ title: 'Нет лиги' }, ...LEAGUES][profile.league]?.title}
					tip={<span>Сундук — {profile.chest ? 'не собран' : 'собран'}<br />Уровень лиги — {profile.league} из {LEAGUES.length - 1}</span>}
				/>
			</Grid>
		</Section>
	);
}

function GuildSection({ clan, open, onToggle }) {
	const [fortress, forge, academy] = clan.builds;
	const places = (n) => buildPhrase({ number: n, after: ['место', 'места', 'мест'] });
	return (
		<Section
			id="guild"
			open={open}
			onToggle={onToggle}
			icon={<Icon20HomeOutline />}
			title="Характеристики гильдии"
			subtitle={`${clan.name}, ${numberSpaces(clan.lvl)} уровень и ${buildPhrase({ number: clan.members.length, after: people })} в составе`}
		>
			<Grid size="s">
				<div className="WarlordScriptStatCard">
					<Rich content={<UserCard user={clan.leader} />}>
						<SimpleCell hasHover={false} hasActive={false} subtitle="лидер" after={<UserIcons user={clan.leader} />}>
							<Link href={`https://vk.ru/id${clan.leader?.vkId}`} target="_blank">{clan.leader?.name}</Link>
						</SimpleCell>
					</Rich>
				</div>
				<Stat label="номер гильдии" value={numberSpaces(clan.id)} />
				<Stat
					label="суммарный уровень"
					value={numberSpaces(clan.lvl)}
					tip={(
						<span>
							Крепость — {fortress} уровня<br />
							Кузница — {forge} уровня<br />
							Академия — {academy} уровня<br /><br />
							Потом и кровью — {clan.academy[0]} уровня<br />
							Отдышался - в бой — {clan.academy[1]} уровня<br />
							Большие карманы — {clan.academy[2]} уровня<br />
							Советы кузнеца — {clan.academy[3]} уровня<br />
							Вместе сила — {clan.academy[4]} уровня<br />
							Опытный охотник — {clan.academy[5]} уровня
						</span>
					)}
				/>
			</Grid>
			<Grid size="xs">
				<Stat label={numberForm(clan.treasury[0], ['серебро в казне', 'серебра в казне', 'серебра в казне'])} value={numberSpaces(clan.treasury[0])} />
				<Stat label={numberForm(clan.treasury[1], ['золото в казне', 'золота в казне', 'золота в казне'])} value={numberSpaces(clan.treasury[1])} />
				<Stat
					label="состав"
					value={`${clan.members.length} из ${clan.academy[4] * 4 + 10}`}
					tip={<span>+10 стандартных мест<br />+{places(clan.academy[4] * 4)} за {clan.academy[4]} уровень «Вместе сила»</span>}
				/>
				<Stat label={numberForm(clan.invitations, ['приглашение', 'приглашения', 'приглашений'])} value={clan.invitations} />
			</Grid>
		</Section>
	);
}

function UpgradesSection({ clan, open, onToggle }) {
	const [fortress, forge, academy] = clan.builds;
	const guard = clan.guard;
	const ram = clan.ram;
	const sum = (list) => numberSpaces(list?.reduce((x, y) => x + y));
	return (
		<Section
			id="upgrades"
			open={open}
			onToggle={onToggle}
			icon={<Icon20ShieldLineOutline />}
			title="Улучшения гильдии"
			subtitle={`${buildPhrase({ number: clan.lvl, before: ['Прокачен', 'Прокачено', 'Прокачено'], after: ['уровень', 'уровня', 'уровней'] })}, ${sum(guard)} уровень стражи и ${sum(ram)} уровень тарана`}
		>
			<Grid size="s">
				<Stat label="уровень Крепости" value={fortress} tip={<span>Позволяет улучшать «Кузницу» и «Академию» до {fortress} уровня</span>} />
				<Stat label="уровень Кузницы" value={forge} tip={<span>Позволяет создавать предметы в кузнице {forge} уровня</span>} />
				<Stat label="уровень Академии" value={academy} tip={<span>Позволяет улучшать навыки гильдии до {academy} уровня</span>} />
				<Stat label="потом и кровью" value={clan.academy[0]} tip={<span>На {buildPhrase({ number: clan.academy[0], after: ['энергию', 'энергии', 'энергии'] })} больше в максимальном запасе</span>} />
				<Stat label="отдышался - в бой" value={clan.academy[1]} tip={<span>На {buildPhrase({ number: clan.academy[1], after: ['секунду', 'секунды', 'секунд'] })} быстрее восстановление энергии</span>} />
				<Stat label="большие карманы" value={clan.academy[2]} tip={<span>На {buildPhrase({ number: clan.academy[2], after: ['подарок', 'подарка', 'подарков'] })} от друзей больше в день</span>} />
				<Stat label="советы кузнеца" value={clan.academy[3]} tip={<span>На {clan.academy[3]}% больше шанс успешной заточки в кузнице</span>} />
				<Stat label="вместе сила" value={clan.academy[4]} tip={<span>На {buildPhrase({ number: clan.academy[4] * 4, after: ['место', 'места', 'мест'] })} больше в составе гильдии</span>} />
				<Stat label="опытный охотник" value={clan.academy[5]} tip={<span>На {clan.academy[5] * 5}% больше опыта за победу над боссом</span>} />
			</Grid>
			<Grid size="xs">
				<Stat label="атака стражи" value={guard[0]} tip={<span>При обороне наносит {numberSpaces(guard[0] * 50 + 100)} урона</span>} />
				<Stat label="защита стражи" value={guard[1]} tip={<span>При обороне поглощает {numberSpaces(guard[1] * 5000 + 1000)} урона</span>} />
				<Stat label="атака тарана" value={ram[0]} tip={<span>При набеге наносит {numberSpaces(ram[0] * 50 + 100)} урона</span>} />
				<Stat label="защита тарана" value={ram[1]} tip={<span>При набеге поглощает {numberSpaces(ram[1] * 5000 + 1000)} урона</span>} />
			</Grid>
		</Section>
	);
}

function PersonnelSection({ clan, sorting, open, onToggle }) {
	const members = clan.members;
	let body;
	if (!members.length) {
		body = <Footer>нет участников в составе</Footer>;
	} else {
		const total = (key, factor = 1) => members.map((member) => member[key] * factor).reduce((x, y) => x + y);
		const maxLvl = total('lvl');
		const maxDmg = total('dmg');
		const maxHp = total('hp', 15);
		body = (
			<>
				<Grid size="xs">
					<Stat
						label="состав"
						value={`${members.length} из ${clan.academy[4] * 4 + 10}`}
						tip={<span>+10 стандартных мест<br />+{buildPhrase({ number: clan.academy[4] * 4, after: ['место', 'места', 'мест'] })} за {clan.academy[4]} уровень «Вместе сила»</span>}
					/>
					<Stat label="средний урон" value={numberSpaces(Math.floor(maxDmg / members.length))} tip={<span>{numberSpaces(maxDmg)} суммарный урон</span>} />
					<Stat label="среднее здоровье" value={numberSpaces(Math.floor(maxHp / members.length))} tip={<span>{numberSpaces(maxHp)} суммарное здоровье</span>} />
					<Stat label="средний уровень" value={numberSpaces(Math.floor(maxLvl / members.length))} tip={<span>{numberSpaces(maxLvl)} суммарный уровень</span>} />
				</Grid>
				<div className="WarlordScriptPlayerTable">
					{members.slice().sort(memberSorters[sorting - 1] || memberSorters[0]).map((member, x) => (
						<TableRow
							key={member.id}
							user={member}
							index={x + 1}
							rows={[
								{ title: member.name },
								{ title: RANGS[member.rang - 1]?.title?.toLowerCase() },
								{ title: `${numberSpaces(member.dmg, ' ')} DMG` },
								{ title: `${numberSpaces(member.hp * 15, ' ')} HP` },
							]}
							tooltip={<UserCard user={member} />}
						/>
					))}
				</div>
			</>
		);
	}
	return (
		<Section
			id="personnel"
			open={open}
			onToggle={onToggle}
			icon={<Icon20Users3Outline />}
			title="Состав гильдии"
			subtitle={`${buildPhrase({ number: members.length, after: people })} в составе`}
		>
			{body}
		</Section>
	);
}

function EventsSection({ clan, loadWar, open, onToggle }) {
	const { actions } = clan;
	const events = [
		...actions.bosses.map((item) => ({ time: item.time, text: `попытка убить рейд-босса ${BOSS_RAID_NAMES[item.id] || 'Неизвестно'}` })),
		...actions.create.map((item) => ({ time: item.time, text: 'создание гильдии' })),
		...actions.members.map((item) => ({ time: item.time, text: `новый участник гильдии Player${item.id}` })),
		...actions.upgrades.map((item) => ({ time: item.time, text: `улучшение ${['Крепости', 'Кузницы', 'Академии'][item.id - 1]} до ${item.lvl} уровня` })),
		...actions.wars.to.map((item) => ({ time: item.time, text: `${item.win ? 'успешный набег' : 'безуспешный набег'} на ${item.title}`, tooltip: !item.guild && item.win ? <LazyRaidCard id={item.id} loadWar={loadWar} /> : false })),
		...actions.wars.from.map((item) => ({ time: item.time, text: `${item.win ? 'успешная оборона от гильдии' : 'оборона пробита гильдией'} ${item.title}` })),
	];
	return (
		<Section
			id="events"
			open={open}
			onToggle={onToggle}
			icon={<Icon20NotificationOutline />}
			title="События гильдии"
			subtitle={`${buildPhrase({ number: actions.wars.to.length, before: ['Совершен', 'Совершено', 'Совершено'], after: ['набег', 'набега', 'набегов'] })} и ${buildPhrase({ number: actions.bosses.length, before: ['убит', 'убито', 'убито'], after: ['босс', 'босса', 'боссов'] })}`}
		>
			{!events.length ? <Footer>нет событий в истории</Footer> : (
				<div className="WarlordScriptPlayerTable">
					{events.sort((a, b) => b.time - a.time).map((action, x) => (
						<TableRow key={x} index={x + 1} rows={[{ title: dateForm(action.time, 'large') }, { title: action.text }]} tooltip={action.tooltip ? action.tooltip : false} tooltipSize={640} />
					))}
				</div>
			)}
		</Section>
	);
}

// Пополнения казны за период (день или неделя)
function Deposits({ list, period }) {
	const money = [['серебро', 'серебра', 'серебра'], ['золото', 'золота', 'золота']];
	const m1 = treasuryTotal(list, 1);
	const m3 = treasuryTotal(list, 3);
	return (
		<>
			<Grid size="m">
				<Stat label={numberForm(m1, [`серебро за ${period}`, `серебра за ${period}`, `серебра за ${period}`])} value={numberSpaces(m1)} />
				<Stat label={numberForm(m3, [`золото за ${period}`, `золота за ${period}`, `золота за ${period}`])} value={numberSpaces(m3)} />
			</Grid>
			<div className="WarlordScriptPlayerTable">
				{list.map((action, x) => (
					<TableRow
						key={x}
						user={action.user}
						index={x + 1}
						rows={[
							{ title: action.user.name },
							{ title: '' },
							{ title: `${numberSpaces(action.amount)} ${numberForm(action.amount, action.currency === 1 ? money[0] : money[1])}` },
						]}
						tooltip={<UserCard user={action.user} />}
					/>
				))}
			</div>
		</>
	);
}

function DepositsSection({ clan, open, onToggle }) {
	const { day, week } = clan.actions.treasury;
	const deposits = (n) => buildPhrase({ number: n, after: ['пополнение', 'пополнения', 'пополнений'] });
	let dayBody;
	if (!day.length) dayBody = !week.length ? false : <Footer>нет пополнений за текущий день</Footer>;
	else dayBody = <Deposits list={day} period="день" />;
	const weekBody = !week.length
		? <Footer>{!day.length ? 'нет пополнений за текущую неделю и день' : 'нет пополнений за текущую неделю'}</Footer>
		: <Deposits list={week} period="неделю" />;
	return (
		<Section
			id="deposits"
			open={open}
			onToggle={onToggle}
			icon={<Icon20MoneyTransferOutline />}
			title="Пополнения гильдии"
			subtitle={`${deposits(day.length)} за день и ${deposits(week.length)} за неделю`}
		>
			{dayBody}
			{weekBody}
		</Section>
	);
}

const FIGHT_LENGTH = 7200000; // бой длится два часа, timeout — сколько прошло с его начала на момент загрузки

// Время до конца боя, живой отсчёт: раз в секунду пересчитывается от момента загрузки данных, перерисовывается только он сам
function FightTimer({ timeout }) {
	const [loadedAt] = useState(() => Date.now());
	const [, setTick] = useState(0);
	const left = Math.max(0, FIGHT_LENGTH - (timeout + Date.now() - loadedAt));
	const finished = left <= 0;
	useEffect(() => {
		if (finished) return undefined;
		const timer = setInterval(() => setTick((n) => n + 1), 1000);
		return () => clearInterval(timer);
	}, [finished]);
	return new Date(left).toUTCString().split(' ')[4];
}

function FightSection({ fight, profile, open, onToggle }) {
	let body;
	if (!fight.members.length) {
		body = <Footer>нет участников в бою</Footer>;
	} else {
		const own = fight.members.find((member) => member.id === profile.id);
		body = (
			<>
				<Grid size="l">
					<div className="WarlordScriptStatCard">
						<Hint text={(
							<span>
								Противник — {fight.boss.name}<br />Урон — {numberSpaces(fight.boss.dmg)}<br />Здоровье — {numberSpaces(fight.boss.hp)}<br /><br />
								Создатель боя — <Link href={`https://vk.ru/id${fight.creator?.vkId}`} target="_blank">{fight.creator?.name}</Link><br />
								Номер боя — {numberSpaces(fight.id)}<br />В бою — {fight.members.length} из {fight.limit}
							</span>
						)}
						>
							<div className="WarlordScriptStatCard__content">
								<SimpleCell hasHover={false} hasActive={false} subtitle="конец боя через"><FightTimer timeout={fight.timeout} /></SimpleCell>
								<SimpleCell hasHover={false} hasActive={false} subtitle="осталось здоровья">{numberSpaces(fight.hp)}</SimpleCell>
								<SimpleCell hasHover={false} hasActive={false} subtitle="урон игрока">{numberSpaces(own?.dmg || 0)}</SimpleCell>
							</div>
						</Hint>
					</div>
				</Grid>
				<div className="WarlordScriptPlayerTable">
					{fight.members.slice().sort((a, b) => b.dmg - a.dmg).map((member, x) => (
						<TableRow
							key={x}
							user={{ ...member, avatar: '' }}
							index={x + 1}
							rows={[
								{ title: member.name },
								{
									title: (
										<span className="WarlordScriptPlayerTable__cellIcons">
											{member.id === profile.id && <Hint text="Текущий игрок"><Icon16View /></Hint>}
											{member.id === fight.creator.id && <Hint text="Создатель боя"><Icon16Crown /></Hint>}
											<UserIcons user={member} />
										</span>
									),
								},
								{ title: numberSpaces(member.dmg, ' ') },
							]}
							tooltip={<UserCard user={member} />}
						/>
					))}
				</div>
			</>
		);
	}
	return (
		<Section
			id="fight"
			open={open}
			onToggle={onToggle}
			icon={<Icon20SkullOutline />}
			title="Состояние боя"
			subtitle={`${fight.boss.name}, в бою ${buildPhrase({ number: fight.members.length, after: people })}`}
		>
			{body}
		</Section>
	);
}

// Профиль игрока на другом сервере: переход к нему
function ServerRow({ server, onSelect }) {
	return (
		<SimpleCell
			onClick={() => onSelect(server.id)}
			after={<IconButton label="Перейти"><Icon16ChevronOutline width={16} height={16} style={{ padding: 8, color: 'var(--vkui--color_icon_accent)' }} /></IconButton>}
			subtitle={`Профиль на сервере ${server.title}`}
			before={<Avatar src={`${PATH_IMAGES}bot/arena/avatar_1.png`} className="WarlordScriptAppAvatar" noBorder size={32} />}
		>
			{server.user.name}, {server.user.lvl || 0} уровень
		</SimpleCell>
	);
}

// Содержимое вкладки: загружает данные игрока и показывает их, а пока грузит или при ошибке показывает подсказку.
// reloadKey меняется, когда нужно загрузить заново (клик по вкладке).
export function Content({ from, to, server, settings, reloadKey, onServer, onLoaded }) {
	const [hint, setHint] = useState('Загружаем данные');
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);
	const [otherServers, setOtherServers] = useState(null);
	const [open, setOpen] = useState(() => new Set());

	useEffect(() => {
		let alive = true;
		setHint('Загружаем данные');
		setError(null);
		setData(null);
		setOtherServers(null);
		setOpen(new Set());
		(async () => {
			try {
				const result = await loadPlayer({ from, to, server, settings, onHint: (text) => alive && setHint(text) });
				if (!alive) return;
				setData({ ...result, onServer });
				// сначала раскрыты характеристики игрока и, если он в бою, состояние боя
				setOpen(new Set(['profile', ...(result.fight && settings.showFight && result.fight.boss ? ['fight'] : [])]));
			} catch (failure) {
				if (!alive) return;
				setError(failure?.message || 'Ошибка при чтении данных');
				setOtherServers(failure?.servers || null);
			}
			if (alive) onLoaded?.();
		})();
		return () => { alive = false; };
	}, [to, server, reloadKey]);

	if (data) {
		// раскрывая раздел, закрываем остальные
		// (событие toggle приходит и когда раскрытие поменяли мы сами: такие, где состояние уже совпадает, пропускаем)
		const toggle = (id, opened) => setOpen((current) => {
			if (opened === current.has(id)) return current;
			if (opened) return new Set([id]);
			const next = new Set(current);
			next.delete(id);
			return next;
		});
		return <PlayerSections data={data} settings={settings} open={open} onToggle={toggle} />;
	}
	return (
		<>
			<Placeholder.Container stretched>
				<Placeholder.Icon>{error ? <Icon24SadFaceOutline /> : <Spinner size="m" />}</Placeholder.Icon>
				<Placeholder.Description>{error || hint}</Placeholder.Description>
			</Placeholder.Container>
			{settings.showServers && error && otherServers?.length ? (
				<>
					<Separator padding />
					{otherServers.map((item) => <ServerRow key={item.id} server={item} onSelect={onServer} />)}
				</>
			) : false}
		</>
	);
}
