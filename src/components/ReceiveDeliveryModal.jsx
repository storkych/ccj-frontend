import React, { useState } from 'react'
import { receiveDelivery, extractTextFromImage, extractTextFromMultipleImages } from '../api/deliveries.js'
import { useNotification } from '../hooks/useNotification.js'
import NotificationToast from '../components/NotificationToast.jsx'

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
  const [materials, setMaterials] = useState([])
  const { showSuccess, showError } = useNotification()

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

  const updateMaterial = (index, field, value) => {
    setMaterials(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      setFormData(JSON.stringify(updated, null, 2))
      return updated
    })
  }

  const addMaterial = () => {
    const newMaterial = {
      "Наименование материала": "",
      "Количество материала": "",
      "Размер": "",
      "Объем": "",
      "Нетто": ""
    }
    setMaterials(prev => {
      const updated = [...prev, newMaterial]
      setFormData(JSON.stringify(updated, null, 2))
      return updated
    })
  }

  const removeMaterial = (index) => {
    setMaterials(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setFormData(JSON.stringify(updated, null, 2))
      return updated
    })
  }

  const handleProcessPhotos = async () => {
    if (photos.length === 0) {
      showError('Необходимо прикрепить хотя бы одну фотографию накладной')
      return
    }

    try {
      setProcessingCV(true)
      
      // Обрабатываем все фотографии через новую CV API
      const cvResult = await extractTextFromMultipleImages(
        photos, 
        delivery.object, 
        delivery.id
      )
      
      setExtractedData(cvResult)
      
      // Форматируем данные для отображения в виде материалов
      if (cvResult.results && cvResult.results.length > 0) {
        // Объединяем данные со всех фотографий
        const allData = cvResult.results.map(result => result.data || {})
        
        // Преобразуем в формат материалов
        const materialsData = allData.map(item => ({
          "Наименование материала": item["Наименование материала"] || "",
          "Количество материала": item["Количество материала"] || "",
          "Размер": item["Размер"] || "",
          "Объем": item["Объем"] || "",
          "Нетто": item["Нетто"] || ""
        }))
        
        setMaterials(materialsData)
        setFormData(JSON.stringify(materialsData, null, 2))
        console.log('CV API результат (множественные фото):', cvResult)
        console.log('Материалы для редактирования:', materialsData)
      } else {
        setMaterials([])
        setFormData('[]')
        console.warn('CV API не вернул данных')
      }
      
      // Переходим к форме
      setCurrentStep('form')
    } catch (error) {
      console.error('Ошибка обработки CV API:', error)
      showError('Ошибка при обработке накладных: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setProcessingCV(false)
    }
  }

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true)
      
      // Принимаем доставку с данными из формы
      await receiveDelivery(delivery.id, delivery.object)
      
      // Сохраняем данные материалов в sessionStorage
      try {
        const cvResult = {
          results: [{
            data: materials,
            file_url: extractedData?.results?.[0]?.file_url || ""
          }]
        }
        sessionStorage.setItem(`delivery_materials_${delivery.id}`, JSON.stringify(cvResult))
        console.log('Данные материалов сохранены в sessionStorage:', cvResult)
      } catch (parseError) {
        console.error('Ошибка сохранения данных материалов:', parseError)
        showError('Ошибка при сохранении данных материалов.')
        return
      }
      
      showSuccess('Доставка успешно принята!')
      onSuccess('detail')
    } catch (error) {
      console.error('Ошибка принятия доставки:', error)
      showError('Ошибка при принятии доставки: ' + (error.message || 'Неизвестная ошибка'))
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
            {currentStep === 'upload' ? 'Принятие поставки' : 'Проверка данных накладной'}
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
              <div style={{
                fontSize: '12px',
                color: 'var(--muted)',
                marginBottom: '8px'
              }}>
                Можно загрузить несколько фотографий накладных для обработки
              </div>
              
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
                Выбрать фотографии
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
                onClick={handleProcessPhotos}
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
                {processingCV ? 'Обработка накладных...' : `Обработать накладные (${photos.length})`}
              </button>
            </div>
          </>
        )}

        {/* Шаг 2: Форма с данными */}
        {currentStep === 'form' && (
          <>
            {/* Таблица материалов */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                  color: 'var(--text)'
              }}>
                  Материалы из накладных
              </label>
                <button
                  type="button"
                  onClick={addMaterial}
                disabled={submitting}
                style={{
                    padding: '6px 12px',
                    background: 'var(--brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  + Добавить материал
                </button>
              </div>

              {materials.length > 0 ? (
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px'
                  }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          Наименование материала
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          Количество
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          Размер
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          Объем
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          Нетто
                        </th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border)', width: '60px' }}>
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((material, index) => (
                        <tr key={index} style={{
                          borderBottom: index < materials.length - 1 ? '1px solid var(--border)' : 'none'
                        }}>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={material["Наименование материала"]}
                              onChange={(e) => updateMaterial(index, "Наименование материала", e.target.value)}
                              disabled={submitting}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid var(--border)',
                                borderRadius: '3px',
                                fontSize: '12px',
                                background: 'var(--panel)'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={material["Количество материала"]}
                              onChange={(e) => updateMaterial(index, "Количество материала", e.target.value)}
                              disabled={submitting}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid var(--border)',
                                borderRadius: '3px',
                                fontSize: '12px',
                                background: 'var(--panel)'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={material["Размер"]}
                              onChange={(e) => updateMaterial(index, "Размер", e.target.value)}
                              disabled={submitting}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid var(--border)',
                                borderRadius: '3px',
                                fontSize: '12px',
                                background: 'var(--panel)'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={material["Объем"]}
                              onChange={(e) => updateMaterial(index, "Объем", e.target.value)}
                              disabled={submitting}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid var(--border)',
                                borderRadius: '3px',
                                fontSize: '12px',
                                background: 'var(--panel)'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={material["Нетто"]}
                              onChange={(e) => updateMaterial(index, "Нетто", e.target.value)}
                              disabled={submitting}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid var(--border)',
                                borderRadius: '3px',
                                fontSize: '12px',
                                background: 'var(--panel)'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeMaterial(index)}
                              disabled={submitting}
                              style={{
                                padding: '4px 8px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: submitting ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
              <div style={{
                  padding: '20px',
                  textAlign: 'center',
                color: 'var(--muted)',
                  background: 'var(--bg-light)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px'
              }}>
                  Материалы не найдены. Добавьте материал вручную.
              </div>
              )}
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
                  disabled={submitting || materials.length === 0}
                  style={{
                    padding: '10px 20px',
                    background: submitting || materials.length === 0 ? 'var(--muted)' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting || materials.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Принятие поставки...' : 'Принять поставку'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <NotificationToast />
    </div>
  )
}
