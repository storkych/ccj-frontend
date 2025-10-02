import React, { useState } from 'react'
import { submitViolationReport, confirmViolation, declineViolation } from '../api/api.js'

function Modal({ open, onClose, children, style }){
  if(!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose} style={{zIndex: 9998}}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={style}>
        {children}
      </div>
    </div>
  )
}

export default function ViolationModal({ 
  open, 
  onClose, 
  violation, 
  getStatusInfo, 
  getObjectName,
  user,
  onViolationUpdate
}) {
  const [reportText, setReportText] = useState('')
  const [reportFiles, setReportFiles] = useState([])
  const [reportPhotos, setReportPhotos] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewing, setReviewing] = useState(false)
  
  if (!violation) return null

  const canSubmitReport = user?.role === 'foreman' && violation.status === 'open'
  const isAuthor = violation.author === user?.id
  const canReviewReport = (user?.role === 'ssk' || user?.role === 'iko') && (violation.status === 'fixed' || violation.status === 'awaiting_verification') && isAuthor
  const cannotReviewReason = (user?.role === 'ssk' || user?.role === 'iko') && (violation.status === 'fixed' || violation.status === 'awaiting_verification') && !isAuthor

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setReportPhotos(prev => [...prev, {
            file: file,
            preview: e.target.result,
            name: file.name
          }])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (index) => {
    setReportPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitReport = async () => {
    if (!reportText.trim()) return
    
    setSubmittingReport(true)
    try {
       // Конвертируем фотографии в base64
       const photoAttachments = await Promise.all(
         reportPhotos.map(photo => {
           return new Promise((resolve) => {
             const reader = new FileReader()
             reader.onload = (e) => {
               resolve(e.target.result) // это уже base64 строка с data:image/...
             }
             reader.readAsDataURL(photo.file)
           })
         })
       )
       
       const result = await submitViolationReport({
         id: violation.id,
         text: reportText,
         attachments: reportFiles, // обычные файлы
         fix_photos: photoAttachments // фотографии отдельно в base64
       })
      
      console.log('Отчёт успешно отправлен:', result)
      
      setReportText('')
      setReportFiles([])
      setReportPhotos([])
      onClose()
      
      // Обновляем данные после закрытия модального окна
      if (onViolationUpdate) {
        try {
          onViolationUpdate()
        } catch (updateError) {
          console.error('Ошибка при обновлении списка нарушений:', updateError)
        }
      }
    } catch (error) {
      console.error('Ошибка отправки отчёта:', error)
      alert('Ошибка при отправке отчёта: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleApproveReport = async () => {
    setReviewing(true)
    try {
      const result = await confirmViolation({ id: violation.id })
      console.log('Отчёт успешно принят:', result)
      
      onClose()
      
      // Обновляем данные после закрытия модального окна
      if (onViolationUpdate) {
        try {
          onViolationUpdate()
        } catch (updateError) {
          console.error('Ошибка при обновлении списка нарушений:', updateError)
        }
      }
    } catch (error) {
      console.error('Ошибка принятия отчёта:', error)
      alert('Ошибка при принятии отчёта: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setReviewing(false)
    }
  }

  const handleRejectReport = async () => {
    setReviewing(true)
    try {
      const result = await declineViolation({ id: violation.id })
      console.log('Отчёт успешно отклонён:', result)
      
      onClose()
      
      // Обновляем данные после закрытия модального окна
      if (onViolationUpdate) {
        try {
          onViolationUpdate()
        } catch (updateError) {
          console.error('Ошибка при обновлении списка нарушений:', updateError)
        }
      }
    } catch (error) {
      console.error('Ошибка отклонения отчёта:', error)
      alert('Ошибка при отклонении отчёта: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setReviewing(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} style={{width:'95vw', height: '95vh', maxWidth:'1400px', maxHeight: '900px', zIndex: 9999}}>
      <div style={{
        padding: '32px', 
        height: '100%', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom: 32}}>
          <h2 style={{margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--text)'}}>
            Детали нарушения
          </h2>
          <button onClick={onClose} style={{
            background:'var(--bg-secondary)', 
            border:'1px solid var(--border)',
            fontSize:'20px', 
            cursor:'pointer',
            color: 'var(--text)',
            padding: '8px',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--border)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--bg-secondary)'
          }}
          >
            ✕
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '32px',
          flex: 1,
          alignItems: 'start'
        }}>
          {/* Левая колонка - основная информация */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Статус и заголовок */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '8px 20px',
                  borderRadius: '24px',
                  background: `${getStatusInfo(violation.status).color}15`,
                  color: getStatusInfo(violation.status).color,
                  fontSize: '16px',
                  fontWeight: '600',
                  border: `2px solid ${getStatusInfo(violation.status).color}30`
                }}>
                  {getStatusInfo(violation.status).label}
                </div>
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text)',
                lineHeight: '1.2'
              }}>
                {violation.title}
              </h3>
            </div>

            {/* Объект */}
            <div style={{
              background: 'var(--bg-light)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'var(--muted)',
                marginBottom: '8px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Объект
              </div>
              <div style={{
                fontSize: '18px',
                color: 'var(--text)',
                fontWeight: '600'
              }}>
                📍 {getObjectName ? getObjectName(violation.object) : `${violation.object?.name || 'Неизвестный объект'}`}
              </div>
              {violation.object?.address && (
                <div style={{
                  fontSize: '14px',
                  color: 'var(--muted)',
                  marginTop: '4px'
                }}>
                  {violation.object.address}
                </div>
              )}
            </div>

            {/* Описание */}
            {violation.description && (
              <div>
                <div style={{
                  fontSize: '18px',
                  color: 'var(--text)',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  📝 Описание нарушения
                </div>
                <div style={{
                  background: 'var(--bg-light)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '16px',
                  color: 'var(--text)',
                  lineHeight: '1.6'
                }}>
                  {violation.description}
                </div>
              </div>
            )}

            {/* Флаги важности */}
            {(violation.requires_stop || violation.requires_personal_recheck) && (
              <div>
                <div style={{
                  fontSize: '18px',
                  color: 'var(--text)',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  ⚡ Особые требования
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {violation.requires_stop && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#fef2f2',
                      border: '2px solid #fecaca',
                      borderRadius: '12px',
                      color: '#dc2626',
                      fontSize: '15px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      ⚠️ Требует остановки работ
                    </div>
                  )}
                  {violation.requires_personal_recheck && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#fefce8',
                      border: '2px solid #fde047',
                      borderRadius: '12px',
                      color: '#a16207',
                      fontSize: '15px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      👁️ Требует личной проверки
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Вложения */}
            {violation.attachments && violation.attachments.length > 0 && (
              <div>
                <div style={{
                  fontSize: '18px',
                  color: 'var(--text)',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  📎 Дополнительные файлы
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {violation.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: 'var(--bg-light)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: 'var(--brand)',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'var(--brand)10'
                        e.target.style.transform = 'translateY(-1px)'
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'var(--bg-light)'
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      📎 Вложение {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}


          {/* Блок для отправки отчёта прорабом */}
          {canSubmitReport && (
            <div style={{
              background: 'var(--bg-light)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                color: 'var(--text)',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Отчёт об исправлении
              </div>
              
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Опишите, как было исправлено нарушение..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
              />

              {/* Блок для загрузки фотографий */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text)',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  📸 Фотографии исправления
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  id="photo-upload"
                />
                
                <label
                  htmlFor="photo-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--text)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--border)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-secondary)'
                  }}
                >
                  📷 Добавить фото
                </label>

                {/* Превью загруженных фотографий */}
                {reportPhotos.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    {reportPhotos.map((photo, index) => (
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
                            height: '80px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
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
                          bottom: '2px',
                          left: '2px',
                          right: '2px',
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
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportText.trim() || submittingReport}
                  className="btn"
                  style={{
                    background: 'var(--brand)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: (!reportText.trim() || submittingReport) ? 0.5 : 1,
                    boxShadow: 'none'
                  }}
                >
                  {submittingReport ? 'Отправляем...' : `Отправить отчёт${reportPhotos.length > 0 ? ` (${reportPhotos.length} фото)` : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Сообщение для ССК/ИКО, которые не являются авторами */}
          {cannotReviewReason && (
            <div style={{
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '24px'
                }}>
                  🚫
                </div>
                <div style={{
                  fontSize: '18px',
                  color: '#92400e',
                  fontWeight: '600'
                }}>
                  Нет доступа к проверке
                </div>
              </div>
              <div style={{
                fontSize: '16px',
                color: '#92400e',
                lineHeight: '1.5'
              }}>
                Только автор нарушения может подтвердить или отклонить исправление. 
                Это нарушение было создано другим сотрудником.
              </div>
            </div>
          )}

          {/* Блок для принятия/отклонения отчёта ССК/ИКО */}
          {canReviewReport && (
            <div style={{
              background: 'var(--bg-light)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                color: 'var(--text)',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Проверка отчёта об исправлении
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--muted)',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                Прораб отправил отчёт об исправлении нарушения. Проверьте качество исправления и примите решение.
              </div>
              
              {((violation.fixes && violation.fixes.length > 0 && violation.fixes[0].comment) || violation.fix_report || violation.fix_comment || violation.comment) && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    marginBottom: '4px'
                  }}>
                    Отчёт прораба об исправлении:
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--text)',
                    lineHeight: '1.4'
                  }}>
                    {violation.fixes && violation.fixes.length > 0 ? violation.fixes[0].comment : (violation.fix_report || violation.fix_comment || violation.comment)}
                  </div>
                  {(violation.fixes && violation.fixes.length > 0 && violation.fixes[0].created_at) || violation.fixed_at ? (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginTop: '8px'
                    }}>
                      📅 {violation.fixes && violation.fixes.length > 0 && violation.fixes[0].created_at ? 
                        new Date(violation.fixes[0].created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        `Исправлено: ${new Date(violation.fixed_at).toLocaleDateString('ru-RU')} в ${new Date(violation.fixed_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`
                      }
                    </div>
                  ) : null}
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  onClick={handleRejectReport}
                  disabled={reviewing}
                  className="btn"
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: reviewing ? 0.5 : 1,
                    boxShadow: 'none'
                  }}
                >
                  {reviewing ? 'Обрабатываем...' : 'Отклонить исправление'}
                </button>
                <button
                  onClick={handleApproveReport}
                  disabled={reviewing}
                  className="btn"
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: reviewing ? 0.5 : 1,
                    boxShadow: 'none'
                  }}
                >
                  {reviewing ? 'Обрабатываем...' : 'Подтвердить исправление'}
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Правая колонка - фотографии и дополнительная информация */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
             {/* Фотографии нарушения */}
             {violation.violation_photos_folder_url && violation.violation_photos_folder_url.length > 0 && (
               <div>
                 <div style={{
                   fontSize: '18px',
                   color: 'var(--text)',
                   fontWeight: '600',
                   marginBottom: '16px'
                 }}>
                   📸 Фотографии нарушения
                 </div>
                 <div style={{
                   display: 'grid',
                   gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                   gap: '12px'
                 }}>
                   {violation.violation_photos_folder_url.map((photo, index) => (
                     <div
                       key={index}
                       style={{
                         position: 'relative',
                         borderRadius: '12px',
                         overflow: 'hidden',
                         background: 'var(--bg-secondary)',
                         border: '1px solid var(--border)',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onClick={() => window.open(photo, '_blank')}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.transform = 'scale(1.02)'
                         e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.transform = 'scale(1)'
                         e.currentTarget.style.boxShadow = 'none'
                       }}
                     >
                       <img
                         src={photo}
                         alt={`Фото нарушения ${index + 1}`}
                         style={{
                           width: '100%',
                           height: '120px',
                           objectFit: 'cover',
                           display: 'block'
                         }}
                         onError={(e) => {
                           e.target.style.display = 'none'
                           e.target.parentElement.innerHTML = `
                             <div style="
                               display: flex;
                               align-items: center;
                               justify-content: center;
                               height: 120px;
                               color: var(--muted);
                               font-size: 14px;
                             ">
                               📷 Фото недоступно
                             </div>
                           `
                         }}
                       />
                       <div style={{
                         position: 'absolute',
                         bottom: '8px',
                         right: '8px',
                         background: 'rgba(0,0,0,0.7)',
                         color: 'white',
                         padding: '4px 8px',
                         borderRadius: '6px',
                         fontSize: '12px',
                         fontWeight: '500'
                       }}>
                         {index + 1}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Фотографии исправления от прораба */}
             {violation.fixes && violation.fixes.length > 0 && violation.fixes[0].fix_photos_folder_url && violation.fixes[0].fix_photos_folder_url.length > 0 && (
               <div>
                 <div style={{
                   fontSize: '18px',
                   color: 'var(--text)',
                   fontWeight: '600',
                   marginBottom: '16px'
                 }}>
                   🔧 Фотографии исправления
                 </div>
                 <div style={{
                   display: 'grid',
                   gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                   gap: '12px'
                 }}>
                   {violation.fixes[0].fix_photos_folder_url.map((photo, index) => (
                     <div
                       key={index}
                       style={{
                         position: 'relative',
                         borderRadius: '12px',
                         overflow: 'hidden',
                         background: 'var(--bg-secondary)',
                         border: '2px solid #10b981',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onClick={() => window.open(photo, '_blank')}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.transform = 'scale(1.02)'
                         e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.25)'
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.transform = 'scale(1)'
                         e.currentTarget.style.boxShadow = 'none'
                       }}
                     >
                       <img
                         src={photo}
                         alt={`Фото исправления ${index + 1}`}
                         style={{
                           width: '100%',
                           height: '120px',
                           objectFit: 'cover',
                           display: 'block'
                         }}
                         onError={(e) => {
                           e.target.style.display = 'none'
                           e.target.parentElement.innerHTML = `
                             <div style="
                               display: flex;
                               align-items: center;
                               justify-content: center;
                               height: 120px;
                               color: var(--muted);
                               font-size: 14px;
                             ">
                               🔧 Фото недоступно
                             </div>
                           `
                         }}
                       />
                       <div style={{
                         position: 'absolute',
                         bottom: '8px',
                         right: '8px',
                         background: 'rgba(16,185,129,0.9)',
                         color: 'white',
                         padding: '4px 8px',
                         borderRadius: '6px',
                         fontSize: '12px',
                         fontWeight: '500'
                       }}>
                         {index + 1}
                       </div>
                       <div style={{
                         position: 'absolute',
                         top: '8px',
                         left: '8px',
                         background: 'rgba(16,185,129,0.9)',
                         color: 'white',
                         padding: '2px 6px',
                         borderRadius: '4px',
                         fontSize: '10px',
                         fontWeight: '600'
                       }}>
                         🔧 ИСПРАВЛЕНО
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

            {/* Метаданные */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '18px',
                color: 'var(--text)',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                ℹ️ Информация
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{color: 'var(--muted)', fontWeight: '500'}}>ID:</span>
                  <span style={{color: 'var(--text)', fontWeight: '600'}}>{violation.id}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{color: 'var(--muted)', fontWeight: '500'}}>Автор:</span>
                  <span style={{
                    color: isAuthor ? 'var(--brand)' : 'var(--text)', 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isAuthor && '👤 '}
                    {isAuthor ? 'Вы' : 'Другой сотрудник'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{color: 'var(--muted)', fontWeight: '500'}}>Создано:</span>
                  <span style={{color: 'var(--text)', fontWeight: '600'}}>
                    {new Date(violation.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{color: 'var(--muted)', fontWeight: '500'}}>Время:</span>
                  <span style={{color: 'var(--text)', fontWeight: '600'}}>
                    {new Date(violation.created_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
                {violation.closed_at && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{color: 'var(--muted)', fontWeight: '500'}}>Закрыто:</span>
                    <span style={{color: 'var(--text)', fontWeight: '600'}}>
                      {new Date(violation.closed_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
