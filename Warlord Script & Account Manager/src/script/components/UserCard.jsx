import { Avatar, Button, ButtonGroup, Link, SimpleCell } from '@vkontakte/vkui';
import { Icon16Cancel, Icon16ChevronOutline, Icon16Crown, Icon16Done, Icon16Flash, Icon16User } from '@vkontakte/icons';
import { calcInitialsAvatarColor } from '../lib/format.js';
import { PATH_IMAGES } from '../lib/playerApi.js';
import { Hint } from './Hints.jsx';

// Значки игрока: порядочный, недобросовестный, разработчик, генерал и лидер гильдии
export const UserIcons = ({ user = {}, embedded = false }) => (
	<>
		{user.isVerified && <Hint embedded={embedded} maxWidth={240} text="Порядочный игрок"><Icon16Done /></Hint>}
		{user.isBad && <Hint embedded={embedded} maxWidth={240} text="Недобросовестный игрок"><Icon16Cancel /></Hint>}
		{user.isAdmin && <Hint embedded={embedded} maxWidth={240} text="Разработчик расширения"><Icon16Flash /></Hint>}
		{user.isGeneral && <Hint embedded={embedded} maxWidth={240} text="Генерал гильдии"><Icon16User /></Hint>}
		{user.isLeader && <Hint embedded={embedded} maxWidth={240} text="Лидер гильдии"><Icon16Crown /></Hint>}
	</>
);

const avatarOf = (user, size) => (user.avatar
	? <Avatar src={`${PATH_IMAGES}bot/arena/avatar_${user.avatar}.png`} className="WarlordScriptAppAvatar" noBorder size={size} />
	: <Avatar className="WarlordScriptAppAvatar" noBorder size={size} gradientColor={calcInitialsAvatarColor(user.vkId || user.id || 0)} initials={user.tag || '#'} />);

// Карточка игрока в подсказке: имя, ссылка и кнопки «Открыть» и «Написать»
export const UserCard = ({ user }) => (
	<div className="WarlordScriptUserCard">
		<SimpleCell
			hasHover={false}
			hasActive={false}
			before={avatarOf(user, 48)}
			badgeAfterTitle={<span className="WarlordScriptUserBadges"><UserIcons user={user} embedded /></span>}
			subtitle={<Link href={`https://vk.ru/id${user.vkId}`} target="_blank">vk.ru/id{user.vkId}</Link>}
		>
			{user.name}
		</SimpleCell>
		<ButtonGroup mode="horizontal" gap="s" stretched>
			<Button href={`https://vk.ru/id${user.vkId}`} target="_blank" after={<Icon16ChevronOutline />} appearance="accent" mode="secondary" size="m" stretched>Открыть</Button>
			<Button href={`https://vk.ru/im?sel=${user.vkId}`} target="_blank" after={<Icon16ChevronOutline />} appearance="accent" mode="secondary" size="m" stretched>Написать</Button>
		</ButtonGroup>
	</div>
);
