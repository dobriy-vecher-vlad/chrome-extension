// Форматирование чисел, дат и фраз для блока характеристик игрока.

// «1 234 567»
export const numberSpaces = (number, symbol = ' ') => ((typeof number === 'string' ? number : JSON.stringify(number)) || '').toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol) || 0;

// Склонение по числу: titles — [«1 день», «2 дня», «5 дней»]
export const numberForm = (number, titles) => {
	number = Math.abs(number);
	const cases = [2, 0, 1, 1, 1, 2];
	return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
};

// Дата, которая была ms миллисекунд назад
export const parseDate = (ms = 0) => new Date(new Date() - ms);

export const dateForm = (ms = 0, format) => (format === 'large'
	? new Date(ms).toLocaleString('ru', { year: 'numeric', month: 'long', day: 'numeric' })
	: format === 'medium'
		? new Date(ms).toLocaleString('ru', { hour: 'numeric', minute: 'numeric', second: 'numeric' })
		: format === 'small'
			? new Date(ms).toLocaleString('ru', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
			: `${dateForm(ms, 'large')} в ${dateForm(ms, 'medium')}`);

// «Совершено 5 набегов»: before и after склоняются по number, само число отделяется пробелами по разрядам
export const buildPhrase = ({ number = 0, before = [], after = [], needNumber = true, symbol = ' ' } = {}) => {
	let phrase = '';
	if (before.length) phrase += numberForm(number, before);
	if (needNumber) phrase += `${phrase.length ? ' ' : ''}${numberSpaces(number, symbol)}`;
	if (after.length) phrase += `${phrase.length ? ' ' : ''}${numberForm(number, after)}`;
	return phrase;
};

export const calcInitialsAvatarColor = (v) => (v % 6) + 1;
