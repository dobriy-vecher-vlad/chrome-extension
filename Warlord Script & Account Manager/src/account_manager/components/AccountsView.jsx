import { Avatar, CellButton, Cell, IconButton, List, PlatformProvider } from '@vkontakte/vkui';
import { Icon24DeleteOutline, Icon24PenOutline, Icon28AddOutline } from '@vkontakte/icons';
import { useManagerContext } from '../ManagerContext.js';
import { accountTitle } from './AccountRow.jsx';

// Раздел «Аккаунты»: список. Порядок меняется в режиме «Изменить» (кнопка в заголовке окна):
// у строк появляются ручки перетаскивания, в обычном режиме у строк кнопки «Изменить» и «Удалить».
export function AccountsView({ reorder, onForm }) {
	const { manager, confirmRemove } = useManagerContext();
	const { accounts, ownId } = manager;

	return (
		<>
			{!reorder && (
				<CellButton before={<Icon28AddOutline />} onClick={() => onForm({ mode: 'add' })}>Добавить аккаунт</CellButton>
			)}
			{/* Ручку перетаскивания VKUI рисует по платформе: тонкая трёхполосная — на ios (на остальных толстая четырёхполосная),
			    но на ios она стоит справа, поэтому в режиме перестановки переносим её влево стилями (.AccountsView__cell--reordering) */}
			<PlatformProvider value="ios">
				<List>
					{accounts.map((account) => {
						const own = account.id === ownId;
						return (
							<Cell
								key={account.id}
								className={reorder ? 'WarlordAccountManagerAccountsView__cell--reordering' : undefined}
								draggable={reorder}
								draggerLabel="Переместить аккаунт"
								onDragFinish={({ from, to }) => manager.reorder(from, to)}
								before={(
									<Avatar
										size={36}
										src={account.photo}
										initials={accountTitle(account).charAt(0).toUpperCase()}
										gradientColor="custom"
									/>
								)}
								subtitle={account.nick || `id${account.id}`}
								after={reorder ? undefined : (
									<span className="WarlordAccountManagerAccountsView__actions">
										<IconButton label="Изменить" onClick={() => onForm({ mode: 'edit', accountId: account.id })}>
											<Icon24PenOutline />
										</IconButton>
										{!own && (
											<IconButton className="WarlordAccountManagerAccountsView__deleteButton" label="Удалить" onClick={() => confirmRemove(account)}>
												<Icon24DeleteOutline />
											</IconButton>
										)}
									</span>
								)}
							>
								{accountTitle(account)}
							</Cell>
						);
					})}
				</List>
			</PlatformProvider>
		</>
	);
}
