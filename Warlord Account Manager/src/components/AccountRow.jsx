import { Avatar, Skeleton, Tappable } from '@vkontakte/vkui';
import { Icon24Settings } from '@vkontakte/icons';

export const accountTitle = (account) => account.label || account.name || `id${account.id}`;

// Строка аккаунта повторяет пункт левого меню ВК: сама строка и шестерёнка справа за её границей,
// которая появляется при наведении (см. стили `.wam-settings`).
export function AccountRow({ account, current, loading, onSelect, onEdit }) {
	// нет ни имени, ни кэша, а данные ещё грузятся: вместо «голого» id показываем скелетон
	const pending = loading && !account.name;

	return (
		<li className="wam-item">
			<Tappable className="wam-row" activated={current} onClick={() => onSelect(account)}>
				{pending ? (
					<span className="wam-row__icon"><Skeleton width={20} height={20} borderRadius="50%" /></span>
				) : (
					<Avatar
						className="wam-row__icon"
						size={20}
						src={account.photo}
						initials={accountTitle(account).charAt(0).toUpperCase()}
						gradientColor="custom"
					/>
				)}
				<span className="wam-row__text">
					{pending ? (
						<Skeleton width={110} height={12} borderRadius={4} />
					) : (
						<>
							<span className="wam-row__name">{accountTitle(account)}</span>
							<span className="wam-row__nick">
								{account.nick || (loading ? <Skeleton width={36} height={10} borderRadius={4} /> : null)}
							</span>
						</>
					)}
				</span>
			</Tappable>
			<Tappable className="wam-settings" hasHover={false} aria-label="Настройки аккаунта" onClick={() => onEdit(account)}>
				<Icon24Settings width={16} height={16} />
			</Tappable>
		</li>
	);
}

// Заглушка строки (скелетон), пока сохранённых аккаунтов нет, а данные ещё грузятся
export function AccountSkeletonRow() {
	return (
		<li className="wam-item" aria-hidden="true">
			<div className="wam-row">
				<span className="wam-row__icon"><Skeleton width={20} height={20} borderRadius="50%" /></span>
				<span className="wam-row__text"><Skeleton width={110} height={12} borderRadius={4} /></span>
			</div>
		</li>
	);
}
