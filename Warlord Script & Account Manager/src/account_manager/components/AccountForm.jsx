import { useEffect, useId, useRef, useState } from 'react';
import { Button, FormItem, IconButton, Input, ModalPageHeader, PanelHeaderBack } from '@vkontakte/vkui';
import { Icon24CopyOutline } from '@vkontakte/icons';
import { useManagerContext } from '../ManagerContext.js';
import { isAuthKey } from '../lib/storage.js';
import { ProfilePreview } from './ProfilePreview.jsx';

const PREVIEW_DELAY = 500;

// Ошибки отдельных полей. Пустое поле ошибкой не считается — кнопка просто неактивна.
function validateId(value) {
	if (!value) return '';
	if (!/^\d+$/.test(value)) return 'Номер профиля состоит только из цифр';
	if (value.length > 12) return 'Номер профиля не длиннее 12 цифр';
	return '';
}

// Про длину говорим, когда поле покинули или ключ уже длиннее нужного: пока человек печатает, это не ошибка
function validateKey(value, touched) {
	if (!value) return '';
	if (!/^[0-9a-f]*$/i.test(value)) return 'Ключ может содержать только цифры и буквы a–f';
	if (value.length !== 32 && (touched || value.length > 32)) return `Ключ должен состоять из 32 символов, сейчас ${value.length}`;
	return '';
}

const statusOf = (error, ok) => (error ? 'error' : ok ? 'valid' : 'default');

// Сводка для формы правки собирается из данных, которые расширение уже получило на старте (name, photo и профили
// на серверах), без новых запросов: при каждом входе в форму обновлять их незачем.
function previewFromAccount(account, loading) {
	const vk = account.name ? { name: account.name, photo: account.photo } : null;
	if (account.servers) return { status: 'ready', vk, servers: account.servers, server: null };
	if (account.missing) return { status: 'ready', vk, servers: [], server: null };
	// стартовый сбор ещё идёт — ждём; закончился, а профилей нет — сервер игры не ответил
	return { status: loading ? 'loading' : 'ready', vk, servers: [], server: null, unavailable: !loading };
}

// Форма добавления (mode="add") и настроек (mode="edit") аккаунта.
// Это не отдельное окно, а содержимое единого окна «Аккаунты»: переход список ↔ форма меняет только
// содержимое, само окно не пересоздаётся, поэтому ничего не мигает. Свою шапку и кнопки форма рисует сама.
// standalone — форма открыта сразу (шестерёнкой из колонки), без списка: возвращаться некуда, «назад» закрывает окно.
export function AccountForm({ mode, accountId, standalone, onDone }) {
	const { manager, confirmRemove, notify } = useManagerContext();
	const editing = mode === 'edit';

	// Аккаунт читаем из актуального списка, но запоминаем последнюю версию: после удаления форма ещё закрывается
	const found = editing ? manager.accounts.find((a) => a.id === accountId) : null;
	const lastAccount = useRef(found);
	if (found) lastAccount.current = found;
	const account = editing ? found || lastAccount.current : null;
	const own = account ? account.id === manager.ownId : false;

	const formId = useId();
	const idInputId = useId();
	const keyInputId = useId();
	const labelInputId = useId();
	const idInput = useRef(null);
	const [id, setId] = useState(() => (editing ? String(account.id) : ''));
	const [authKey, setAuthKey] = useState(() => (editing ? account.authKey : ''));
	const [label, setLabel] = useState(() => (editing ? account.label || '' : ''));
	const [keyTouched, setKeyTouched] = useState(false);
	const [busy, setBusy] = useState(false);
	const [serverError, setServerError] = useState('');
	// превью при добавлении — живое (человек вводит новый номер); при правке оно строится из уже собранных данных
	const [addPreview, setAddPreview] = useState({ status: 'idle' });
	const preview = editing ? previewFromAccount(account, manager.loading) : addPreview;

	const trimmedId = id.trim();
	const trimmedKey = authKey.trim();
	const idError = validateId(trimmedId);
	const keyError = validateKey(trimmedKey, keyTouched);
	const idValid = /^\d{1,12}$/.test(trimmedId);
	const keyValid = isAuthKey(trimmedKey);
	const hasKeyField = !(editing && own); // ключ родного аккаунта выдаёт сам ВК
	const valid = idValid && (keyValid || !hasKeyField);
	const { preview: loadPreview } = manager;

	// Фокус в первое поле при открытии формы (не autoFocus: он ломает CSS-анимацию открытия окна)
	useEffect(() => {
		if (editing) return undefined;
		const timer = setTimeout(() => idInput.current?.focus(), standalone ? 350 : 50);
		return () => clearTimeout(timer);
	}, [editing, standalone]);

	// Только при добавлении: превью подгружаем, когда номер профиля корректен; запросы не чаще одного за PREVIEW_DELAY
	useEffect(() => {
		if (editing) return undefined;
		if (!idValid) {
			setAddPreview({ status: 'idle' });
			return undefined;
		}
		let cancelled = false;
		setAddPreview((prev) => ({ ...prev, status: 'loading' }));
		const timer = setTimeout(async () => {
			const result = await loadPreview(Number(trimmedId));
			if (!cancelled) setAddPreview({ status: 'ready', ...result });
		}, PREVIEW_DELAY);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [editing, idValid, trimmedId, loadPreview]);

	// Сервер, статы которого показываем в списке, выбирается сам (основной, иначе первый доступный)
	const defaultServer = preview.server ? { id: preview.server.id, title: preview.server.title, url: preview.server.url } : undefined;
	const keyMessage = keyError || serverError;

	const cancel = () => {
		if (!busy) onDone();
	};

	const submit = async (event) => {
		event.preventDefault();
		if (!valid || busy) return;
		setBusy(true);
		setServerError('');
		const fields = {
			authKey: hasKeyField ? trimmedKey.toLowerCase() : account.authKey,
			label: label.trim(),
			server: editing ? undefined : defaultServer,
		};
		const result = editing
			? await manager.update(account.id, fields)
			: await manager.add({ id: Number(trimmedId), ...fields });
		setBusy(false);
		if (result) {
			setServerError(result);
			return;
		}
		notify(editing ? 'Изменения сохранены' : 'Аккаунт добавлен');
		onDone();
	};

	const copyKey = async () => {
		try {
			await navigator.clipboard.writeText(account.authKey);
			notify('Ключ скопирован');
		} catch {
			notify('Не удалось скопировать ключ', 'error');
		}
	};

	// подтверждение показывает панель (Alert), после «Удалить» форма закрывается
	const remove = () => confirmRemove(account, onDone);

	return (
		<>
			<ModalPageHeader before={!standalone && <PanelHeaderBack label="Назад" onClick={cancel} />}>
				{editing ? 'Настройки аккаунта' : 'Добавление аккаунта'}
			</ModalPageHeader>
			<form id={formId} autoComplete="off" onSubmit={submit}>
				{!editing && (
					<FormItem
						top="Номер профиля ВК"
						htmlFor={idInputId}
						status={statusOf(idError, idValid)}
						bottom={idError || undefined}
					>
						<Input
							id={idInputId}
							inputMode="numeric"
							placeholder="123456789"
							value={id}
							status={statusOf(idError, idValid)}
							slotProps={{ input: { getRootRef: idInput } }}
							onChange={(event) => { setId(event.target.value); setServerError(''); }}
						/>
					</FormItem>
				)}
				{idValid && preview.status !== 'idle' && <ProfilePreview id={trimmedId} preview={preview} />}
				{hasKeyField && (
					<FormItem
						top="Игровой ключ (auth_key)"
						htmlFor={keyInputId}
						status={keyMessage ? 'error' : statusOf('', keyValid)}
						bottom={keyMessage || undefined}
					>
						<Input
							id={keyInputId}
							placeholder="32 символа"
							value={authKey}
							status={keyMessage ? 'error' : statusOf('', keyValid)}
							onChange={(event) => { setAuthKey(event.target.value); setServerError(''); }}
							onBlur={() => setKeyTouched(true)}
						/>
					</FormItem>
				)}
				{/* Ключ родного аккаунта выдаёт сам ВК и менять его нельзя: показываем только для просмотра и копирования */}
				{!hasKeyField && account && (
					<FormItem
						top="Игровой ключ (auth_key)"
						htmlFor={keyInputId}
						bottom="Ключ вашего аккаунта выдаёт сам ВКонтакте, менять его не нужно"
					>
						<Input
							id={keyInputId}
							readOnly
							value={account.authKey}
							after={(
								<IconButton label="Скопировать ключ" onClick={copyKey}>
									<Icon24CopyOutline />
								</IconButton>
							)}
						/>
					</FormItem>
				)}
				<FormItem
					top="Название"
					htmlFor={labelInputId}
					bottom="Необязательно: если пусто, в списке показывается имя из ВК"
				>
					<Input
						id={labelInputId}
						maxLength={40}
						placeholder={preview.vk?.name || 'Как показывать в списке'}
						value={label}
						onChange={(event) => setLabel(event.target.value)}
					/>
				</FormItem>
			</form>
			<div className="WarlordAccountManagerForm__footer">
				{editing && !own && (
					<Button className="WarlordAccountManagerForm__deleteButton" size="m" mode="secondary" appearance="negative" onClick={remove}>
						Удалить
					</Button>
				)}
				<Button size="m" mode="secondary" appearance="neutral" onClick={cancel}>Отмена</Button>
				<Button size="m" type="submit" form={formId} disabled={!valid} loading={busy}>
					{editing ? 'Сохранить' : 'Добавить'}
				</Button>
			</div>
		</>
	);
}
