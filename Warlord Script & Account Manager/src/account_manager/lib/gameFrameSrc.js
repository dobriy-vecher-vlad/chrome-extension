// Адрес фрейма игры — это строка вида `https://…/index.html?hash=…&viewer_id=…&auth_key=…`.

export function parseSrc(src) {
	const params = {};
	const q = src.indexOf('?');
	if (q < 0) return params;
	for (const pair of src.slice(q + 1).split('&')) {
		if (!pair) continue;
		const i = pair.indexOf('=');
		const key = i < 0 ? pair : pair.slice(0, i);
		const value = i < 0 ? '' : pair.slice(i + 1);
		try { params[decodeURIComponent(key)] = decodeURIComponent(value); }
		catch { params[key] = value; }
	}
	return params;
}

// Меняет только указанные существующие параметры, остальную строку не трогает (подпись и прочее остаются как были).
export function patchSrc(src, values) {
	const q = src.indexOf('?');
	if (q < 0) return src;
	const parts = src.slice(q + 1).split('&').map((pair) => {
		const i = pair.indexOf('=');
		const key = i < 0 ? pair : pair.slice(0, i);
		return Object.hasOwn(values, key) ? `${key}=${encodeURIComponent(values[key])}` : pair;
	});
	return `${src.slice(0, q)}?${parts.join('&')}`;
}
