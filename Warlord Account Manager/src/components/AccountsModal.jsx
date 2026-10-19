import { useRef, useState } from 'react';
import { Avatar, Button, Cell, CellButton, Footnote, IconButton, List, ModalPage, ModalPageHeader, PanelHeaderBack, PlatformProvider } from '@vkontakte/vkui';
import { Icon24DeleteOutline, Icon24PenOutline, Icon28AddOutline, Icon28DownloadOutline, Icon28UploadOutline } from '@vkontakte/icons';
import { useManagerContext } from '../context.js';
import { AccountForm } from './AccountForm.jsx';
import { HelpView } from './HelpView.jsx';
import { accountTitle } from './AccountRow.jsx';
import { downloadText, EXPORT_FILE_NAME, parseAccounts, serializeAccounts } from '../lib/transfer.js';

// «1 аккаунт», «2 аккаунта», «5 аккаунтов»
function accountsCount(n) {
	const mod100 = n % 100;
	const mod10 = n % 10;
	const word = mod100 >= 11 && mod100 <= 14 ? 'аккаунтов' : mod10 === 1 ? 'аккаунт' : mod10 >= 2 && mod10 <= 4 ? 'аккаунта' : 'аккаунтов';
	return `${n} ${word}`;
}

// Содержимое окна в режиме списка. Порядок меняется в режиме «Изменить» (кнопка в заголовке окна):
// у строк появляются ручки перетаскивания, в обычном режиме у строк кнопки «Изменить» и «Удалить».
function AccountsList({ reorder, onForm }) {
	const { manager, confirmRemove, notify } = useManagerContext();
	const { accounts, ownId } = manager;
	const fileInput = useRef(null);

	const exportFile = () => {
		downloadText(EXPORT_FILE_NAME, serializeAccounts(accounts, accountTitle));
		notify(`Список сохранён в файл ${EXPORT_FILE_NAME}`);
	};

	const importFile = async (event) => {
		const file = event.target.files?.[0];
		event.target.value = ''; // чтобы тот же файл можно было выбрать повторно
		if (!file) return;
		try {
			const { items, bad } = parseAccounts(await file.text());
			if (!items.length) {
				notify('В файле не нашлось аккаунтов', 'error');
				return;
			}
			const { added, existing } = manager.importAccounts(items);
			const parts = [`добавлено ${added}`];
			if (existing) parts.push(`уже были ${existing}`);
			if (bad) parts.push(`не распознано строк ${bad}`);
			notify(`Импорт: ${parts.join(', ')}`);
		} catch {
			notify('Не удалось прочитать файл', 'error');
		}
	};

	return (
		<>
			{!reorder && (
				<CellButton before={<Icon28AddOutline />} onClick={() => onForm({ mode: 'add' })}>Добавить аккаунт</CellButton>
			)}
			{/* Ручку перетаскивания VKUI рисует по платформе: тонкая трёхполосная — на ios (на остальных толстая четырёхполосная),
			    но на ios она стоит справа, поэтому в режиме перестановки переносим её влево стилями (.wam-accounts__cell--reorder) */}
			<PlatformProvider value="ios">
				<List>
					{accounts.map((account) => {
						const own = account.id === ownId;
						return (
							<Cell
								key={account.id}
								className={reorder ? 'wam-accounts__cell--reorder' : undefined}
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
									<span className="wam-accounts__actions">
										<IconButton label="Изменить" onClick={() => onForm({ mode: 'edit', accountId: account.id })}>
											<Icon24PenOutline />
										</IconButton>
										{!own && (
											<IconButton className="wam-accounts__delete" label="Удалить" onClick={() => confirmRemove(account)}>
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
			{!reorder && (
				<>
					<CellButton before={<Icon28UploadOutline />} onClick={() => fileInput.current?.click()}>Импортировать из файла</CellButton>
					<CellButton before={<Icon28DownloadOutline />} disabled={!accounts.length} onClick={exportFile}>Экспортировать в файл</CellButton>
					<input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={importFile} />
				</>
			)}
		</>
	);
}

// Единое окно «Аккаунты»: список аккаунтов и форма добавления/правки — два вида ОДНОГО окна.
// Раньше форма была вторым окном поверх списка, и при переходе два окна разного размера на ~0.2с накладывались
// друг на друга (старое гасло, новое появлялось) — это и было «морганием». Теперь меняется только содержимое.
// Окно создаёт useModalManager; initial = { name: 'form', mode, accountId } открывает сразу форму (шестерёнка в колонке).
export function AccountsModal({ modalProps, close, initial }) {
	const { manager } = useManagerContext();
	const standalone = initial?.name === 'form';
	const [view, setView] = useState(initial || { name: 'list' });
	const [reorder, setReorder] = useState(false);

	const toList = () => (standalone ? close() : setView({ name: 'list' }));
	const isList = view.name === 'list';
	const isHelp = view.name === 'help';

	let header;
	if (isList) {
		header = (
			<ModalPageHeader
				before={manager.accounts.length > 1 && (
					<Button className="wam-accounts__edit" mode="tertiary" size="m" onClick={() => setReorder(!reorder)}>
						{reorder ? 'Готово' : 'Изменить'}
					</Button>
				)}
				after={(
					<Button className="wam-accounts__edit wam-accounts__help" mode="tertiary" size="m" onClick={() => setView({ name: 'help' })}>
						Справка
					</Button>
				)}
			>
				Аккаунты
			</ModalPageHeader>
		);
	} else if (isHelp) {
		header = <ModalPageHeader before={<PanelHeaderBack label="Назад" onClick={toList} />}>Справка</ModalPageHeader>;
	}

	return (
		<ModalPage
			{...modalProps}
			size={420}
			aria-label="Аккаунты"
			header={header}
			footer={isList ? <Footnote className="wam-accounts__count">{accountsCount(manager.accounts.length)}</Footnote> : undefined}
		>
			{isHelp ? (
				<HelpView />
			) : isList ? (
				<AccountsList reorder={reorder} onForm={(form) => setView({ name: 'form', ...form })} />
			) : (
				<AccountForm
					key={`${view.mode}:${view.accountId ?? 'new'}`}
					mode={view.mode}
					accountId={view.accountId}
					standalone={standalone}
					onDone={toList}
				/>
			)}
		</ModalPage>
	);
}
