// Страница игры: /app5536422, а у ВК бывает и уникальная ссылка с id профиля после «_»:
// /app5536422_153968505 (query вроде ?ref=left_nav в path не входит). Другие приложения (app55364220, app5536423) не подходят.
const GAME_PATH = /^\/app5536422(?:_\d+)?(?:\/|$)/;

const isGamePath = (pathname) => GAME_PATH.test(pathname);
export const isGamePage = () => isGamePath(location.pathname);
