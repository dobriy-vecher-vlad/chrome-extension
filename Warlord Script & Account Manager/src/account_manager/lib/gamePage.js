// Страница игры: /app5536422 или, в новом адресе ВК, /games/app5536422. У ВК бывает и уникальная ссылка с id профиля после «_»:
// /games/app5536422_153968505 (query вроде ?ref=left_nav в path не входит). Другие приложения (app55364220, app5536423) не подходят.
// При смене адресов игры ВК обновить нужно ещё два места: matches в manifest.json и фильтр webNavigation в background.js.
const GAME_PATH = /^(?:\/games)?\/app5536422(?:_\d+)?(?:\/|$)/;

const isGamePath = (pathname) => GAME_PATH.test(pathname);
export const isGamePage = () => isGamePath(location.pathname);

// Новый интерфейс страницы игры (его ВК включает по A/B-тесту): контейнер игры с data-testid, нет #apps_test_id со старой вёрсткой.
// В нём нет «Игр для вас», шапки над игрой и чёрной полосы справа, а подвал собран из других элементов (см. page.css).
export const isNewGameInterface = () => Boolean(document.querySelector('#app_5536422_container[data-testid="app_container"]'));
