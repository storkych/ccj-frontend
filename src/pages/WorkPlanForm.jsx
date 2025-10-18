import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { createWorkPlan, getObject, getWorkPlan } from '../api/api.js'
import { createWorkPlanChangeRequest } from '../api/workPlans.js'
import SubAreaColumn from '../components/SubAreaColumn.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import NotificationToast from '../components/NotificationToast.jsx'
import { useNotification } from '../hooks/useNotification.js'

export default function WorkPlanForm(){
  const { objectId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  
  const isEditMode = searchParams.get('edit') === 'true'
  const planId = searchParams.get('planId')
  
  const [object, setObject] = useState(null)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [rows, setRows] = useState([
    { id: 1, name:'', quantity:0, unit:'усл.', start_date:'', end_date:'', sub_areas: [] }
  ])
  const [allSubAreas, setAllSubAreas] = useState([])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const units = ['усл.', 'шт', 'м²', 'м³', 'м', 'кг', 'т', 'л']
  
  const addRow = () => setRows(r => [...r, { id: Date.now(), name:'', quantity:0, unit:'усл.', start_date:'', end_date:'', sub_areas: [] }])
  const delRow = (idx) => setRows(r => r.filter((_,i)=>i!==idx))
  const update = (rowId, field, val) => setRows(r => r.map((row,i)=> row.id === rowId ? { ...row, [field]:val } : row))
  
  const addSubArea = (subArea) => {
    setAllSubAreas(prev => [...prev, subArea])
  }
  
  const selectSubArea = (rowId, subArea) => {
    const row = rows.find(r => r.id === rowId)
    if (row && !row.sub_areas.some(sa => sa.id === subArea.id)) {
      update(rowId, 'sub_areas', [...row.sub_areas, subArea])
    }
  }

  useEffect(()=>{
    if (objectId) {
      getObject(objectId).then(obj => {
        console.log('[ui work-plan-form] object loaded', obj)
        setObject(obj)
      }).catch(e => {
        console.warn('[ui work-plan-form] object error', e)
        setObject(null)
      })
    }
  }, [objectId])

  // Загрузка данных в режиме редактирования
  useEffect(() => {
    if (isEditMode && planId && !dataLoaded) {
      setLoading(true)
      getWorkPlan(planId).then(plan => {
        setTitle(plan.title || '')
        if (plan.work_items && plan.work_items.length > 0) {
          const formattedRows = plan.work_items.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            name: item.name || '',
            quantity: item.quantity || 0,
            unit: item.unit || 'усл.',
            start_date: item.start_date || '',
            end_date: item.end_date || '',
            sub_areas: item.sub_areas || []
          }))
          setRows(formattedRows)
          
          // Собираем все подполигоны
          const allSubAreas = plan.work_items.flatMap(item => item.sub_areas || [])
          setAllSubAreas(allSubAreas)
        }
        setDataLoaded(true)
      }).catch(e => {
        console.error('Ошибка загрузки плана для редактирования:', e)
        showError('Ошибка загрузки плана: ' + (e?.message || ''))
      }).finally(() => {
        setLoading(false)
      })
    }
  }, [isEditMode, planId, dataLoaded])

  const isValid = useMemo(()=>{
    if (!object) return false
    if (!rows.length) return false
    for (const it of rows){
      if (!it.name || !it.start_date || !it.end_date || !it.sub_areas || it.sub_areas.length === 0) return false
    }
    return true
  }, [object, rows])

  const submit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    if (isEditMode && !comment.trim()) {
      showError('Комментарий обязателен для редактирования')
      return
    }
    setSaving(true)
    try{
      // Подготавливаем данные в новом формате API
      const items = rows.map(row => ({
        id: row.id, // Включаем ID для существующих элементов
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
        start_date: row.start_date,
        end_date: row.end_date,
        sub_areas: row.sub_areas.map(subArea => ({
          name: subArea.name,
          geometry: subArea.geometry || {
            type: "Polygon",
            coordinates: [[[37.6, 55.7], [37.61, 55.7], [37.61, 55.71], [37.6, 55.71], [37.6, 55.7]]]
          },
          color: subArea.color
        }))
      }))
      
      if (isEditMode) {
        // Режим редактирования - используем change-request для обеих ролей
        await createWorkPlanChangeRequest(planId, comment, items)
        if (user?.role === 'ssk') {
          showSuccess('План работ обновлен')
        } else {
          showSuccess('Запрос на изменение отправлен')
        }
      } else {
        // Режим создания
        const resUuid = await createWorkPlan({ 
          object_id: Number(objectId), 
          items: items, 
          title: title||undefined 
        })
        setResult(resUuid)
      }
      
      // Перенаправляем обратно на страницу объекта
      setTimeout(() => navigate(`/objects/${objectId}`), 2000)
    }catch(err){
      alert('Ошибка создания плана: ' + (err?.message || ''))
    }finally{
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--brand)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Загрузка плана для редактирования...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Основная карточка */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Заголовок */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text)',
            lineHeight: '1.2'
          }}>
            {isEditMode ? 'Редактирование плана работ' : 'Электронная спецификация и перечень работ'}
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: '1.4'
          }}>
            {isEditMode 
              ? (user?.role === 'ssk' ? 'Редактирование детального плана работ' : 'Запрос на изменение плана работ')
              : 'Создание детального плана работ для объекта'
            }
          </p>
        </div>

        {/* Информация об объекте */}
        {object && (
          <div style={{
            background: 'var(--bg-light)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              Объект
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--muted)',
              lineHeight: '1.5'
            }}>
              <strong>{object.name}</strong> — {object.address}
            </p>
        </div>
      )}
      
        {/* Форма создания плана */}
        <form onSubmit={submit}>
          <div style={{
            background: 'var(--bg-light)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              Настройки плана
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)',
                minWidth: '120px'
              }}>
                Название плана:
              </label>
              <input 
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'var(--panel)',
                  color: 'var(--text)'
                }}
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                placeholder="Опционально" 
              />
            </div>
            
            {/* Поле комментария для режима редактирования */}
            {isEditMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  minWidth: '120px'
                }}>
                  Комментарий:
                </label>
                <input 
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'var(--panel)',
                    color: 'var(--text)'
                  }}
                  value={comment} 
                  onChange={e=>setComment(e.target.value)} 
                  placeholder={user?.role === 'ssk' ? 'Описание изменений...' : 'Обоснование изменений...'} 
                  required
                />
              </div>
            )}
          </div>

          {/* Таблица работ */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            {/* Заголовок таблицы */}
            <div style={{
              background: 'linear-gradient(135deg, var(--brand) 0%, #1f2937 100%)',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 100px 100px 150px 150px 200px 80px',
                gap: '12px',
                alignItems: 'center',
                fontWeight: '600',
                fontSize: '14px',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Название работы</div>
                <div>Количество</div>
                <div>Единица</div>
                <div>Дата начала</div>
                <div>Дата окончания</div>
                <div>Подполигоны</div>
                <div>Действия</div>
              </div>
        </div>
        
            {/* Строки таблицы */}
        {rows.map((row, i) => (
              <div key={row.id} style={{
                padding: '16px 20px',
                borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--panel)' : 'rgba(0, 0, 0, 0.15)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = i % 2 === 0 ? 'var(--panel)' : 'rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 100px 150px 150px 200px 80px',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <input 
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--bg-light)',
                      color: 'var(--text)',
                      transition: 'border-color 0.2s ease'
                    }}
                    placeholder="Название работы" 
                    value={row.name} 
                    onChange={e=>update(row.id,'name',e.target.value)} 
                  />
                  <input 
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--bg-light)',
                      color: 'var(--text)',
                      transition: 'border-color 0.2s ease'
                    }}
                    type="number" 
                    placeholder="Кол-во" 
                    value={row.quantity} 
                    onChange={e=>update(row.id,'quantity',e.target.valueAsNumber)} 
                  />
                  <select 
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--bg-light)',
                      color: 'var(--text)',
                      transition: 'border-color 0.2s ease'
                    }}
                    value={row.unit} 
                    onChange={e=>update(row.id,'unit',e.target.value)}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <input 
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--bg-light)',
                      color: 'var(--text)',
                      transition: 'border-color 0.2s ease'
                    }}
                    type="date" 
                    value={row.start_date} 
                    onChange={e=>update(row.id,'start_date',e.target.value)} 
                  />
                  <input 
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'var(--bg-light)',
                      color: 'var(--text)',
                      transition: 'border-color 0.2s ease'
                    }}
                    type="date" 
                    value={row.end_date} 
                    onChange={e=>update(row.id,'end_date',e.target.value)} 
                  />
                  <div>
                    <SubAreaColumn
                      workItem={row}
                      onUpdate={update}
                      onAddSubArea={addSubArea}
                      mainPolygon={object?.areas?.[0]?.geometry ? object.areas[0] : null}
                      allSubAreas={allSubAreas}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={()=>delRow(i)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-light)',
                      color: 'var(--error)',
                      border: '1px solid var(--error)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--error)'
                      e.target.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--bg-light)'
                      e.target.style.color = 'var(--error)'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

        {/* Кнопки управления */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          padding: '20px',
          background: 'var(--bg-light)',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }}>
          <button 
            type="button" 
            onClick={addRow}
            style={{
              background: 'var(--brand)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            + Добавить работу
          </button>
          <button 
            type="submit"
            disabled={saving || !isValid}
            style={{
              background: saving || !isValid ? 'var(--muted)' : 'var(--brand)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving || !isValid ? 'not-allowed' : 'pointer',
              opacity: saving || !isValid ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: saving || !isValid ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (!saving && isValid) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && isValid) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            {saving 
              ? (isEditMode ? 'Сохранение...' : 'Создание...') 
              : (isEditMode 
                  ? (user?.role === 'ssk' ? 'Сохранить изменения' : 'Отправить запрос')
                  : 'Создать план работ'
                )
            }
          </button>
        </div>
      </form>
      </div>

      {/* Результат создания */}
      {result && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              ✓
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              План работ создан успешно
            </h3>
          </div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: '1.5'
          }}>
            ID плана: <strong>{result.id}</strong> — позиций: <strong>{result.versions?.[0]?.items?.length || rows.length}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
