import { Fragment } from 'react';
import { Banner, Gallery, Separator } from '@vkontakte/vkui';
import { send } from '../../shared/lib/messaging.js';

const noop = () => {};

// hover — подсвечивать ли баннер при наведении (у объявлений да, у баннеров игрока в галерее нет)
function BannerItem({ banner, hover = false }) {
	// ссылки из файла статусов могут вести на vk.com, а мы работаем на vk.ru
	const link = banner.link?.replace(/^(https?:\/\/)(?:www\.)?vk\.com/, '$1vk.ru');
	const element = (
		<Banner
			onClick={hover ? noop : undefined}
			mode={banner.image?.length ? 'image' : undefined}
			title={banner.header || ' '}
			subtitle={banner.subheader || ' '}
			after={link?.length && !banner.image?.length ? 'chevron' : undefined}
			background={banner.image?.length ? <div style={{ backgroundColor: '#000', backgroundImage: `url(${banner.image})`, backgroundPosition: 'center', backgroundSize: 'cover' }} /> : undefined}
		/>
	);
	// Ссылки вида «?w=wall…» (записи ВК) открываем внутри ВК, как это делает сама страница. Если не получилось, переходим по ссылке
	// в текущем окне (пустой target не годится: у страницы ВК есть <base target>, и ссылка открылась бы в новой вкладке)
	const wiki = /^\?w=([\w-]+)$/.exec(link || '');
	const onClick = wiki ? async (event) => {
		event.preventDefault();
		const result = await send({ type: 'vk-wiki', w: wiki[1] });
		if (!result.ok) window.location.assign(link);
	} : undefined;
	return link?.length ? <a href={link} target={link.slice(0, 1) === '?' ? '_self' : '_blank'} rel="noreferrer" onClick={onClick}>{element}</a> : <span>{element}</span>;
}

// Объявления разработчиков (из файла статусов)
export const Actions = ({ actions }) => (
	<div className="WarlordScriptAnnouncementList">
		{actions.map((banner, key) => (
			<Fragment key={key}>
				{key !== 0 && <Separator padding />}
				<BannerItem banner={banner} hover />
			</Fragment>
		))}
	</div>
);

// Баннеры и статусы игрока: галерея
export const Banners = ({ banners }) => (
	<Gallery className="WarlordScriptBannerGallery" align="center" showArrows slideWidth="100%">
		{banners.map((banner, key) => <BannerItem key={key} banner={banner} />)}
	</Gallery>
);
