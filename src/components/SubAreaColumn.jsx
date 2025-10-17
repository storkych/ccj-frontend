import React, { useState } from 'react'
import SubAreaMap from './SubAreaMap.jsx'

export default function SubAreaColumn({
  workItem, 
  onUpdate, 
  onAddSubArea,
  mainPolygon = null, // Основной полигон объекта
  allSubAreas = [] // Все существующие подполигоны для проверки уникальности
}) {
  const [showModal, setShowModal] = useState(false)
  const [newSubAreaName, setNewSubAreaName] = useState('')
  const [newSubAreaGeometry, setNewSubAreaGeometry] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [clearExisting, setClearExisting] = useState(false)
  const [hasNewPolygon, setHasNewPolygon] = useState(false)

  const handleCreateNew = () => {
    console.log('handleCreateNew вызвана:', {
      name: newSubAreaName,
      geometry: newSubAreaGeometry,
      hasName: !!newSubAreaName.trim(),
      hasGeometry: !!newSubAreaGeometry
    })
    
    if (!newSubAreaName.trim() || !newSubAreaGeometry) {
      console.log('Недостаточно данных для создания подполигона')
      return
    }
    
    const newSubArea = {
      id: `temp_${Date.now()}`,
      name: newSubAreaName.trim(),
      geometry: newSubAreaGeometry,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }
    
    console.log('Создаем новый подполигон:', newSubArea)
    
    onAddSubArea(newSubArea)
    // Заменяем существующий подполигон (1 работа = 1 подполигон)
    onUpdate(workItem.id, 'sub_areas', [newSubArea])
    setNewSubAreaName('')
    setNewSubAreaGeometry(null)
    setShowMap(false)
    setShowModal(false)
  }

  const handleGeometryCreated = (geometry) => {
    console.log('Получена геометрия в SubAreaColumn:', geometry)
    setNewSubAreaGeometry(geometry)
    setClearExisting(false) // Сбрасываем флаг очистки после создания нового полигона
    setHasNewPolygon(true) // Отмечаем что есть новый полигон
    console.log('newSubAreaGeometry установлена:', geometry)
  }



  const getSubAreaDisplay = () => {
    if (!workItem.sub_areas || workItem.sub_areas.length === 0) {
      return 'не задан'
    }
    return workItem.sub_areas[0].name
  }

  // Проверка уникальности названия
  const isNameUnique = (name) => {
    if (!name.trim()) return true
    return !allSubAreas.some(subArea => 
      subArea.name.toLowerCase() === name.toLowerCase() && 
      subArea.id !== workItem.sub_areas?.[0]?.id
    )
  }

  const isFormValid = () => {
    return newSubAreaName.trim() && 
           newSubAreaGeometry && 
           isNameUnique(newSubAreaName.trim())
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minHeight: '32px',
        padding: '4px 8px',
        background: 'var(--bg-light)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          background: 'var(--bg)',
          borderColor: 'var(--brand)'
        }
      }}
      onClick={() => {
        setShowModal(true)
        setShowMap(true)
        setHasNewPolygon(false) // Сбрасываем флаг нового полигона при открытии модалки
        if (workItem.sub_areas && workItem.sub_areas.length > 0) {
          // При изменении - загружаем существующий подполигон
          setNewSubAreaName(workItem.sub_areas[0].name)
          setNewSubAreaGeometry(workItem.sub_areas[0].geometry)
        } else {
          // При создании - очищаем поля
          setNewSubAreaName('')
          setNewSubAreaGeometry(null)
        }
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'var(--bg)'
        e.target.style.borderColor = 'var(--brand)'
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'var(--bg-light)'
        e.target.style.borderColor = 'var(--border)'
      }}
      >
        {/* Кружок с цветом подполигона */}
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: workItem.sub_areas && workItem.sub_areas.length > 0 
            ? (workItem.sub_areas[0].color || '#3b82f6')
            : '#9ca3af',
          flexShrink: 0
        }} />
        
        {/* Название подполигона */}
        <div style={{
          flex: 1,
          fontSize: '14px',
          color: workItem.sub_areas && workItem.sub_areas.length > 0 ? 'var(--text)' : 'var(--muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {workItem.sub_areas && workItem.sub_areas.length > 0 
            ? workItem.sub_areas[0].name 
            : 'не задан'
          }
        </div>
        
        {/* Кнопка действия */}
        <div style={{
          fontSize: '12px',
          color: 'var(--brand)',
          fontWeight: '500',
          whiteSpace: 'nowrap'
        }}>
          {workItem.sub_areas && workItem.sub_areas.length > 0 ? 'изменить' : 'задать'}
        </div>
      </div>

      {/* Модальное окно для выбора подполигонов */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: 0,
            maxWidth: '1400px',
            width: '98%',
            maxHeight: '98vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            position: 'relative'
          }}>
            {/* Цветная полоса сверху */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--brand) 0%, #3b82f6 100%)'
            }} />
            
            {/* Заголовок */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 24px 0 24px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{
                   width: '40px',
                   height: '40px',
                   borderRadius: '8px',
                   background: 'linear-gradient(135deg, var(--brand) 0%, #3b82f6 100%)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   color: 'white',
                   fontSize: '18px',
                   fontWeight: '600'
                 }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                     <circle cx="12" cy="10" r="3"/>
                   </svg>
                 </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    lineHeight: '1.2'
                  }}>
                    Выбор подполигона для работы
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: 'var(--muted)',
                    lineHeight: '1.4'
                  }}>
                    Создайте или измените подполигон для выбранной работы
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'var(--bg-light)',
                  border: '1px solid var(--border)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--error)'
                  e.target.style.color = 'white'
                  e.target.style.borderColor = 'var(--error)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-light)'
                  e.target.style.color = 'var(--muted)'
                  e.target.style.borderColor = 'var(--border)'
                }}
              >
                ×
              </button>
            </div>

            {/* Контентная область */}
            <div style={{
              padding: '0 24px 24px 24px',
              overflow: 'auto'
            }}>
              {/* Создание нового подполигона */}
              <div style={{
                background: 'var(--bg-light)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
              
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newSubAreaName}
                  onChange={(e) => setNewSubAreaName(e.target.value)}
                  placeholder="Название подполигона"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                
                {showMap && (
                  <div>
                    {workItem.sub_areas && workItem.sub_areas.length > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '8px'
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSubAreaGeometry(null)
                            setNewSubAreaName('')
                            setClearExisting(true)
                            setHasNewPolygon(false)
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--bg-light)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'var(--warning)'
                            e.target.style.color = 'white'
                            e.target.style.borderColor = 'var(--warning)'
                            e.target.style.transform = 'translateY(-1px)'
                            e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'var(--bg-light)'
                            e.target.style.color = 'var(--text)'
                            e.target.style.borderColor = 'var(--border)'
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          Пересоздать
                        </button>
                      </div>
                    )}
                    
                    {mainPolygon ? (
                    <div style={{ marginBottom: '20px', minHeight: '650px' }}>
                      <SubAreaMap
                        mainPolygon={mainPolygon}
                        onPolygonCreated={handleGeometryCreated}
                        height={600}
                        subAreaName={newSubAreaName}
                        existingGeometry={clearExisting || hasNewPolygon ? null : (workItem.sub_areas && workItem.sub_areas.length > 0 ? workItem.sub_areas[0].geometry : null)}
                        onClear={newSubAreaGeometry === null ? Date.now() : null}
                      />
                    </div>
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'var(--muted)',
                        background: 'var(--bg-light)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                      }}>
                        Основной полигон объекта не найден
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>



            {/* Кнопки действий для создания подполигона */}
            {showMap && (
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                marginBottom: '20px',
                paddingTop: '20px',
                paddingBottom: '20px',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)'
              }}>
                {console.log('Показываем кнопки внизу модального окна')}
                <button
                  type="button"
                  onClick={() => {
                    console.log('Кнопка Создать нажата!', {
                      name: newSubAreaName,
                      geometry: newSubAreaGeometry,
                      hasName: !!newSubAreaName.trim(),
                      hasGeometry: !!newSubAreaGeometry
                    })
                    handleCreateNew()
                  }}
                  disabled={!isFormValid()}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: !isFormValid() ? 'var(--muted)' : 'var(--brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: !isFormValid() ? 'not-allowed' : 'pointer',
                    opacity: !isFormValid() ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: !isFormValid() ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (isFormValid()) {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isFormValid()) {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {!newSubAreaName.trim() ? 'Создать подполигон (введите название)' : 
                   !newSubAreaGeometry ? 'Создать подполигон (нарисуйте на карте)' : 
                   !isNameUnique(newSubAreaName.trim()) ? 'Название уже используется' :
                   `Создать "${newSubAreaName}"`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewSubAreaGeometry(null)
                    setNewSubAreaName('')
                    setClearExisting(true)
                    setHasNewPolygon(false)
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--bg-light)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginLeft: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--warning)'
                    e.target.style.color = 'white'
                    e.target.style.borderColor = 'var(--warning)'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-light)'
                    e.target.style.color = 'var(--text)'
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  Пересоздать
                </button>
              </div>
            )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
