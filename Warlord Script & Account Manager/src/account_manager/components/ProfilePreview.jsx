import { Fragment } from 'react';
import { Avatar, Separator, SimpleCell } from '@vkontakte/vkui';

const format = (n) => Number(n).toLocaleString('ru-RU');

function gameSubtitle(game) {
	return [
		game.lvl ? `${game.lvl} ур.` : null,
		game.dmg ? `DMG ${format(game.dmg)}` : null,
		game.hp ? `HP ${format(game.hp)}` : null,
	].filter(Boolean).join(' · ');
}

// Строка только для чтения: без наведения и нажатия, но и без «неактивного» вида
// (disabled у VKUI делает ячейку тусклой).
function InfoCell(props) {
	return <SimpleCell hasHover={false} hasActive={false} {...props} />;
}

// Игровой профиль на сервере: вместо аватара номер сервера
function GameRow({ number, title, subtitle, overTitle }) {
	return (
		<InfoCell
			before={number ? <span className="WarlordAccountManagerProfilePreview__serverNumber">{number}</span> : undefined}
			overTitle={overTitle}
			subtitle={subtitle}
		>
			{title}
		</InfoCell>
	);
}

// Краткая сводка по профилю: кто это во ВКонтакте и кто в игре на каждом из серверов.
// Профиль ВК без подложки, серверы — одной серой карточкой с разделителями.
// preview: { status: 'loading' | 'ready', vk, servers, unavailable }
export function ProfilePreview({ id, preview }) {
	const loading = preview.status === 'loading';
	const { vk } = preview;
	const servers = preview.servers || [];

	let games;
	if (servers.length) {
		games = servers.map((server, index) => (
			<Fragment key={server.id}>
				{index > 0 && <Separator className="WarlordAccountManagerProfilePreview__separator" />}
				{server.game ? (
					<GameRow number={server.id} overTitle={server.title} title={server.game.nick} subtitle={gameSubtitle(server.game)} />
				) : (
					<GameRow number={server.id} overTitle={server.title} title={server.failed ? 'Сервер не ответил' : 'Профиль не найден'} />
				)}
			</Fragment>
		));
	} else if (loading) {
		games = <GameRow title="Загружаем…" />;
	} else {
		games = <GameRow title={preview.unavailable ? 'Сервер игры не отвечает' : 'Игрок не найден в игре'} />;
	}

	return (
		<div className="WarlordAccountManagerProfilePreview">
			<InfoCell
				before={<Avatar size={36} src={vk?.photo} initials={(vk?.name || '?').charAt(0).toUpperCase()} gradientColor="custom" />}
				subtitle={`ВКонтакте · id${id}`}
			>
				{vk?.name || (loading ? 'Загружаем…' : `Профиль id${id}`)}
			</InfoCell>
			<div className="WarlordAccountManagerProfilePreview__games">{games}</div>
		</div>
	);
}
