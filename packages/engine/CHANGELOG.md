# @nast791/engine

## 0.4.4

### Patch Changes

- Vitest: папка tests/ в каждом пакете, скрипт pnpm test.

## 0.4.3

### Patch Changes

- `state.combat` в clone/view; во время боя только `DEFEND`/`RESIGN`; `DEFEND` может слать защищающийся (не currentPlayer).
- Модуль не привязан к `shared/` хоста: только `tabletopEngine.actions` → `#tabletop-host-actions`.

## 0.4.2

### Patch Changes

- В `gameStart` view скрывает `position` чужих fighters до перехода в `turn`.
- Host actions инлайнятся в Nitro (не `file://` ESM-кэш) + watch на каталог actions.
- API `/action`: ошибка через `message`, не `statusMessage` (кириллица).

## 0.4.1

### Patch Changes

- `gameStart` интерактивен (расстановка до ходов); apply принимает actions в gameStart|turn.

## 0.4.0

### Minor Changes

- Хостовый реестр actions: `tabletopEngine.actions` → alias `#tabletop-host-actions`; apply: kernel, затем host.

## 0.3.0

### Minor Changes

- Kernel-actions SET_WINNER/RESIGN + реестр internal/actions; хуки фаз onTurnStart/onTurnEnd (no-op); авто-цикл фаз.

## 0.2.0

### Minor Changes

- Авто-цикл фаз: gameStart/turnStart/turn/turnEnd/gameEnd, END_TURN и SPEND_ACTION, actionsLeft в state/view.

## 0.1.2

### Patch Changes

- Открытая схема контента: map/player as-is; карточные зоны опциональны; usePlayerSetup без UnPlugged-полей.

## 0.1.1

### Patch Changes

- Включить README.md и CHANGELOG.md в опубликованный пакет (документация версии на GitHub Packages).

## 0.1.0

### Minor Changes

- Первый релиз Nuxt-модуля: setup/view/helpers, visibility self/teammate/enemy, серверные id и seed, API create/action/view, CLI setup/update, реестр STATE_KEYS.
