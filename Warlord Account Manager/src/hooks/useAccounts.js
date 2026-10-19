import { useCallback, useEffect, useRef, useState } from 'react';
import { checkCredentials, loadGameStats, loadPreview, loadVkProfiles } from '../lib/game.js';
import { loadAccounts, onAccountsChanged, saveAccounts, toStored } from '../lib/storage.js';
import { parseSrc, patchSrc } from '../lib/vkSrc.js';
import { getGameFrame } from './useGameFrame.js';

// Список аккаунтов, текущий аккаунт и все действия над ними.
export function useAccounts() {
	const [accounts, setAccounts] = useState([]);
	const [ready, setReady] = useState(false);
	const [currentId, setCurrentId] = useState(null);
	const [ownId, setOwnId] = useState(null); // аккаунт, под которым открыт сам ВК
	const [token, setToken] = useState(''); // токен родного аккаунта для запросов к VK API
	const [notice, setNotice] = useState('');
	// пока не завершилось первое обновление данных за эту загрузку страницы, у аккаунтов без кэша показываем скелетон
	const [refreshed, setRefreshed] = useState(false);

	const list = useRef([]); // актуальный список для асинхронных операций
	const session = useRef(null); // { id, authKey, token } родного аккаунта, живёт только в памяти
	const appliedSrc = useRef(null); // src, выставленный нами, чтобы отличать его от родного
	const refreshing = useRef(false);
	const refreshAgain = useRef(false);

	const commit = useCallback((next, persist = true) => {
		list.current = next;
		setAccounts(next);
		if (persist) saveAccounts(next);
	}, []);

	const patch = useCallback((id, fields) => {
		commit(list.current.map((a) => (a.id === id ? { ...a, ...fields } : a)));
	}, [commit]);

	const reload = useCallback(async () => {
		const stored = await loadAccounts();
		const previous = new Map(list.current.map((a) => [a.id, a]));
		commit(stored.map((a) => ({ ...a, missing: previous.get(a.id)?.missing, dmg: previous.get(a.id)?.dmg, hp: previous.get(a.id)?.hp, servers: previous.get(a.id)?.servers })), false);
	}, [commit]);

	useEffect(() => {
		reload().then(() => setReady(true));
		// Своя же запись возвращается событием, и перечитывать её нельзя: между двумя быстрыми записями это откатило бы
		// список к промежуточному виду, и следующая запись затёрла бы свежие данные. Перечитываем только чужие изменения.
		return onAccountsChanged((value) => {
			if (JSON.stringify(value) !== JSON.stringify(list.current.map(toStored))) reload();
		});
	}, [reload]);

	// Имя и аватар из ВК, ник и статы из игры. На всё про всех аккаунтов уходит несколько запросов,
	// а не по запросу на аккаунт: ВК отдаёт профили пачкой, игра — списком «друзей» (см. loadGameStats).
	const refreshAll = useCallback(async () => {
		if (refreshing.current) {
			refreshAgain.current = true;
			return;
		}
		const current = session.current;
		if (!current || !list.current.length) {
			setRefreshed(true);
			return;
		}
		refreshing.current = true;
		try {
			do {
				refreshAgain.current = false;
				const ids = list.current.map((a) => a.id);
				// ВК и игра отвечают независимо: каждый результат применяем, как только он пришёл, а не ждём обоих
				const vkDone = loadVkProfiles(ids, current.token).then((users) => {
					const vk = new Map(users.map((u) => [u.id, { name: `${u.first_name} ${u.last_name}`.trim(), photo: u.photo_100 }]));
					commit(list.current.map((account) => (vk.has(account.id) ? { ...account, ...vk.get(account.id) } : account)));
				});
				const gameDone = loadGameStats(current, ids).then((stats) => {
					if (!stats) return;
					commit(list.current.map((account) => {
						const game = stats.found.get(account.id);
						// servers — профили на каждом сервере; живут только в памяти (в хранилище не пишутся, см. toStored)
						if (game) return { ...account, nick: game.nick, dmg: game.dmg, hp: game.hp, missing: false, servers: stats.byServer.get(account.id) };
						if (stats.missing.includes(account.id)) return { ...account, missing: true };
						return account;
					}));
				});
				await Promise.all([vkDone, gameDone]);
			} while (refreshAgain.current);
		} finally {
			refreshing.current = false;
			setRefreshed(true);
		}
	}, [commit]);

	// запасной выход: если данные так и не пришли (нет сессии, сеть), скелетон не висит вечно
	useEffect(() => {
		const timer = setTimeout(() => setRefreshed(true), 8000);
		return () => clearTimeout(timer);
	}, []);

	// Вызывается при каждом новом src фрейма игры.
	const onFrameSrc = useCallback((src) => {
		const params = parseSrc(src);
		if (!params.viewer_id || !params.auth_key) return;
		const id = Number(params.viewer_id);
		setCurrentId(id);
		if (src === appliedSrc.current) return; // это наша подмена, а не родной адрес
		session.current = { id, authKey: params.auth_key, token: params.access_token || '' };
		setOwnId(id);
		setToken(session.current.token);
		const known = list.current.some((a) => a.id === id);
		commit(known
			? list.current.map((a) => (a.id === id ? { ...a, authKey: params.auth_key } : a))
			: [{ id, authKey: params.auth_key }, ...list.current]);
		refreshAll();
	}, [commit, refreshAll]);

	const switchTo = useCallback((account) => {
		const frame = getGameFrame();
		if (!frame || account.id === currentId) return false;
		const src = frame.getAttribute('src') || '';
		const params = parseSrc(src);
		if (!('auth_key' in params) || !('viewer_id' in params)) {
			setNotice('Не удалось сменить аккаунт: в адресе игры нет нужных параметров');
			return false;
		}
		const values = { auth_key: account.authKey, viewer_id: String(account.id) };
		if ('user_id' in params) values.user_id = String(account.id);
		const next = patchSrc(src, values);
		appliedSrc.current = next;
		setNotice('');
		setCurrentId(account.id);
		frame.setAttribute('src', next);
		return true; // true — аккаунт сменён (игра перезагружается), панель покажет уведомление
	}, [currentId]);

	// Возвращает текст ошибки или null, если аккаунт добавлен. server — сервер, уже найденный окном (чтобы не спрашивать хаб ещё раз).
	const add = useCallback(async ({ id, authKey, label, server }) => {
		if (list.current.some((a) => a.id === id)) return 'Аккаунт уже есть в списке';
		const result = await checkCredentials(id, authKey, server);
		if (result.error) return result.error;
		commit([...list.current, { id, authKey, label: label || undefined }]);
		refreshAll();
		return null;
	}, [commit, refreshAll]);

	// Правка настроек аккаунта. Новый ключ проверяем так же, как при добавлении.
	const update = useCallback(async (id, { authKey, label }) => {
		const account = list.current.find((a) => a.id === id);
		if (!account) return 'Аккаунт не найден';
		if (authKey !== account.authKey) {
			const result = await checkCredentials(id, authKey);
			if (result.error) return result.error;
		}
		patch(id, { authKey, label: label || undefined });
		refreshAll();
		return null;
	}, [patch, refreshAll]);

	// Импорт списком (файл или старое расширение). Новые аккаунты добавляются в конец, у уже имеющихся при пустом
	// названии подставляется название из импорта; ключи существующих не трогаем (их проверили раньше).
	// Ключи при импорте не проверяются запросом к серверу: ключ постоянный, а пачка запросов упёрлась бы в лимит игры.
	const importAccounts = useCallback((items) => {
		const next = [...list.current];
		let added = 0;
		let changed = false;
		for (const { id, authKey, label } of items) {
			const index = next.findIndex((a) => a.id === id);
			if (index < 0) {
				next.push({ id, authKey, label: label || undefined });
				added += 1;
			} else if (label && !next[index].label) {
				next[index] = { ...next[index], label };
				changed = true;
			}
		}
		if (added || changed) commit(next);
		if (added) refreshAll();
		return { added, existing: items.length - added };
	}, [commit, refreshAll]);

	// Перестановка (перетаскивание в окне настроек): порядок хранится и применяется в колонке сразу
	const reorder = useCallback((from, to) => {
		if (from === to || from < 0 || to < 0 || from >= list.current.length || to >= list.current.length) return;
		const next = [...list.current];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		commit(next);
	}, [commit]);

	const remove = useCallback((id) => {
		commit(list.current.filter((a) => a.id !== id));
	}, [commit]);

	// Превью профиля для окна добавления и редактирования
	const preview = useCallback((id) => loadPreview(id, session.current?.token || ''), []);

	return { accounts, ready, loading: !refreshed, currentId, ownId, token, notice, onFrameSrc, switchTo, add, update, remove, reorder, importAccounts, preview };
}
