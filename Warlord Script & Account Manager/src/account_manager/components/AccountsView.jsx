import { Avatar, CellButton, Cell, IconButton, List, PlatformProvider } from '@vkontakte/vkui';
import { Icon24DeleteOutline, Icon24PenOutline, Icon28AddOutline, Icon28MinusOutline } from '@vkontakte/icons';
import { useManagerContext } from '../ManagerContext.js';
import { accountTitle } from './AccountRow.jsx';

// Раздел «Аккаунты»: список. Порядок меняется в режиме «Изменить» (кнопка в заголовке окна):
// у строк появляются ручки перетаскивания, в обычном режиме у строк кнопки «Изменить» и «Удалить».
// Между аккаунтами можно поставить разделитель: в списке это ячейка «Разделитель», которую так же перетаскивают.
export function AccountsView({ reorder, onForm }) {
	const { manager, confirmRemove, notify, appearance } = useManagerContext();
	const { accounts, ownId } = manager;
	const { showAvatars, showNicknames } = appearance.settings;
	const reorderingClass = reorder ? 'WarlordAccountManagerAccountsView__cell--reordering' : undefined;

	return (
		<>
			{!reorder && (
				<>
					<CellButton before={<Icon28AddOutline />} onClick={() => onForm({ mode: 'add' })}>Добавить аккаунт</CellButton>
					<CellButton
						before={<Icon28MinusOutline />}
						onClick={() => {
							manager.addSeparator();
							notify('Разделитель добавлен в конец списка');
						}}
					>
						Добавить разделитель
					</CellButton>
				</>
			)}
			{/* Ручку перетаскивания VKUI рисует по платформе: тонкая трёхполосная — на ios (на остальных толстая четырёхполосная),
			    но на ios она стоит справа, поэтому в режиме перестановки переносим её влево стилями (.AccountsView__cell--reordering) */}
			<PlatformProvider value="ios">
				<List>
					{accounts.map((account) => {
						// разделитель: плашка с чертой вместо аватара; корзина удаляет его сразу, без подтверждения
						if (account.separator) {
							return (
								<Cell
									key={account.id}
									className={reorderingClass}
									draggable={reorder}
									draggerLabel="Переместить разделитель"
									onDragFinish={({ from, to }) => manager.reorder(from, to)}
									before={<span className="WarlordAccountManagerAccountsView__separatorIcon"><Icon28MinusOutline /></span>}
									after={reorder ? undefined : (
										<IconButton
											className="WarlordAccountManagerAccountsView__deleteButton"
											label="Удалить разделитель"
											onClick={() => {
												manager.remove(account.id);
												notify('Разделитель удалён');
											}}
										>
											<Icon24DeleteOutline />
										</IconButton>
									)}
								>
									Разделитель
								</Cell>
							);
						}
						const own = account.id === ownId;
						return (
							<Cell
								key={account.id}
								className={reorderingClass}
								draggable={reorder}
								draggerLabel="Переместить аккаунт"
								onDragFinish={({ from, to }) => manager.reorder(from, to)}
								before={(
									<Avatar
										size={36}
										src={showAvatars ? account.photo : undefined}
										initials={accountTitle(account).charAt(0).toUpperCase()}
										gradientColor="custom"
									/>
								)}
								subtitle={(showNicknames && account.nick) || `id${account.id}`}
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
