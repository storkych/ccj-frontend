# 🏗️ ITC СтройКонтроль

Система управления строительными проектами с контролем качества, поставок и соблюдения требований безопасности.

## 🚀 Технологии

### Frontend
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.4.0-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/ES6-JavaScript-F7DF1E?logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)


## 📁 Структура проекта

```
ccj-frontend/
├── 📁 public/                     # Статические файлы
│   └── vite.svg
├── 📁 src/
│   ├── 📁 api/                    # API слой
│   │   ├── api.js                 # Основные API методы
│   │   └── deliveries.js          # API для поставок
│   ├── 📁 auth/                   # Аутентификация
│   │   └── AuthContext.jsx        # React Context для авторизации
│   ├── 📁 components/             # Переиспользуемые компоненты
│   │   ├── DailyChecklistModal.jsx    # Модальное окно чеклистов
│   │   ├── DeliveryActionModal.jsx    # Модальное окно действий с поставками
│   │   ├── ReceiveDeliveryModal.jsx   # Модальное окно приема поставок
│   │   └── ViolationModal.jsx         # Модальное окно нарушений
│   ├── 📁 pages/                  # Страницы приложения
│   │   ├── AIChat.jsx             # 🤖 AI чат
│   │   ├── AreaMap.jsx            # 🗺️ Карта объектов
│   │   ├── DailyChecklist.jsx     # 📋 Ежедневные чеклисты (прорабы)
│   │   ├── Deliveries.jsx         # 📦 Поставки (общий)
│   │   ├── DeliveriesSSK.jsx      # 📦 Поставки (ССК)
│   │   ├── DeliveryDetail.jsx     # 📦 Детали поставки
│   │   ├── DeliveryMaterials.jsx  # 📦 Материалы поставки
│   │   ├── FileStorage.jsx        # 📁 Файловое хранилище
│   │   ├── Login.jsx              # 🔐 Авторизация
│   │   ├── Memos.jsx              # 📝 Памятки
│   │   ├── Notifications.jsx      # 🔔 Уведомления
│   │   ├── ObjectDetail.jsx       # 🏗️ Детали объекта
│   │   ├── Objects.jsx            # 🏗️ Объекты
│   │   ├── Profile.jsx            # 👤 Профиль пользователя
│   │   ├── QRPage.jsx             # 📱 QR код страница
│   │   ├── SSKChecklists.jsx      # 📋 Чеклисты (ССК)
│   │   ├── SSKChecklists.jsx      # 📋 Чеклисты ССК
│   │   ├── Tickets.jsx            # 🎫 Тикеты
│   │   ├── Violations.jsx         # ⚠️ Нарушения
│   │   ├── Visits.jsx             # 👥 Визиты
│   │   ├── WorkPlanForm.jsx       # 📅 Форма плана работ
│   │   └── WorkSchedule.jsx       # 📅 График работ
│   ├── 📁 assets/                 # Ресурсы
│   │   ├── logo.svg               # Логотип приложения
│   │   └── react.svg              # React логотип
│   ├── App.css                    # Стили приложения
│   ├── App.jsx                    # Главный компонент
│   ├── index.css                  # Глобальные стили
│   └── main.jsx                   # Точка входа
├── 📁 nginx/                      # Nginx конфигурация
│   └── nginx.conf
├── 📄 docker-compose.yml          # Docker Compose конфигурация
├── 📄 Dockerfile                  # Docker образ
├── 📄 docs-api.yml               # API документация
├── 📄 eslint.config.js           # ESLint конфигурация
├── 📄 index.html                 # HTML шаблон
├── 📄 package.json               # Зависимости проекта
├── 📄 vite.config.js             # Vite конфигурация
└── 📄 README.md                  # Документация проекта
```

## 🎯 Основные функции

### 👷‍♂️ Для прорабов
- **Ежедневные чеклисты** - заполнение чеклистов безопасности
- **Управление поставками** - прием и контроль поставок материалов
- **Планирование работ** - создание и управление планами работ
- **QR-коды** - сканирование QR-кодов для отметок

### 🏢 Для ССК (Служба строительного контроля)
- **Ревью чеклистов** - проверка и одобрение чеклистов прорабов
- **Контроль поставок** - принятие/отклонение поставок, отправка в лабораторию
- **Управление нарушениями** - создание и отслеживание нарушений
- **Планирование визитов** - организация проверок объектов

### 🤖 AI функции
- **Умный чат** - AI-ассистент для консультаций
- **Анализ объектов** - автоматический анализ состояния объектов
- **Computer Vision** - распознавание текста с документов

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
```

### Запуск через Docker
```bash
docker-compose up
```

## 🔧 Конфигурация



### API Endpoints
- **Основной API**: `https://building-api.itc-hub.ru/api/v1`
- **AI API**: `https://building-ai.itc-hub.ru`
- **Computer Vision**: `https://building-cv.itc-hub.ru`
- **Уведомления**: `https://building-notifications.itc-hub.ru`
- **QR/Визиты**: `https://building-qr.itc-hub.ru`
- **Тикеты**: `https://building-admin.itc-hub.ru/api`
- **Файлы**: `https://building-s3-api.itc-hub.ru`





---

<div align="center">
  <strong>🏗️ ITC СтройКонтроль - Умное управление строительными проектами</strong>
</div>
