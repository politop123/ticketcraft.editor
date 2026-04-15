# TicketCraft Editor

Готовий MVP-проєкт редактора шаблону квитка на **Nuxt 3 + Nuxt UI** зі стилем, близьким до наданого макета.

## Що є

- верхній toolbar з Save / Export
- ліва sidebar у стилі макета
- центральна робоча зона з ticket canvas
- права панель властивостей
- drag & drop елементів
- resize вибраного елемента
- редагування data source, тексту, розмірів, кольорів
- QR / barcode preview
- export у HTML template і rendered HTML
- localStorage persistence

## Запуск

```bash
npm install
npm run dev
```

## Основні файли

- `pages/index.vue` — композиція сторінки редактора
- `components/editor/TicketStage.vue` — рендер полотна і переміщення елементів
- `components/editor/PropertiesPanel.vue` — панель властивостей
- `utils/defaults.ts` — дефолтний ticket template і mock data
- `utils/html.ts` — генератор HTML

## Примітка

Це frontend-only MVP без бекенду. Наступним кроком можна додати:
- upload локальних зображень
- layers panel
- undo / redo history
- snap-to-grid
- presets
- export to PNG / PDF
