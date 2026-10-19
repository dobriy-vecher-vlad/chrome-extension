import { useEffect, useState } from 'react';

export const FALLBACK_QUOTA = 10 * 1024 * 1024; // лимит chrome.storage.local, если браузер не сообщил свой

export function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} Б`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} КБ`;
	return `${(bytes / 1024 / 1024).toFixed(2).replace('.', ',')} МБ`;
}

// Сколько места занимают данные расширения в хранилище браузера (keys — только эти ключи, по умолчанию все):
// обновляется при любом изменении хранилища
export function useStorageUsage(keys = null) {
	const [usage, setUsage] = useState(null); // { used, quota }
	useEffect(() => {
		let alive = true;
		const read = async () => {
			try {
				const used = await chrome.storage.local.getBytesInUse(keys);
				if (alive) setUsage({ used, quota: chrome.storage.local.QUOTA_BYTES || FALLBACK_QUOTA });
			} catch { /* расширение перезагружено */ }
		};
		read();
		try {
			chrome.storage.onChanged.addListener(read);
		} catch { /* расширение перезагружено */ }
		return () => {
			alive = false;
			try {
				chrome.storage.onChanged.removeListener(read);
			} catch { /* расширение перезагружено */ }
		};
	}, [keys]);
	return usage;
}
