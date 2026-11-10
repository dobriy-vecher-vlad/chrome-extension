import { Button } from '@vkontakte/vkui';

const Skeleton = ({ width, height, radius }) => <div className="WarlordScriptSkeleton" style={{ width, height, borderRadius: radius }} />;

// Строка свёрнутого раздела: значок и две строки текста
function SectionRow({ title, subtitle }) {
	return (
		<div className="WarlordScriptStartPreview__row">
			<Skeleton width={32} height={32} radius="50%" />
			<div className="WarlordScriptStartPreview__lines">
				<Skeleton width={title} height={12} />
				<Skeleton width={subtitle} height={10} />
			</div>
		</div>
	);
}

// Стартовый вид блока: макет будущих данных (раскрытый раздел с карточками и несколько свёрнутых) и поверх него кнопка загрузки.
// Макет показывает, что именно появится, а кнопка — что для этого нужно нажать.
// server — название выбранного сервера, onServer — переключает на следующий
export function StartPreview({ onLoad, busy, server, onServer }) {
	return (
		<div className="WarlordScriptStartPreview">
			<div className="WarlordScriptStartPreview__mock" aria-hidden="true">
				<SectionRow title={110} subtitle={170} />
				<div className="WarlordScriptStartPreview__grid">
					{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} height={44} radius={10} />)}
				</div>
				<SectionRow title={90} subtitle={140} />
				<SectionRow title={130} subtitle={110} />
				<SectionRow title={100} subtitle={150} />
			</div>
			<div className="WarlordScriptStartPreview__action">
				<Button size="l" mode="primary" loading={busy} onClick={onLoad}>Показать характеристики</Button>
				<Button size="m" mode="link" appearance="neutral" disabled={busy} onClick={onServer}>{server}</Button>
			</div>
		</div>
	);
}
