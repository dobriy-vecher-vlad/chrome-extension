import { useRef } from 'react';
import { CellButton, Div, Footnote, Header, Progress } from '@vkontakte/vkui';
import { Icon28DeleteOutline, Icon28DownloadOutline, Icon28UploadOutline } from '@vkontakte/icons';
import { useManagerContext } from '../ManagerContext.js';
import { accountTitle } from './AccountRow.jsx';
import { formatBytes, useStorageUsage } from '../../shared/hooks/useStorageUsage.js';
import { downloadText } from '../../shared/lib/download.js';
import {
	APPEARANCE_FILE_NAME, BACKUP_FILE_NAME, parseAppearance, parseBackup, serializeAppearance, serializeBackup,
} from '../lib/backup.js';
import { EXPORT_FILE_NAME, parseAccounts, serializeAccounts } from '../lib/transfer.js';

// Пара «импорт из файла / экспорт в файл». accept — какие файлы предлагает окно выбора; onFile получает текст файла.
function FileActions({ accept, exportDisabled, onFile, onExport }) {
	const input = useRef(null);
	const pick = async (event) => {
		const file = event.target.files?.[0];
		event.target.value = ''; // чтобы тот же файл можно было выбрать повторно
		if (file) await onFile(await file.text());
	};
	return (
		<>
			<CellButton before={<Icon28UploadOutline />} onClick={() => input.current?.click()}>Импортировать данные из файла</CellButton>
			<CellButton before={<Icon28DownloadOutline />} disabled={exportDisabled} onClick={onExport}>Экспортировать данные в файл</CellButton>
			<input ref={input} type="file" accept={accept} hidden onChange={pick} />
		</>
	);
}

// Раздел «Хранилище»: занятое место, экспорт и импорт (аккаунты, оформление, все данные) и очистка каждого пункта
export function StorageView() {
	const { manager, appearance, notify, confirmClear } = useManagerContext();
	const { accounts } = manager;
	const usage = useStorageUsage();

	// Строки аккаунтов из текста: добавляет в список и возвращает сообщение о результате или null, если аккаунтов в тексте нет
	const importAccountsText = (text) => {
		const { items, bad } = parseAccounts(text);
		if (!items.some((item) => !item.separator)) return null;
		const { added, existing } = manager.importAccounts(items);
		const parts = [`добавлено ${added}`];
		if (existing) parts.push(`уже были ${existing}`);
		if (bad) parts.push(`не распознано строк ${bad}`);
		return parts.join(', ');
	};

	const exportAccounts = () => {
		downloadText(EXPORT_FILE_NAME, serializeAccounts(accounts, accountTitle));
		notify(`Список сохранён в файл ${EXPORT_FILE_NAME}`);
	};
	const importAccountsFile = (text) => {
		const result = importAccountsText(text);
		if (result === null) notify('В файле не нашлось аккаунтов', 'error');
		else notify(`Аккаунты: ${result}`);
	};

	const exportAppearance = () => {
		downloadText(APPEARANCE_FILE_NAME, serializeAppearance(appearance.settings, appearance.image));
		notify(`Оформление сохранено в файл ${APPEARANCE_FILE_NAME}`);
	};
	const importAppearanceFile = (text) => {
		const parsed = parseAppearance(text);
		if (!parsed) {
			notify('Это не файл оформления', 'error');
			return;
		}
		appearance.importAppearance(parsed);
		notify('Оформление загружено');
	};

	const exportAll = () => {
		downloadText(BACKUP_FILE_NAME, serializeBackup(serializeAccounts(accounts, accountTitle), appearance.settings, appearance.image));
		notify(`Всё сохранено в файл ${BACKUP_FILE_NAME}`);
	};
	const importAllFile = (text) => {
		const parsed = parseBackup(text);
		if (!parsed) {
			notify('Это не файл «все данные»', 'error');
			return;
		}
		appearance.importAppearance(parsed.appearance);
		const result = importAccountsText(parsed.accountsText);
		notify(result === null ? 'Оформление загружено, аккаунтов в файле нет' : `Оформление загружено. Аккаунты: ${result}`);
	};

	return (
		<>
			<Div>
				{usage ? (
					<>
						<Footnote className="WarlordAccountManagerStorageView__usage">
							Занято {formatBytes(usage.used)} из {formatBytes(usage.quota)}
						</Footnote>
						{/* значение в процентах; даже крошечную долю рисуем хотя бы 1%, чтобы полоса не пропадала */}
						<Progress value={Math.max(1, (usage.used / usage.quota) * 100)} />
					</>
				) : (
					<Footnote className="WarlordAccountManagerStorageView__usage">Считаем занятое место…</Footnote>
				)}
			</Div>

			<Header>Аккаунты</Header>
			<FileActions accept=".txt,text/plain" exportDisabled={!accounts.some((account) => !account.separator)} onFile={importAccountsFile} onExport={exportAccounts} />
			<CellButton before={<Icon28DeleteOutline />} appearance="negative" onClick={() => confirmClear('accounts')}>Очистить данные</CellButton>

			<Header>Оформление</Header>
			<FileActions accept=".json,application/json" onFile={importAppearanceFile} onExport={exportAppearance} />
			<CellButton before={<Icon28DeleteOutline />} appearance="negative" onClick={() => confirmClear('appearance')}>Очистить данные</CellButton>

			<Header>Все данные</Header>
			<FileActions accept=".json,application/json" onFile={importAllFile} onExport={exportAll} />
			<CellButton before={<Icon28DeleteOutline />} appearance="negative" onClick={() => confirmClear('all')}>Очистить данные</CellButton>
		</>
	);
}
