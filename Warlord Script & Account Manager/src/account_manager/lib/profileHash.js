// Выбранный аккаунт в адресе страницы: #profile=171482060. После обновления вкладки панель снова включает этот аккаунт.
// Свой аккаунт (под которым открыт сам ВК) в адрес не пишется: параметр убирается. Остальные параметры хэша не трогаем.
// Запасной канал — sessionStorage вкладки: ВК как SPA может сам переписать адрес и стереть хэш, а sessionStorage переживает
// обновление и не делится между вкладками. Хэш в приоритете (по нему можно открыть ссылку в другой вкладке).
const KEY = 'profile';
const STORAGE_KEY = 'warlord-account-manager-profile';

const readParams = () => new URLSearchParams(location.hash.replace(/^#/, ''));
const toId = (value) => (value && /^\d+$/.test(value) ? Number(value) : null);

function readStored() {
	try { return toId(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

function writeStored(id) {
	try {
		if (id === null) sessionStorage.removeItem(STORAGE_KEY);
		else sessionStorage.setItem(STORAGE_KEY, String(id));
	} catch { /* хранилище недоступно: останется только хэш */ }
}

// id из адреса, а если там пусто, из sessionStorage; null, если нигде нет
export function readProfileHash() {
	return toId(readParams().get(KEY)) ?? readStored();
}

// id — записать, null — убрать. replaceState: история вкладки не растёт и страница ВК не получает hashchange.
export function writeProfileHash(id) {
	const value = id ?? null;
	writeStored(value);
	const params = readParams();
	if (value === null) params.delete(KEY);
	else params.set(KEY, String(value));
	const hash = params.toString();
	const next = `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`;
	if (next === `${location.pathname}${location.search}${location.hash}`) return;
	try { history.replaceState(history.state, '', next); } catch { /* адрес не обновился, аккаунт всё равно сменён */ }
}
