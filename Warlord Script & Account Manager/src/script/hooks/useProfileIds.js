import { useEffect, useState } from 'react';
import { send } from '../../shared/lib/messaging.js';

const IDS_RETRY_MS = 1000;
const IDS_RETRIES = 20; // на странице без владельца профиля (сообщество и т. п.) номера не появятся, бесконечно спрашивать незачем

// Номер владельца из DOM профиля: у аватарки id вида profile_avatar_<номер>. ВК обновляет её вместе со страницей,
// в отличие от переменной cur.oid: после возврата по истории браузера (назад/вперёд) cur.oid остаётся пустой.
const readAvatarId = () => {
	const match = /^profile_avatar_(\d+)$/.exec(document.querySelector('[data-testid="profile-avatar"]')?.id || '');
	return match ? Number(match[1]) : 0;
};

// Номера профилей: from — кто смотрит (переменная ВК vk.id), to — чей профиль. ВК заполняет их не сразу, поэтому спрашиваем,
// пока не получим. После всех попыток возвращает то, что есть: блок покажет ошибку по нажатию на вкладку.
// path — адрес страницы: при переходе на другой профиль спрашиваем заново.
// Источники to по надёжности:
// 1) адрес вида /id123 — не зависит от состояния страницы;
// 2) аватарка в DOM — нужна, когда адрес кастомный (/nickname); сразу после перехода в ней может ещё быть прошлый профиль,
//    поэтому ждём, пока значение совпадёт с cur.oid или продержится две попытки подряд (cur.oid ВК обновляет не всегда);
// 3) cur.oid — запасной, если аватарки на странице нет.
export function useProfileIds(path) {
	const [ids, setIds] = useState(null);
	useEffect(() => {
		let alive = true;
		let timer;
		let attempts = 0;
		let lastDom = 0;
		setIds(null);
		const fromPath = Number(/^\/id(\d+)\/?$/.exec(path)?.[1]) || 0;
		const pick = (cur, last) => {
			if (fromPath) return fromPath;
			const dom = readAvatarId();
			lastDom = dom;
			if (dom && cur && dom === cur) return dom; // два источника совпали: сразу
			if (dom && dom === last) return dom; // cur пуст или устарел (ВК обновляет его не при каждом переходе): верим DOM, если он устоялся
			if (!dom && cur) return cur;
			return attempts + 1 >= IDS_RETRIES ? dom || cur : 0; // DOM ещё не обновился: ждём
		};
		const ask = async () => {
			const result = await send({ type: 'script-ids' });
			if (!alive) return;
			const to = pick(result.to, lastDom);
			if (result.ok && result.from && to) setIds({ from: result.from, to });
			else if (++attempts < IDS_RETRIES) timer = setTimeout(ask, IDS_RETRY_MS);
			else setIds({ from: result.from || 0, to: to || 0 });
		};
		ask();
		return () => {
			alive = false;
			clearTimeout(timer);
		};
	}, [path]);
	return ids;
}
