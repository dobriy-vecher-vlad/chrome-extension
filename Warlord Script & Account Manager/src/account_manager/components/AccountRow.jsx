import { Avatar, Skeleton, Tappable } from '@vkontakte/vkui';
import { Icon24Settings } from '@vkontakte/icons';

export const accountTitle = (account) => account.label || account.name || `id${account.id}`;

// Строка аккаунта повторяет пункт левого меню ВК: сама строка и шестерёнка справа за её границей,
// которая появляется при наведении (см. стили `.WarlordAccountManagerPanel__settingsButton`).
// showAvatar / showNickname — настройки оформления: что выключено, того в строке нет (и данные для него не запрашиваются).
// showSettings — шестерёнка настроек аккаунта; на панели-карточке (свободный режим, фон) её нет, настройки открываются из общего окна.
export function AccountRow({ account, current, loading, showAvatar, showNickname, showSettings = true, onSelect, onEdit }) {
	// нет ни названия, ни имени из ВК, а данные ещё грузятся: вместо «голого» id показываем скелетон
	const pending = loading && !account.label && !account.name;

	return (
		<li className="WarlordAccountManagerPanel__item">
			<Tappable className="WarlordAccountManagerPanel__row" activated={current} onClick={() => onSelect(account)}>
				{showAvatar && (pending ? (
					<span className="WarlordAccountManagerPanel__rowIcon"><Skeleton width={20} height={20} borderRadius="50%" /></span>
				) : (
					<Avatar
						className="WarlordAccountManagerPanel__rowIcon"
						size={20}
						src={account.photo}
						initials={accountTitle(account).charAt(0).toUpperCase()}
						gradientColor="custom"
					/>
				))}
				<span className="WarlordAccountManagerPanel__rowText">
					{pending ? (
						<Skeleton width={110} height={12} borderRadius={4} />
					) : (
						<>
							<span className="WarlordAccountManagerPanel__rowName">{accountTitle(account)}</span>
							{showNickname && (
								<span className="WarlordAccountManagerPanel__rowNickname">
									{account.nick || (loading ? <Skeleton width={36} height={10} borderRadius={4} /> : null)}
								</span>
							)}
						</>
					)}
				</span>
			</Tappable>
			{showSettings && (
				<Tappable className="WarlordAccountManagerPanel__settingsButton" hasHover={false} aria-label="Настройки аккаунта" onClick={() => onEdit(account)}>
					<Icon24Settings width={16} height={16} />
				</Tappable>
			)}
		</li>
	);
}

// Заглушка строки (скелетон), пока сохранённых аккаунтов нет, а данные ещё грузятся
export function AccountSkeletonRow({ showAvatar }) {
	return (
		<li className="WarlordAccountManagerPanel__item" aria-hidden="true">
			<div className="WarlordAccountManagerPanel__row">
				{showAvatar && <span className="WarlordAccountManagerPanel__rowIcon"><Skeleton width={20} height={20} borderRadius="50%" /></span>}
				<span className="WarlordAccountManagerPanel__rowText"><Skeleton width={110} height={12} borderRadius={4} /></span>
			</div>
		</li>
	);
}

// Разделитель между аккаунтами: та же линия с теми же отступами, что отделяет список от «Настроек»
export function SeparatorRow() {
	return (
		<li className="WarlordAccountManagerPanel__item" role="separator">
			<div className="WarlordAccountManagerPanel__separator" />
		</li>
	);
}
