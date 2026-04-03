# bootcamp

Статическое веб-приложение для бронирования спортивных площадок, готовое к публикации на GitHub Pages.

## Что сделано
- Данные каталога вынесены из кода в [`frontend/public/data/catalog.json`](/Users/mikhailnikoruk/work/bootcamp/bootcamp1/frontend/public/data/catalog.json).
- Пользователь может добавлять новые площадки через UI (сохраняются в `localStorage`).
- Добавлен переключатель темы (светлая/темная).
- Улучшена адаптивная верстка для телефонов.
- Добавлены базовые тесты для логики бронирования.

## Локальный запуск
```bash
cd frontend
npm install
npm run dev
```

## Тесты
```bash
cd frontend
npm run test
```

## Сборка
```bash
cd frontend
npm run build
```

## GitHub Pages
В `frontend/vite.config.ts` уже указан `base: "/bootcamp/"`.
После публикации репозитория `MikhailNikoruk/bootcamp` сайт будет доступен по адресу:
`https://mikhailnikoruk.github.io/bootcamp/`
