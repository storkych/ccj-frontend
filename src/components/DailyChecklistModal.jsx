import React, { useState } from 'react'
import { reviewSSKDailyChecklist } from '../api/api.js'

export default function DailyChecklistModal({ checklist, isOpen, onClose, onReview }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !checklist) return null

  const handleReview = async (decision) => {
    if (!comment.trim()) {
      alert('Пожалуйста, добавьте комментарий')
      return
    }

    try {
      setLoading(true)
      await reviewSSKDailyChecklist({
        id: checklist.id,
        decision,
        comment: comment.trim()
      })
      
      onReview(checklist.id, decision)
      onClose()
      setComment('')
    } catch (error) {
      console.error('Ошибка при ревью чеклиста:', error)
      alert('Ошибка при обработке чеклиста')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#f59e0b'
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return 'var(--muted)'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'На рассмотрении'
      case 'approved': return 'Одобрен'
      case 'rejected': return 'Отклонен'
      default: return status
    }
  }

  const renderSafetyAnswers = (answers) => {
    if (!answers || Object.keys(answers).length === 0) {
      return <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Ответы не предоставлены</div>
    }

    return Object.entries(answers).map(([key, value]) => (
      <div key={key} style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '14px' }}>{key}</span>
        <span style={{
          color: value === 'yes' ? '#10b981' : 
                 value === 'no' ? '#ef4444' : 
                 'var(--muted)',
          fontWeight: '600'
        }}>
          {value === 'yes' ? 'Да' : 
           value === 'no' ? 'Нет' : 
           value === 'not_required' ? 'Не требуется' : value}
        </span>
      </div>
    ))
  }

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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        {/* Заголовок */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text)'
          }}>
            Чек-лист от {new Date(checklist.created_at).toLocaleDateString('ru-RU')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Содержимое */}
        <div style={{ padding: '24px' }}>
          {/* Информация о чеклисте */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Объект</div>
                <div style={{ fontWeight: '600' }}>ID: {checklist.object_id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Статус</div>
                <div style={{
                  color: getStatusColor(checklist.status),
                  fontWeight: '600'
                }}>
                  {getStatusText(checklist.status)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Дата создания</div>
                <div>{new Date(checklist.created_at).toLocaleString('ru-RU')}</div>
              </div>
            </div>
          </div>

          {/* Общая информация */}
          {checklist.data && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text)',
                marginBottom: '16px'
              }}>
                Общая информация
              </h3>
              
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {checklist.data.weather && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Погода</div>
                      <div>{checklist.data.weather}</div>
                    </div>
                  )}
                  {checklist.data.temperature && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Температура</div>
                      <div>{checklist.data.temperature}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ответы по безопасности */}
              {checklist.data.safety_answers && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '12px'
                  }}>
                    Ответы по безопасности
                  </h4>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {renderSafetyAnswers(checklist.data.safety_answers)}
                  </div>
                </div>
              )}

              {/* План на завтра */}
              {checklist.data.next_day_plan && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '12px'
                  }}>
                    План на завтра
                  </h4>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{checklist.data.next_day_plan}</div>
                  </div>
                </div>
              )}

              {/* Проблемы */}
              {checklist.data.issues && checklist.data.issues.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '12px'
                  }}>
                    Выявленные проблемы
                  </h4>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    {checklist.data.issues.map((issue, index) => (
                      <div key={index} style={{
                        padding: '8px 0',
                        borderBottom: index < checklist.data.issues.length - 1 ? '1px solid var(--border)' : 'none'
                      }}>
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Комментарий ССК */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '12px'
            }}>
              Ваш комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Добавьте комментарий к чеклисту..."
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

          {/* Кнопки действий */}
          {checklist.status === 'submitted' && (
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => handleReview('reject')}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? 'var(--muted)' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Обработка...' : 'Отклонить'}
              </button>
              <button
                onClick={() => handleReview('approve')}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? 'var(--muted)' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Обработка...' : 'Одобрить'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
