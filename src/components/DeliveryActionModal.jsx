import React, { useState } from 'react'
import { acceptDelivery, rejectDelivery, sendDeliveryToLab } from '../api/deliveries.js'

export default function DeliveryActionModal({ 
  delivery, 
  action, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !delivery || !action) return null

  const getActionInfo = (action) => {
    switch (action) {
      case 'accept':
        return {
          title: 'Принять поставку',
          description: 'Подтвердите принятие поставки ССК',
          buttonText: 'Принять',
          buttonColor: '#10b981',
          icon: ''
        }
      case 'reject':
        return {
          title: 'Отклонить поставку',
          description: 'Укажите причину отклонения поставки',
          buttonText: 'Отклонить',
          buttonColor: '#ef4444',
          icon: ''
        }
      case 'send_to_lab':
        return {
          title: 'Отправить в лабораторию',
          description: 'Отправить поставку на лабораторные испытания',
          buttonText: 'Отправить в лабораторию',
          buttonColor: '#8b5cf6',
          icon: ''
        }
      default:
        return {
          title: 'Действие с поставкой',
          description: 'Выполните действие с поставкой',
          buttonText: 'Выполнить',
          buttonColor: 'var(--brand)',
          icon: ''
        }
    }
  }

  const handleAction = async () => {
    if (!comment.trim()) {
      alert('Пожалуйста, добавьте комментарий')
      return
    }

    try {
      setLoading(true)
      
      let result
      switch (action) {
        case 'accept':
          result = await acceptDelivery({ id: delivery.id, comment: comment.trim() })
          break
        case 'reject':
          result = await rejectDelivery({ id: delivery.id, comment: comment.trim() })
          break
        case 'send_to_lab':
          result = await sendDeliveryToLab({ id: delivery.id, comment: comment.trim() })
          break
        default:
          throw new Error('Неизвестное действие')
      }

      onSuccess(delivery.id, action)
      onClose()
      setComment('')
    } catch (error) {
      console.error('Ошибка при выполнении действия:', error)
      alert('Ошибка при выполнении действия')
    } finally {
      setLoading(false)
    }
  }

  const actionInfo = getActionInfo(action)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        {/* Заголовок */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>{actionInfo.icon}</span>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              {actionInfo.title}
            </h2>
          </div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--muted)'
          }}>
            {actionInfo.description}
          </p>
        </div>

        {/* Содержимое */}
        <div style={{ padding: '24px' }}>
          {/* Информация о поставке */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              {delivery.title || `Поставка #${delivery.id}`}
            </h3>
            {delivery.description && (
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: 'var(--text)',
                lineHeight: '1.4'
              }}>
                {delivery.description}
              </p>
            )}
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: 'var(--muted)'
            }}>
              {delivery.supplier && <span>🏢 {delivery.supplier}</span>}
              {delivery.items_count && <span>Позиций: {delivery.items_count}</span>}
            </div>
          </div>

          {/* Комментарий */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px'
            }}>
              Комментарий *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Введите комментарий для ${actionInfo.title.toLowerCase()}...`}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Кнопки */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleAction}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? 'var(--muted)' : actionInfo.buttonColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Обработка...' : actionInfo.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
