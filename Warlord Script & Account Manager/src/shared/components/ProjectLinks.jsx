import { Avatar, Separator, SimpleCell } from '@vkontakte/vkui';
import { Icon28ServicesOutline, Icon28Users3Outline } from '@vkontakte/icons';
import { useVkImage } from '../hooks/useVkImage.js';
import { GROUP, HELPER } from '../lib/projectLinks.js';

// Ссылки на сообщество и приложение проекта: последние пункты меню окна настроек.
// Аватар сообщества и иконка приложения берутся из VK API; пока их нет, показываем общие значки.
// token — токен для VK API (он есть только на странице игры; без него показываем то, что сохранено ранее).
export function ProjectLinks({ token = '' }) {
	const groupPhoto = useVkImage('vk-group', GROUP.screenName, token);
	const helperIcon = useVkImage('vk-app', HELPER.appId, token);
	return (
		<>
			<Separator padding />
			<SimpleCell
				href={GROUP.url}
				target="_blank"
				rel="noopener noreferrer"
				before={groupPhoto ? <Avatar size={28} src={groupPhoto} /> : <Icon28Users3Outline />}
				subtitle="Сообщество проекта"
				chevron="always"
			>
				{GROUP.title}
			</SimpleCell>
			<SimpleCell
				href={HELPER.url}
				target="_blank"
				rel="noopener noreferrer"
				before={helperIcon ? <Avatar size={28} src={helperIcon} borderRadius="m" /> : <Icon28ServicesOutline />}
				subtitle="Приложение-помощник"
				chevron="always"
			>
				{HELPER.title}
			</SimpleCell>
		</>
	);
}
