import { Div, Footnote, FormItem, IconButton, Input } from '@vkontakte/vkui';
import { Icon24CopyOutline } from '@vkontakte/icons';
import { useManagerContext } from '../context.js';

// Раздел «Мои данные»: ID и игровой ключ аккаунта, под которым открыт сам ВК, с кнопками копирования.
// Раньше их приходилось искать в адресе фрейма игры через инструменты разработчика.
function CopyField({ label, value, copied, hint }) {
	const { notify } = useManagerContext();
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			notify(copied);
		} catch {
			notify('Не удалось скопировать', 'error');
		}
	};
	return (
		<FormItem top={label} bottom={hint}>
			<Input
				readOnly
				value={value}
				onFocus={(event) => event.target.select()}
				after={(
					<IconButton label={`Скопировать: ${label}`} onClick={copy}>
						<Icon24CopyOutline />
					</IconButton>
				)}
			/>
		</FormItem>
	);
}

export function MyDataView() {
	const { manager } = useManagerContext();
	const own = manager.accounts.find((account) => account.id === manager.ownId);

	if (!own) {
		return (
			<Div>
				<Footnote className="wam-help__text">
					Данные появятся, когда игра загрузится. Если они не появляются, обновите страницу.
				</Footnote>
			</Div>
		);
	}

	return (
		<>
			<CopyField label="Ваш ID" value={String(own.id)} copied="ID скопирован" />
			<CopyField
				label="Игровой ключ (auth_key)"
				value={own.authKey}
				copied="Ключ скопирован"
				hint="Ключ как пароль от персонажа: не передавайте его никому, кроме тех, кому доверяете"
			/>
		</>
	);
}
