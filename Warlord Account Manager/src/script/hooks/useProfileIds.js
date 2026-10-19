import { useEffect, useState } from 'react';
import { send } from '../../shared/lib/messaging.js';

const IDS_RETRY_MS = 1000;
const IDS_RETRIES = 20; // на странице без владельца профиля (сообщество и т. п.) номера не появятся, бесконечно спрашивать незачем

// Номера профилей из переменных страницы ВК: from — кто смотрит, to — чей профиль. ВК заполняет их не сразу, поэтому спрашиваем,
// пока не получим. После всех попыток возвращает то, что есть: блок покажет ошибку по нажатию на вкладку.
// path — адрес страницы: при переходе на другой профиль спрашиваем заново.
export function useProfileIds(path) {
	const [ids, setIds] = useState(null);
	useEffect(() => {
		let alive = true;
		let timer;
		let attempts = 0;
		setIds(null);
		const ask = async () => {
			const result = await send({ type: 'script-ids' });
			if (!alive) return;
			if (result.ok && result.from && result.to) setIds({ from: result.from, to: result.to });
			else if (++attempts < IDS_RETRIES) timer = setTimeout(ask, IDS_RETRY_MS);
			else setIds({ from: result.from || 0, to: result.to || 0 });
		};
		ask();
		return () => {
			alive = false;
			clearTimeout(timer);
		};
	}, [path]);
	return ids;
}
