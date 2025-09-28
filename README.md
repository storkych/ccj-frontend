# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



---

## 🚀 Новые экраны (моковые, 2025‑09‑28)

Добавлены страницы и ручки мок‑API:
- Файловое хранилище (`/files`)
- Уведомления (`/notifications`)
- Профиль (`/profile`)
- Памятки (`/memos`)
- ИИ чат (`/ai`) с выбором объекта
- QR код (`/qr`)
- Тикеты (`/tickets`)
- График работ (`/work-schedule`)
- Поставки материалов (`/deliveries`) — для ССК кнопки «в лабораторию»/«принять»
- Нарушения (`/violations`, `/violations/:id`) — отчёт прораба, подтверждение ССК/ИКО
- Посещения (`/visits`) — фильтрация по объекту
- Чек‑листы прорабов для ССК (`/ssk/checklists`) — отметка «просмотрено»

### Роли (для входа в мок)
- `foreman@demo.local` — прораб  
- `ssk@demo.local` — ССК  
- `iko@demo.local` — ИКО  
(пароль любой)

### ENV
См. `.env.example` — позже подставится реальный `VITE_API_URL`, сейчас всё идёт через `src/api/mock.js`.

