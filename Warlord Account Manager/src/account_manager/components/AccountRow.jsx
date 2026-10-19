import { Avatar, Skeleton, Tappable } from '@vkontakte/vkui';
import { Icon24Settings } from '@vkontakte/icons';

export const accountTitle = (account) => account.label || account.name || `id${account.id}`;

// Строка аккаунта повторяет пункт левого меню ВК: сама строка и шестерёнка справа за её границей,
// которая появляется при наведении (см. стили `.WarlordAccountManagerPanel__settingsButton`).
export function AccountRow({ account, current, loading, onSelect, onEdit }) {
	// нет ни имени, ни кэша, а данные ещё грузятся: вместо «голого» id показываем скелетон
	const pending = loading && !account.name;

	return (
		<li className="WarlordAccountManagerPanel__item">
			<Tappable className="WarlordAccountManagerPanel__row" activated={current} onClick={() => onSelect(account)}>
				{pending ? (
					<span className="WarlordAccountManagerPanel__rowIcon"><Skeleton width={20} height={20} borderRadius="50%" /></span>
				) : (
					<Avatar
						className="WarlordAccountManagerPanel__rowIcon"
						size={20}
						src={account.photo}
						initials={accountTitle(account).charAt(0).toUpperCase()}
						gradientColor="custom"
					/>
				)}
				<span className="WarlordAccountManagerPanel__rowText">
					{pending ? (
						<Skeleton width={110} height={12} borderRadius={4} />
					) : (
						<>
							<span className="WarlordAccountManagerPanel__rowName">{accountTitle(account)}</span>
							<span className="WarlordAccountManagerPanel__rowNickname">
								{account.nick || (loading ? <Skeleton width={36} height={10} borderRadius={4} /> : null)}
							</span>
						</>
					)}
				</span>
			</Tappable>
			<Tappable className="WarlordAccountManagerPanel__settingsButton" hasHover={false} aria-label="Настройки аккаунта" onClick={() => onEdit(account)}>
				<Icon24Settings width={16} height={16} />
			</Tappable>
		</li>
	);
}

// Заглушка строки (скелетон), пока сохранённых аккаунтов нет, а данные ещё грузятся
export function AccountSkeletonRow() {
	return (
		<li className="WarlordAccountManagerPanel__item" aria-hidden="true">
			<div className="WarlordAccountManagerPanel__row">
				<span className="WarlordAccountManagerPanel__rowIcon"><Skeleton width={20} height={20} borderRadius="50%" /></span>
				<span className="WarlordAccountManagerPanel__rowText"><Skeleton width={110} height={12} borderRadius={4} /></span>
			</div>
		</li>
	);
}
