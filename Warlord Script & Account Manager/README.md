# Warlord Script & Account Manager

Расширение для Chrome (ВКонтакте, `vk.ru`) из двух независимых частей, которые собираются вместе. Версия расширения — в `public/manifest.json` (Warlord Script в магазине уже опубликован с версией 3.0.4, а Chrome Web Store не принимает версию ниже опубликованной, поэтому объединённое расширение начинается с 4.0.0):

1. **Warlord Account Manager (панель аккаунтов)** — переключение между аккаунтами в игре Warlord, только на странице игры (`content.js`).
2. **Warlord Script (блок характеристик игрока)** — подробные данные игрока и его гильдии на странице профиля (`script.js`). Свои настройки, хранилище (импорт, экспорт и очистка настроек) и справка (окно по шестерёнке в блоке, как у панели аккаунтов), хранятся отдельно (`scriptSettings`). Если поле `scriptUPDATE` в файле статусов (`wl_status.json`) не совпадает с установленной версией (строкой, новее или старее неважно), первым в списке объявлений показывается «Устаревшая версия»; поле нужно обновлять при каждом выпуске.

Интерфейс собран на React и VKUI и живёт в Shadow DOM, поэтому стили страницы ВК ему не мешают.

Импорт и экспорт аккаунтов — текстовый файл, по строке `Название,ключ,номер` (тот же формат, что `game_users` старого Warlord Script).
Если на странице есть панель старого расширения, аккаунты из неё переносятся автоматически, а сама панель скрывается (`src/account_manager/page.css`).

Настройки (окно «Настройки» в панели): аккаунты, хранилище (импорт, экспорт, очистка, занятое место), оформление (скрыть рекламный блок, исправить `--layout-width`, свободный режим панели) и справка. Значения оформления хранятся под ключом `settings` в `chrome.storage.local`.

## Сборка

```bash
npm install
npm run build      # собирает build/ целиком и кладёт в неё build.zip для публикации (манифест в корне архива)
npm run watch      # пересборка при изменениях (и src/, и public/)
```

Папка `build` генерируется (в git не хранится) и содержит готовое расширение: `chrome://extensions` → «Режим разработчика» → «Загрузить распакованное расширение».

## Структура

```
src/
  account_manager/   Warlord Account Manager (точка входа main.jsx → content.js)
    components/      окно настроек и его разделы, форма аккаунта, строка аккаунта
    hooks/           аккаунты, настройки, фрейм игры, положение панели, перенос из старого расширения
    lib/             игровой API, хранилище, импорт и экспорт, адрес фрейма, положение панели на странице
    App.jsx, ManagerContext.js, styles.css, page.css
  script/            Warlord Script (точка входа main.jsx → script.js, probe.js → probe.js)
    components/      блок на странице профиля, разделы, подсказки, таблицы, баннеры, окно настроек и его разделы
    hooks/           настройки скрипта, номера профилей со страницы ВК
    lib/             запросы к серверам игры и разбор ответов, форматирование, настройки, контексты
    data/            справочники игры (боссы, лиги, питомцы, звания, локации, фоны)
    styles.css
  shared/            то, что нужно обеим частям: наблюдатель за DOM, обмен с background, ключи хранилища,
                     скачивание файла, хаб игры, ссылки на проект, тосты, хуки темы, картинок VK и занятого места
public/              статичные файлы расширения, копируются в build/ как есть: manifest.json, background.js (сетевые запросы,
                     вставка скриптов), game-frame.js (скрывает рекламный блок во фрейме игры), icons/
scripts/             сборка: build.mjs и purgeCss.mjs (вырезает из vkui.css правила компонентов, которых нет в бандле)
build/               результат сборки (public/ + content.js, script.js, probe.js, build.zip), его не редактируют
```

Тяжёлый `script.js` (React и VKUI) на страницы ВК заранее не ставится: лёгкий `probe.js` следит за страницей и просит background вставить его, когда появляется профиль. `page.css` — правки страницы ВК (высота фрейма игры, скрытие панели старого расширения): вшивается в `content.js` и подключается только пока панель на странице.

Имена файлов: компоненты — PascalCase (`AccountForm.jsx`), хуки — `useЧто-то.js`, остальные модули — camelCase (`gameApi.js`), контексты — PascalCase (`ManagerContext.js`), точки входа — `main.jsx`.

## Имена

Все наши имена начинаются с `Warlord`, чтобы не пересечься с классами, id и переменными самой страницы ВК и других расширений. Вложенные имена сохраняют префикс родителя: у Warlord Script всё начинается с `WarlordScript`, у Warlord Account Manager с `WarlordAccountManager`. Общие компоненты (`src/shared/`) принадлежат обеим частям, поэтому у них только `Warlord`.

- **Классы** — PascalCase + BEM: `Блок__элемент--модификатор`, элементы и модификаторы из нескольких слов в camelCase, без сокращений (`WarlordAccountManagerPanel__rowNickname`, `WarlordScriptSection--open`, `WarlordScriptStatGrid--columns3`). Классы VKUI (`vkui…`) и страницы ВК не трогаем.
- **Warlord Account Manager:** `WarlordAccountManager` (обёртка с темой), `WarlordAccountManagerLayer` (верхний слой), `WarlordAccountManagerPanel` (колонка со списком), `WarlordAccountManagerProfilePreview`, `WarlordAccountManagerForm`, `WarlordAccountManagerAccountsView`, `WarlordAccountManagerSettingsModal`, `WarlordAccountManagerHelpView`, `WarlordAccountManagerStorageView`.
- **Warlord Script:** `WarlordScript` (корень, темы `--dark`/`--light`), `WarlordScriptLayer` (слой подсказок), `WarlordScriptHeader`, `WarlordScriptTabs`, `WarlordScriptSection` (раскрывающийся раздел), `WarlordScriptStatGrid`, `WarlordScriptStatCard`, `WarlordScriptPlayerTable`, `WarlordScriptUserCard`, `WarlordScriptUserBadges`, `WarlordScriptRaidCard`, `WarlordScriptRichPopover`, `WarlordScriptAnnouncementList`, `WarlordScriptBannerGallery`, `WarlordScriptSettingsModal`, `WarlordScriptStorageView`, `WarlordScriptHelpList`, `WarlordScriptAppAvatar`, `WarlordScriptSkeleton`.
- **Общие:** `WarlordToast`, `WarlordToastList`.
- **id, data-атрибуты, пользовательские свойства CSS, анимации** — kebab-case с префиксом части (`warlord-account-manager-host`, `warlord-script-layer`, `data-warlord-account-manager-compact-game-page`, `--warlord-script-muted`, `--warlord-script-player-table-rows`, `warlord-script-skeleton-shimmer`); глобальные переменные скриптов — `window.__warlordAccountManager`, `__warlordScript`, `__warlordScriptProbe`; файлы экспорта — `warlord-account-manager-accounts.txt` и `warlord-script-settings.json`.
