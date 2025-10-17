# NotificationToast Component

Переиспользуемый компонент для отображения уведомлений.

## Использование

```jsx
import NotificationToast from '../components/NotificationToast.jsx'
import { useNotification } from '../hooks/useNotification.js'

function MyComponent() {
  const { notification, showSuccess, showError, hide } = useNotification()

  return (
    <div>
      <NotificationToast 
        notification={notification} 
        onClose={hide} 
      />
      {/* контент */}
    </div>
  )
}
```

## API

### NotificationToast Props
- `notification` - объект уведомления или null
- `onClose` - функция для закрытия уведомления

### useNotification Hook
- `notification` - текущее уведомление
- `showSuccess(message)` - показать уведомление об успехе
- `showError(message)` - показать уведомление об ошибке
- `hide()` - скрыть уведомление

## Стили
- Позиция: правый нижний угол
- Автоскрытие: через 5 секунд
- Анимация: slideInUp
- Цвета: зеленый для успеха, красный для ошибки
