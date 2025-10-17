import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../auth/AuthContext.jsx'
import { generateAIResponse, askObjectQuestion, getObjects } from '../api/api.js'

export default function AIChat(){
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [selectedObject, setSelectedObject] = useState('')
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingObjects, setLoadingObjects] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const loadObjects = async () => {
      try {
        const res = await getObjects({ mine: true })
        setObjects(res.items || [])
      } catch (e) {
        console.warn('[ai chat] error loading objects', e)
      } finally {
        setLoadingObjects(false)
      }
    }
    loadObjects()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
      objectId: selectedObject || null
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      let response
      if (selectedObject) {
        response = await askObjectQuestion(selectedObject, inputText.trim())
      } else {
        response = await generateAIResponse(inputText.trim())
      }

      console.log('[ai chat] response:', response)

      // Извлекаем текст из различных возможных полей ответа
      let responseText = response.reply || response.answer || response.message || response.text || response.result
      
      // Если ответ содержит JSON с полем result, извлекаем его
      if (typeof responseText === 'string' && responseText.includes('{"result":')) {
        try {
          const parsed = JSON.parse(responseText)
          responseText = parsed.result || responseText
        } catch (e) {
          // Если не удалось распарсить, оставляем как есть
        }
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: responseText || 'Извините, не удалось получить ответ',
        timestamp: new Date(),
        objectId: selectedObject || null
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('[ai chat] error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Произошла ошибка при получении ответа. Попробуйте еще раз.',
        timestamp: new Date(),
        objectId: selectedObject || null,
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const getObjectName = (objectId) => {
    if (!objectId) return null
    const obj = objects.find(o => o.id == objectId)
    return obj ? `${obj.name} (${obj.address})` : `Объект #${objectId}`
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="page">

      {/* Панель управления */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {/* Выбор объекта */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '300px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text)',
              fontWeight: '500',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Объект:
            </div>
            <select 
              className="input" 
              value={selectedObject} 
              onChange={e=>setSelectedObject(e.target.value)}
              disabled={loadingObjects}
              style={{
                flex: 1,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: '400'
              }}
            >
              <option value="">Общий чат</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} - {obj.address}
                </option>
              ))}
        </select>
          </div>

          {/* Кнопка очистки */}
          <button 
            onClick={clearChat}
            disabled={messages.length === 0 || loading}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: messages.length === 0 || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              opacity: messages.length === 0 || loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (messages.length > 0 && !loading) {
                e.target.style.background = 'var(--bg)';
                e.target.style.borderColor = 'var(--brand)';
              }
            }}
            onMouseLeave={(e) => {
              if (messages.length > 0 && !loading) {
                e.target.style.background = 'var(--bg-secondary)';
                e.target.style.borderColor = 'var(--border)';
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            Очистить
          </button>

          {/* Счетчик сообщений */}
          <div style={{
            fontSize: '11px',
            color: 'var(--muted)',
            background: 'var(--bg-secondary)',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap'
          }}>
            {messages.length} сообщений
          </div>
        </div>
      </div>

      {/* Чат */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        height: 'calc(100vh - 300px)',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Сообщения */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--muted)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--bg-secondary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid var(--border)'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 style={{margin: '0 0 8px 0', color: 'var(--text)', fontSize: '18px', fontWeight: '600'}}>
                Добро пожаловать в ИИ Чат!
              </h3>
              <p style={{margin: 0, fontSize: '14px'}}>
                Задайте вопрос о строительстве или выберите объект для контекстного общения
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                {message.type === 'ai' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                )}
                
                <div style={{
                  maxWidth: '70%',
                  background: message.type === 'user' ? 'var(--brand)' : 'var(--bg-secondary)',
                  color: message.type === 'user' ? 'white' : 'var(--text)',
                  padding: '12px 16px',
                  borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  border: message.isError ? '1px solid #ef4444' : 'none',
                  position: 'relative'
                }}>
                  {message.type === 'ai' && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {message.objectId ? `ИИ помощник - по объекту "${getObjectName(message.objectId)}"` : 'ИИ помощник'}
                    </div>
                  )}
                  <div style={{lineHeight: '1.4'}}>
                    {message.type === 'ai' ? (
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p style={{margin: '0 0 12px 0', lineHeight: '1.5'}}>{children}</p>,
                          h1: ({children}) => <h1 style={{fontSize: '18px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--text)'}}>{children}</h1>,
                          h2: ({children}) => <h2 style={{fontSize: '16px', fontWeight: '600', margin: '0 0 10px 0', color: 'var(--text)'}}>{children}</h2>,
                          h3: ({children}) => <h3 style={{fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: 'var(--text)'}}>{children}</h3>,
                          strong: ({children}) => <strong style={{fontWeight: '600', color: 'var(--text)'}}>{children}</strong>,
                          em: ({children}) => <em style={{fontStyle: 'italic', color: 'var(--text)'}}>{children}</em>,
                          ul: ({children}) => <ul style={{margin: '0 0 12px 0', paddingLeft: '20px'}}>{children}</ul>,
                          ol: ({children}) => <ol style={{margin: '0 0 12px 0', paddingLeft: '20px'}}>{children}</ol>,
                          li: ({children}) => <li style={{margin: '0 0 4px 0', lineHeight: '1.4'}}>{children}</li>,
                          code: ({children}) => <code style={{background: 'var(--bg)', padding: '2px 4px', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace'}}>{children}</code>,
                          blockquote: ({children}) => <blockquote style={{borderLeft: '3px solid var(--brand)', paddingLeft: '12px', margin: '0 0 12px 0', fontStyle: 'italic', color: 'var(--muted)'}}>{children}</blockquote>
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      <div style={{whiteSpace: 'pre-wrap'}}>{message.text}</div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
                    marginTop: '4px',
                    textAlign: 'right'
                  }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'var(--text)'
                    }}>
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                }} />
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '20px',
          background: 'var(--bg)',
          borderRadius: '0 0 12px 12px'
        }}>
          <form onSubmit={handleSendMessage} style={{
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{flex: 1}}>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={selectedObject ? `Вопрос по объекту "${getObjectName(selectedObject)}"` : "Задайте вопрос о строительстве..."}
                disabled={loading}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  maxHeight: '120px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.4'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              style={{
                minHeight: '44px',
                height: '100%',
                width: '44px',
                background: (!inputText.trim() || loading) ? 'var(--bg-secondary)' : 'var(--brand)',
                color: (!inputText.trim() || loading) ? 'var(--muted)' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (!inputText.trim() || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: (!inputText.trim() || loading) ? 'none' : '0 2px 8px rgba(255, 138, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (inputText.trim() && !loading) {
                  e.target.style.background = '#e67e00';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 138, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (inputText.trim() && !loading) {
                  e.target.style.background = 'var(--brand)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(255, 138, 0, 0.2)';
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
            </button>
        </form>
        </div>
      </div>
    </div>
  )
}