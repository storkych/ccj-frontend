import React, { useState } from 'react'
import { receiveDelivery, extractTextFromImage } from '../api/deliveries.js'

export default function ReceiveDeliveryModal({ 
  open, 
  onClose, 
  delivery, 
  onSuccess 
}) {
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [processingCV, setProcessingCV] = useState(false)
  const [currentStep, setCurrentStep] = useState('upload') // 'upload' | 'form'
  const [extractedData, setExtractedData] = useState(null)
  const [formData, setFormData] = useState('')

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotos(prev => [...prev, {
            file,
            preview: e.target.result,
            name: file.name
          }])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleProcessFirstPhoto = async () => {
    if (photos.length === 0) {
      alert('Необходимо прикрепить хотя бы одну фотографию накладной')
      return
    }

    try {
      setProcessingCV(true)
      
      // Конвертируем первую фотографию в base64
      const firstPhoto = photos[0]
      const photoBase64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target.result)
        }
        reader.readAsDataURL(firstPhoto.file)
      })

      // Обрабатываем через CV API
      const cvResult = await extractTextFromImage(
        photoBase64, 
        delivery.object, 
        delivery.id
      )
      
      setExtractedData(cvResult)
      
      // Форматируем данные для отображения в текстовом поле
      if (cvResult.results && cvResult.results.length > 0) {
        const data = cvResult.results[0].data || {}
        const formattedData = JSON.stringify(data, null, 2)
        setFormData(formattedData)
        console.log('CV API результат:', cvResult)
        console.log('Форматированные данные для редактирования:', formattedData)
      } else {
        setFormData('{}')
        console.warn('CV API не вернул данных')
      }
      
      // Переходим к форме
      setCurrentStep('form')
    } catch (error) {
      console.error('Ошибка обработки CV API:', error)
      alert('Ошибка при обработке накладной: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setProcessingCV(false)
    }
  }

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true)
      
      // Принимаем доставку с данными из формы
      await receiveDelivery(delivery.id, delivery.object)
      
      // Сохраняем данные формы в sessionStorage
      try {
        const parsedData = JSON.parse(formData)
        const cvResult = {
          results: [{
            data: parsedData,
            file_url: extractedData?.results?.[0]?.file_url || ""
          }]
        }
        sessionStorage.setItem(`delivery_materials_${delivery.id}`, JSON.stringify(cvResult))
        console.log('Данные сохранены в sessionStorage:', cvResult)
      } catch (parseError) {
        console.error('Ошибка парсинга данных формы:', parseError)
        alert('Ошибка в формате JSON данных. Проверьте синтаксис.')
        return
      }
      
      alert('Доставка успешно принята!')
      onSuccess('detail')
    } catch (error) {
      console.error('Ошибка принятия доставки:', error)
      alert('Ошибка при принятии доставки: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToUpload = () => {
    setCurrentStep('upload')
    setExtractedData(null)
    setFormData('')
  }

  const handleClose = () => {
    if (!submitting && !processingCV) {
      setPhotos([])
      setCurrentStep('upload')
      setExtractedData(null)
      setFormData('')
      onClose()
    }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text)'
          }}>
            {currentStep === 'upload' ? '📦 Принятие доставки' : '📝 Проверка данных накладной'}
          </h2>
          
          <button
            onClick={handleClose}
            disabled={submitting || processingCV}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: submitting || processingCV ? 'not-allowed' : 'pointer',
              color: 'var(--muted)',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

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
            color: 'var(--text)'
          }}>
            {delivery.title || `Поставка #${delivery.id}`}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--muted)'
          }}>
            {currentStep === 'upload' ? 
              'Для принятия доставки необходимо прикрепить фотографии накладных. Первая фотография будет автоматически обработана системой распознавания.' :
              'Проверьте и отредактируйте данные, извлеченные из накладной. После проверки можно принять доставку.'
            }
          </p>
        </div>

        {/* Шаг 1: Загрузка фотографий */}
        {currentStep === 'upload' && (
          <>
            {/* Блок загрузки фотографий */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text)',
                marginBottom: '8px'
              }}>
                Фотографии накладных
              </label>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={submitting || processingCV}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              
              <label
                htmlFor="photo-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: submitting || processingCV ? 'var(--muted)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: submitting || processingCV ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: 'var(--text)',
                  transition: 'all 0.2s ease'
                }}
              >
                📷 Выбрать фотографии
              </label>
            </div>

            {/* Превью загруженных фотографий */}
            {photos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <img
                      src={photo.preview}
                      alt={`Фото ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      disabled={submitting || processingCV}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: submitting || processingCV ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Кнопки для шага загрузки */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleClose}
                disabled={submitting || processingCV}
                style={{
                  padding: '10px 20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--text)',
                  cursor: submitting || processingCV ? 'not-allowed' : 'pointer'
                }}
              >
                Отмена
              </button>
              
              <button
                onClick={handleProcessFirstPhoto}
                disabled={submitting || processingCV || photos.length === 0}
                style={{
                  padding: '10px 20px',
                  background: photos.length === 0 || submitting || processingCV ? 'var(--muted)' : 'var(--brand)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: photos.length === 0 || submitting || processingCV ? 'not-allowed' : 'pointer'
                }}
              >
                {processingCV ? '🔍 Обработка накладной...' : '➡️ Обработать накладную'}
              </button>
            </div>
          </>
        )}

        {/* Шаг 2: Форма с данными */}
        {currentStep === 'form' && (
          <>
            {/* Поле для редактирования данных */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text)',
                marginBottom: '8px'
              }}>
                Данные из накладной (JSON)
              </label>
              
              <textarea
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                disabled={submitting}
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  background: 'var(--panel)',
                  color: 'var(--text)',
                  resize: 'vertical'
                }}
                placeholder='{"материал": "арматура", "количество": "100", ...}'
              />
              
              <div style={{
                fontSize: '12px',
                color: 'var(--muted)',
                marginTop: '4px'
              }}>
                Вы можете отредактировать данные в формате JSON перед принятием доставки
              </div>
            </div>

            {/* Поле с URL файла (нередактируемое) */}
            {extractedData?.results?.[0]?.file_url && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '8px'
                }}>
                  📄 URL обработанного файла
                </label>
                
                <div style={{
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--muted)',
                  wordBreak: 'break-all',
                  lineHeight: '1.4'
                }}>
                  {extractedData.results[0].file_url}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  marginTop: '4px'
                }}>
                  Ссылка на обработанное изображение (автоматически сохраняется)
                </div>
              </div>
            )}

            {/* Кнопки для шага формы */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={handleBackToUpload}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--text)',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                ← Назад к фотографиям
              </button>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: 'var(--text)',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Отмена
                </button>
                
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting || !formData.trim()}
                  style={{
                    padding: '10px 20px',
                    background: submitting || !formData.trim() ? 'var(--muted)' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting || !formData.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? '📤 Принятие доставки...' : '✅ Принять доставку'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
