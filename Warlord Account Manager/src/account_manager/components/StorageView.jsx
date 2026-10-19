import { useRef } from 'react';
import { CellButton, Div, Footnote, Progress } from '@vkontakte/vkui';
import { Icon28DeleteOutline, Icon28DownloadOutline, Icon28UploadOutline } from '@vkontakte/icons';
import { useManagerContext } from '../ManagerContext.js';
import { accountTitle } from './AccountRow.jsx';
import { formatBytes, useStorageUsage } from '../../shared/hooks/useStorageUsage.js';
import { downloadText } from '../../shared/lib/download.js';
import { EXPORT_FILE_NAME, parseAccounts, serializeAccounts } from '../lib/transfer.js';

// Раздел «Хранилище»: занятое место, экспорт и импорт списка аккаунтов, очистка данных
export function StorageView() {
	const { manager, notify, confirmClear } = useManagerContext();
	const { accounts } = manager;
	const usage = useStorageUsage();
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
			<CellButton before={<Icon28UploadOutline />} onClick={() => fileInput.current?.click()}>Импортировать из файла</CellButton>
			<CellButton before={<Icon28DownloadOutline />} disabled={!accounts.length} onClick={exportFile}>Экспортировать в файл</CellButton>
			<input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={importFile} />
			<CellButton before={<Icon28DeleteOutline />} appearance="negative" onClick={confirmClear}>Очистить все данные</CellButton>
		</>
	);
}
