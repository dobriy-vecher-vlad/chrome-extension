import { useEffect, useState } from 'react';

// Тему ВК выдаёт атрибут `scheme` (например, vkcom_dark).
function readScheme() {
	const attr = document.documentElement.getAttribute('scheme') || document.body?.getAttribute('scheme') || '';
	if (attr) return /dark|space_gray/.test(attr) ? 'dark' : 'light';
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useColorScheme() {
	const [scheme, setScheme] = useState(readScheme);
	useEffect(() => {
		const update = () => setScheme(readScheme());
		const observer = new MutationObserver(update);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['scheme'] });
		if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ['scheme'] });
		const media = matchMedia('(prefers-color-scheme: dark)');
		media.addEventListener('change', update);
		return () => {
			observer.disconnect();
			media.removeEventListener('change', update);
		};
	}, []);
	return scheme;
}
