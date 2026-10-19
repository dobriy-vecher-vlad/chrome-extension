import { useEffect, useRef, useState } from 'react';
import { Alert, CellButton, Div, Footnote, Progress } from '@vkontakte/vkui';
import { Icon28DeleteOutline, Icon28DownloadOutline, Icon28UploadOutline } from '@vkontakte/icons';
import { FALLBACK_QUOTA, formatBytes, useStorageUsage } from '../../shared/hooks/useStorageUsage.js';
import { downloadText } from '../../shared/lib/download.js';
import { useProfileSettings } from '../lib/ScriptSettingsContext.js';
import { SCRIPT_SETTINGS_KEY } from '../../shared/lib/storageKeys.js';
import { normalize } from '../lib/settings.js';

const STORAGE_KEYS = [SCRIPT_SETTINGS_KEY]; // считаем только данные блока, а не всего расширения (список аккаунтов не в счёт)
const EXPORT_FILE_NAME = 'warlord-script-settings.json';

// Раздел «Хранилище»: занятое место, экспорт и импорт настроек блока, очистка этих данных
export function StorageView() {
	const { settings, change, reset, notify, alertOpen } = useProfileSettings();
	const usage = useStorageUsage(STORAGE_KEYS);
	const [confirming, setConfirming] = useState(false);
	const fileInput = useRef(null);

	// пока открыто подтверждение, Esc относится к нему, а не к окну (см. SettingsModal)
	useEffect(() => {
		alertOpen.current = confirming;
		return () => { alertOpen.current = false; };
	}, [confirming, alertOpen]);

	const exportFile = () => {
		downloadText(EXPORT_FILE_NAME, JSON.stringify(settings, null, '\t'));
		notify(`Настройки сохранены в файл ${EXPORT_FILE_NAME}`);
	};

	const importFile = async (event) => {
		const file = event.target.files?.[0];
		event.target.value = ''; // чтобы тот же файл можно было выбрать повторно
		if (!file) return;
		try {
			const parsed = JSON.parse(await file.text());
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
			change(normalize(parsed)); // неизвестные и испорченные поля отбрасываются
			notify('Настройки загружены из файла');
		} catch {
			notify('Не удалось прочитать файл настроек', 'error');
		}
	};

	return (
		<>
			<Div>
				<Footnote className="WarlordScriptStorageView__usage">
					{usage ? `Занято ${formatBytes(usage.used)} из ${formatBytes(usage.quota || FALLBACK_QUOTA)}` : 'Считаем занятое место…'}
				</Footnote>
				{usage && <Progress value={Math.max(1, (usage.used / usage.quota) * 100)} />}
			</Div>
			<CellButton before={<Icon28UploadOutline />} onClick={() => fileInput.current?.click()}>Импортировать из файла</CellButton>
			<CellButton before={<Icon28DownloadOutline />} onClick={exportFile}>Экспортировать в файл</CellButton>
			<input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importFile} />
			<CellButton before={<Icon28DeleteOutline />} appearance="negative" onClick={() => setConfirming(true)}>Очистить все данные</CellButton>
			{confirming && (
				<Alert
					onClosed={() => setConfirming(false)}
					dismissLabel="Отмена"
					actions={[
						{ title: 'Отмена', mode: 'cancel' },
						{ title: 'Очистить', mode: 'destructive', action: () => { reset(); notify('Данные очищены'); } },
					]}
					title="Очистить все данные?"
					description="Настройки Warlord Script (разделы, сортировка, сервер игры) вернутся к значениям по умолчанию. Данные Warlord Account Manager (аккаунты и его настройки) не затрагиваются."
				/>
			)}
		</>
	);
}
