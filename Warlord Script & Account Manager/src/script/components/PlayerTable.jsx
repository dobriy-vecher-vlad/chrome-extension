import { useEffect, useState } from 'react';
import { Avatar, SimpleCell } from '@vkontakte/vkui';
import { buildPhrase, calcInitialsAvatarColor, numberSpaces } from '../lib/format.js';
import { PATH_IMAGES } from '../lib/playerApi.js';
import { Rich } from './Hints.jsx';
import { UserCard } from './UserCard.jsx';

const noop = () => {};

// Строка таблицы: номер, (аватар), ячейки. rows: [{ title, right }]
export function TableRow({ user = {}, index = 0, rows = [], tooltip = false, tooltipSize = 320 }) {
	const hasAvatar = typeof user.avatar !== 'undefined';
	const gap = 8;
	const keyWidth = 32;
	const avatarWidth = 32;
	const nameWidth = 25;
	const rest = rows.length - 1;
	const columns = `${keyWidth}px ${hasAvatar ? `${avatarWidth}px ` : ''}${nameWidth}% repeat(${rest}, calc(${(100 - nameWidth) / rest}% - ${(keyWidth + (hasAvatar ? avatarWidth : 0) + gap * (rows.length + (hasAvatar ? 1 : 0))) / rest}px))`;
	const cell = (
		<SimpleCell {...(user.vkId ? { href: `https://vk.ru/id${user.vkId}`, target: '_blank' } : { onClick: noop })} className="WarlordScriptPlayerTable__row">
			<div className="WarlordScriptPlayerTable__rowContent" style={{ gridTemplateColumns: columns, gridGap: gap, minHeight: avatarWidth }}>
				<div className="WarlordScriptPlayerTable__cell WarlordScriptPlayerTable__cell--index" title={String(index)}><span>{index}</span></div>
				{hasAvatar && (
					<div className="WarlordScriptPlayerTable__cell WarlordScriptPlayerTable__cell--avatar" title={`avatar_${user.avatar}.png`}>
						{String(user.avatar).length
							? <Avatar src={`${PATH_IMAGES}bot/arena/avatar_${user.avatar}.png`} className="WarlordScriptAppAvatar" noBorder size={avatarWidth} />
							: <Avatar className="WarlordScriptAppAvatar" noBorder size={avatarWidth} gradientColor={calcInitialsAvatarColor(user.vkId || user.id || 0)} initials={user.tag || '#'} />}
					</div>
				)}
				{rows.map((row, x) => (
					<div key={x} className="WarlordScriptPlayerTable__cell" title={typeof row.title === 'string' ? row.title : undefined} style={{ justifyContent: row.right ? 'flex-end' : 'space-between' }}>
						<span>{row.title}</span>
					</div>
				))}
			</div>
		</SimpleCell>
	);
	return tooltip ? <Rich content={tooltip} size={tooltipSize}>{cell}</Rich> : cell;
}

// Набег: стороны, участники и награды
export const RaidCard = ({ data }) => {
	const members = (list) => list.slice().sort((a, b) => b.dmg - a.dmg);
	const side = (list, withTooltip) => (
		<div className="WarlordScriptPlayerTable">
			{members(list).map((member, x) => (
				<TableRow
					key={x}
					user={{ ...member, avatar: member.bot ? `boss_${member.id}` : member.avatar }}
					index={x + 1}
					rows={[{ title: member.name }, { title: numberSpaces(member.dmg, ' ') }]}
					tooltip={withTooltip && !member.bot ? <UserCard user={member} /> : false}
				/>
			))}
		</div>
	);
	const silver = (n) => buildPhrase({ number: n, after: ['серебро', 'серебра', 'серебра'] });
	const gold = (n) => buildPhrase({ number: n, after: ['золото', 'золота', 'золота'] });
	return (
		<div className="WarlordScriptRaidCard">
			<div className="WarlordScriptStatGrid WarlordScriptStatGrid--columns2 WarlordScriptRaidCard__head">
				<div className="WarlordScriptStatCard"><SimpleCell hasHover={false} hasActive={false} subtitle="атакующие">{buildPhrase({ number: data.involved, after: ['участник', 'участника', 'участников'] })}</SimpleCell></div>
				<div className="WarlordScriptStatCard"><SimpleCell hasHover={false} hasActive={false} subtitle="обороняющиеся">{buildPhrase({ number: data.members[1].length, after: ['участник', 'участника', 'участников'] })}</SimpleCell></div>
			</div>
			<div className="WarlordScriptRaidCard__sides">
				<div className="WarlordScriptRaidCard__side">{side(data.members[0], true)}</div>
				<div className="WarlordScriptRaidCard__side">{side(data.members[1], false)}</div>
			</div>
			<div className="WarlordScriptStatGrid WarlordScriptStatGrid--columns2 WarlordScriptRaidCard__footer">
				<div className="WarlordScriptStatCard"><SimpleCell hasHover={false} hasActive={false} subtitle="общая казна">{silver(data.treasury[0])} и {gold(data.treasury[1])}</SimpleCell></div>
				<div className="WarlordScriptStatCard"><SimpleCell hasHover={false} hasActive={false} subtitle="доля каждого">{silver(data.reward[0])} и {gold(data.reward[1])}</SimpleCell></div>
			</div>
		</div>
	);
};

// Подсказка с набегом: данные запрашиваются, когда подсказку впервые открыли (см. loadWar в api.js)
export function LazyRaidCard({ id, loadWar }) {
	const [war, setWar] = useState(undefined); // undefined — загружается, null — не удалось
	useEffect(() => {
		let alive = true;
		loadWar(id).then((loaded) => alive && setWar(loaded));
		return () => { alive = false; };
	}, [id, loadWar]);
	if (war) return <RaidCard data={war} />;
	return <div className="WarlordScriptRaidCard__status">{war === null ? 'Не удалось загрузить данные набега' : 'Загружаем данные набега…'}</div>;
}
