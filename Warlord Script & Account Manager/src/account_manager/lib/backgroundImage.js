// Своя картинка для фона панели: уменьшаем до размера, который нужен панели, и сохраняем как JPEG, чтобы в хранилище лежали
// сотни килобайт, а не десятки мегабайт исходника. Вместе с картинкой считается средняя яркость (0..1): по ней панель
// выбирает светлый или тёмный текст.
const MAX_WIDTH = 800;
const MAX_HEIGHT = 1200;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function prepareBackgroundImage(file) {
	if (!file.type.startsWith('image/')) throw new Error('Это не картинка');
	if (file.size > MAX_FILE_BYTES) throw new Error('Файл больше 20 МБ');

	const bitmap = await createImageBitmap(file);
	try {
		const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d');
		context.fillStyle = '#fff'; // прозрачные места PNG в JPEG станут белыми
		context.fillRect(0, 0, width, height);
		context.drawImage(bitmap, 0, 0, width, height);
		const data = canvas.toDataURL('image/jpeg', 0.85);

		// средняя яркость по уменьшенной копии 32×32
		const small = document.createElement('canvas');
		small.width = 32;
		small.height = 32;
		const smallContext = small.getContext('2d');
		smallContext.drawImage(canvas, 0, 0, 32, 32);
		const pixels = smallContext.getImageData(0, 0, 32, 32).data;
		let sum = 0;
		for (let i = 0; i < pixels.length; i += 4) sum += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
		return { data, luminance: sum / (pixels.length / 4) / 255 };
	} finally {
		bitmap.close();
	}
}
