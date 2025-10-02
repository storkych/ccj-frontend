import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getChecklists, getTodayChecklist, createChecklist, updateChecklist } from '../api/api.js'
import { getObjects } from '../api/api.js'

export default function DailyChecklist() {
  const { user } = useAuth()
  const [selectedObject, setSelectedObject] = useState('')
  const [objects, setObjects] = useState([])
  const [todayChecklist, setTodayChecklist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    weather: '',
    temperature: '',
    safety_answers: {},
    issues: [],
    next_day_plan: ''
  })

  // Полный чек-лист безопасности
  const safetyChecklist = [
    // Раздел 1. СОБЛЮДЕНИЕ ТРЕБОВАНИЙ БЕЗОПАСНОСТИ ТРУДА. КУЛЬТУРА ПРОИЗВОДСТВА
    {
      section: 1,
      title: 'СОБЛЮДЕНИЕ ТРЕБОВАНИЙ БЕЗОПАСНОСТИ ТРУДА. КУЛЬТУРА ПРОИЗВОДСТВА',
      items: [
        {
          id: '1_1',
          number: '1.1',
          text: 'Оформление наряд-допуска на безопасное проведение работ в местах охранной зоны: линий электропередач, связи, железной дороги, трубопроводов, объектов культурного наследия и др.'
        },
        {
          id: '1_2',
          number: '1.2',
          text: 'Наличие устойчивого ограждения из секций КГХ с гирляндой фонарей аварийного освещения по периметру зоны работ. Ширина прохода пешеходов между выгородками КГХ не менее 1,5 м.'
        },
        {
          id: '1_3',
          number: '1.3',
          text: 'Наличие крепких пешеходных деревянных настилов (шириной не менее 1,5 метра) в местах прохода пешеходов по не твёрдым покрытиям и газонам. Наличие пандусов при перепаде высот свыше 10 см.'
        },
        {
          id: '1_4',
          number: '1.4',
          text: 'Ограждения КГХ и водоналивные блоки не имеют загрязнений, повреждений, деформаций, вандальных надписей.'
        },
        {
          id: '1_5',
          number: '1.5',
          text: 'Наличие читаемых навигационных указателей для движения пешеходов при выходе из подземных переходов, метро, разветвлениях и пр.'
        },
        {
          id: '1_6',
          number: '1.6',
          text: 'Наличие временных дорожных знаков, разметки, светофоров, импульсных стрелок согласно требованиям ПОДД(С) для безопасного движения транспортных средств в зоне работ.'
        },
        {
          id: '1_7',
          number: '1.7',
          text: 'В местах заезда техники к участкам производства работ обеспечены необходимые "карманы или воротнички" для безопасного производства работ.'
        },
        {
          id: '1_8',
          number: '1.8',
          text: 'Закрытие штроб, траншей крепкими пешеходными деревянными настилами в зоне остановок общественного транспорта (допускается временная засыпка асфальтобетонной крошкой, щебнем).'
        },
        {
          id: '1_9',
          number: '1.9',
          text: 'Проход пешеходов к остановкам общественного транспорта без выхода на проезжую часть.'
        },
        {
          id: '1_10',
          number: '1.10',
          text: 'Наличие защитного ограждения зелёных насаждений (деревья защищаются сплошными деревянными щитами высотой 2м не более 0,5м от ствола. Кустарники - щитами высотой не менее 1 м).'
        },
        {
          id: '1_11',
          number: '1.11',
          text: 'Оголенная корневая система зеленых насаждений укрыта геотекстилем (дорнитом) либо засыпана плодородным грунтом.'
        },
        {
          id: '1_12',
          number: '1.12',
          text: 'Ограждения материала, либо строительного мусора (объёмом не более 1 кузова самосвала) согласно п.1.2.'
        },
        {
          id: '1_13',
          number: '1.13',
          text: 'Наличие защитного ограждения сохраняемой облицовки зданий и сооружений (парапеты, стены, цоколи входа/выхода метро, подземных переходов, автобусных остановок). Ограждение из фанеры или сплошных деревянных щитов.'
        },
        {
          id: '1_14',
          number: '1.14',
          text: 'Своевременный вывоз строительного мусора (объемом более 1 кузова самосвала), а также демонтируемого оборудования и МАФ.'
        },
        {
          id: '1_15',
          number: '1.15',
          text: 'Наличие оперативной бригады для содержания ограждения зон производства работ согласно требованиям п. 1.2. Отсутствие бытового мусора в выгородках.'
        },
        {
          id: '1_16',
          number: '1.16',
          text: 'Складирование материалов в соответствие с требованиями НТД (бордюрный камень на поддонах в штабелях до 2м, полиэтиленовые трубы до 3м на подкладках, инертные материалы с ограждением).'
        },
        {
          id: '1_17',
          number: '1.17',
          text: 'Обеспечение электробезопасности (отсутствие оголенных проводов, треснутых розеток), пожаробезопасности (наличие огнетушителя при сварочных работах).'
        },
        {
          id: '1_18',
          number: '1.18',
          text: 'Строительная техника исправна, имеет звуковой сигнал при движении задним ходом.'
        },
        {
          id: '1_19',
          number: '1.19',
          text: 'Инструмент для выполнения работ, оснастки, специальные приспособления, троса, леса и прочее для выполнения работ в исправном состоянии.'
        },
        {
          id: '1_20',
          number: '1.20',
          text: 'Обеспечение работников средствами СИЗ (спецодежда, спецобувь, сигнальные жилеты, рукавицы, каски, защитные очки для УШМ, сварочная экипировка).'
        }
      ]
    },
    // Раздел 2. ПРОИЗВОДСТВО РАБОТ ПО УСТРОЙСТВУ БОРДЮРНЫХ КАМНЕЙ
    {
      section: 2,
      title: 'ПРОИЗВОДСТВО РАБОТ ПО УСТРОЙСТВУ БОРДЮРНЫХ КАМНЕЙ',
      items: [
        {
          id: '2_1',
          number: '2.1',
          text: 'Сколы на бордюрных камнях свыше допустимых значений (свыше 10 мм сколы НЕ допускаются).'
        },
        {
          id: '2_2',
          number: '2.2',
          text: 'Планово-высотное смещение бордюрных камней на стыках не более 5мм.'
        },
        {
          id: '2_3',
          number: '2.3',
          text: 'Зазоры на стыках бордюрных камней (включая толщину компенсатора) не более 5мм.'
        },
        {
          id: '2_4',
          number: '2.4',
          text: 'При наличии зазоров (до 10 мм) между бордюрными камнями, шов НЕ заполнен бетонным раствором портландцементного класса не ниже В30.'
        },
        {
          id: '2_5',
          number: '2.5',
          text: 'Прямолинейная установка бортовых камней.'
        },
        {
          id: '2_6',
          number: '2.6',
          text: 'Установка бордюрных камней выполнена ВЫШЕ или НИЖЕ уровня профиля газона, асфальтобетонного покрытия, тротуарной плитки (допускается до 5 см).'
        },
        {
          id: '2_7',
          number: '2.7',
          text: 'Выступ бортового камня за пределы КДО.'
        },
        {
          id: '2_8',
          number: '2.8',
          text: 'Применены непроектные элементы (углы, радиусы) бордюрного камня.'
        },
        {
          id: '2_9',
          number: '2.9',
          text: 'Уплотнение песчаного основания виброплитой за 3-4 прохода.'
        },
        {
          id: '2_10',
          number: '2.10',
          text: 'Размеры бетонной обоймы бортового камня соответствуют проектному решению, бетон имеет единое тело на всём сечении. Применяется бетон класса не ниже В15.'
        },
        {
          id: '2_11',
          number: '2.11',
          text: 'Бетонная обойма бордюрного камня НЕ ИМЕЕТ повреждений. Бетон не крошится после набора прочности.'
        }
      ]
    },
    // Раздел 3. БЕТОННЫЕ РАБОТЫ. УСТРОЙСТВО БЕТОННЫХ ДОРОГ
    {
      section: 3,
      title: 'БЕТОННЫЕ РАБОТЫ. УСТРОЙСТВО БЕТОННЫХ ДОРОГ',
      items: [
        {
          id: '3_1',
          number: '3.1',
          text: 'Подготовка основания: плодородный слой удален полностью (10-30 см), укладка геотекстиля, песчаное основание 15-30 см уплотнено, щебеночно-гравийная смесь 20-40 см утрамбована.'
        },
        {
          id: '3_2',
          number: '3.2',
          text: 'Монтаж опалубки: установлена надёжно без щелей, нанесена эмульсия, геометрические параметры соответствуют проекту, отмечены маяки, уложен армированный каркас 12-16 мм (при необходимости).'
        },
        {
          id: '3_3',
          number: '3.3',
          text: 'Бетонирование: покрытие толщиной 18-24 см, смесь уплотнена и выровнена по маякам, обеспечен уход постоянным увлажнением при наборе прочности (до 50-60%).'
        }
      ]
    },
    // Раздел 4. АСФАЛЬТОБЕТОННЫЕ ДОРОГИ, ТРОТУАРЫ
    {
      section: 4,
      title: 'АСФАЛЬТОБЕТОННЫЕ ДОРОГИ, ТРОТУАРЫ ИЗ АСФАЛЬТОБЕТОННОГО ПОКРЫТИЯ',
      items: [
        {
          id: '4_1',
          number: '4.1',
          text: 'Подготовка основания: плодородный слой удален (10-100 см), геотекстиль, песчаное основание 15-40 см уплотнено, щебеночно-гравийная смесь 20-40 см, геосетка/георешетка (при проектном решении).'
        },
        {
          id: '4_2',
          number: '4.2',
          text: 'Укладка покрытия: проливка битумной эмульсией (не позднее 3 часов), температура асфальтобетона 120-160°С, проход катка не менее 5 раз, температура уплотнения 80-120°С, коэффициент уплотнения не ниже 0,93.'
        }
      ]
    },
    // Раздел 5. УСТРОЙСТВО ТРОТУАРА ИЗ ТРОТУАРНОЙ ПЛИТКИ
    {
      section: 5,
      title: 'УСТРОЙСТВО ТРОТУАРА ИЗ ТРОТУАРНОЙ ПЛИТКИ',
      items: [
        {
          id: '5_1',
          number: '5.1',
          text: 'Подготовка основания: плодородный слой удален (0-30 см), геотекстиль (при проектном решении), песчаное основание проектной толщины уплотнено.'
        },
        {
          id: '5_2',
          number: '5.2',
          text: 'Укладка плитки: высотно-плановые перепады в стыках не более 5 мм, швы между плитками не более 5 мм, шов заполнен герметизирующим материалом.'
        }
      ]
    }
  ]

  useEffect(() => {
    loadData()
  }, [selectedObject])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Загружаем объекты
      const objectsData = await getObjects()
      setObjects(objectsData.items || [])
      
      // Автоматически выбираем первый объект, если ничего не выбрано
      if (!selectedObject && objectsData.items && objectsData.items.length > 0) {
        setSelectedObject(objectsData.items[0].id.toString())
        return // useEffect перезапустится с новым selectedObject
      }
      
      // Загружаем сегодняшний чек-лист если объект выбран
      if (selectedObject) {
        const checklist = await getTodayChecklist(selectedObject)
        setTodayChecklist(checklist)
        
        if (checklist) {
          // Заполняем форму данными из существующего чек-листа
          setFormData({
            weather: checklist.data?.weather || '',
            temperature: checklist.data?.temperature || '',
            safety_answers: checklist.data?.safety_answers || {},
            issues: checklist.data?.issues || [],
            next_day_plan: checklist.data?.next_day_plan || ''
          })
        } else {
          // Сбрасываем форму для нового чек-листа
          setFormData({
            weather: '',
            temperature: '',
            safety_answers: {},
            issues: [],
            next_day_plan: ''
          })
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      alert('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSafetyAnswerChange = (measureId, answer) => {
    setFormData(prev => ({
      ...prev,
      safety_answers: {
        ...prev.safety_answers,
        [measureId]: answer
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedObject) {
      alert('Выберите объект')
      return
    }

    try {
    setSaving(true)
      
      const checklistData = {
        object_id: parseInt(selectedObject),
        data: {
          date: new Date().toISOString().split('T')[0],
          weather: formData.weather,
          temperature: formData.temperature,
          safety_answers: formData.safety_answers,
          issues: formData.issues,
          next_day_plan: formData.next_day_plan
        }
      }

      let result
      if (todayChecklist) {
        // Обновляем существующий чек-лист
        result = await updateChecklist(todayChecklist.id, checklistData)
      } else {
        // Создаем новый чек-лист
        result = await createChecklist(checklistData)
      }

      setTodayChecklist(result)
      alert(todayChecklist ? 'Чек-лист обновлен!' : 'Чек-лист создан!')
      
    } catch (error) {
      console.error('Ошибка сохранения чек-листа:', error)
      alert('Ошибка при сохранении чек-листа')
    } finally {
    setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: 'var(--muted)'
        }}>
          Загрузка...
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Заголовок */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--text)'
        }}>
          Ежедневные чек-листы
        </h1>
      </div>

      {/* Выбор объекта */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <label style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text)'
          }}>
            Выберите объект:
          </label>
          <select
            value={selectedObject}
            onChange={(e) => setSelectedObject(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'var(--panel)',
              color: 'var(--text)',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="">Выберите объект</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
          </select>
        </div>

        {selectedObject && (
          <div style={{
            padding: '12px',
            background: todayChecklist ? '#d1fae5' : '#fef3c7',
            border: `1px solid ${todayChecklist ? '#10b981' : '#f59e0b'}`,
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {todayChecklist ? (
              <span style={{ color: '#065f46' }}>
                ✅ Чек-лист на сегодня уже создан. Вы можете его редактировать.
              </span>
            ) : (
              <span style={{ color: '#92400e' }}>
                ⚠️ Чек-лист на сегодня еще не создан. Заполните форму ниже.
              </span>
            )}
          </div>
        )}
      </div>

      {selectedObject && (
        <>
          {/* Общая информация */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              Общая информация
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '8px'
                }}>
                  Погода
                </label>
                <input
                  type="text"
                  value={formData.weather}
                  onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
                  placeholder="Ясно, облачно, дождь..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '8px'
                }}>
                  Температура
                </label>
                <input
                  type="text"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  placeholder="+5°C, -10°C..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Чек-лист безопасности */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              Соблюдение требований безопасности труда
            </h2>

            <div style={{
              display: 'grid',
              gap: '24px'
            }}>
              {safetyChecklist.map(section => (
                <div key={section.section} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{
                    margin: '0 0 20px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    borderBottom: '2px solid var(--border)',
                    paddingBottom: '8px'
                  }}>
                    {section.section}. {section.title}
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {section.items.map(item => (
                      <div key={item.id} style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '16px',
                        alignItems: 'flex-start',
                        padding: '16px',
                        background: 'var(--panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                      }}>
                        {/* Номер пункта */}
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--brand)',
                          minWidth: '30px'
                        }}>
                          {item.number}
                        </div>
                        
                        {/* Текст пункта */}
                        <div style={{
                          fontSize: '14px',
                          lineHeight: '1.5',
                          color: 'var(--text)'
                        }}>
                          {item.text}
                        </div>
                        
                        {/* Радиокнопки */}
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          flexShrink: 0
                        }}>
                          {['yes', 'no', 'not_required'].map(option => (
                            <label key={option} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              whiteSpace: 'nowrap'
                            }}>
                              <input
                                type="radio"
                                name={item.id}
                                value={option}
                                checked={formData.safety_answers[item.id] === option}
                                onChange={(e) => handleSafetyAnswerChange(item.id, e.target.value)}
                                style={{
                                  margin: 0
                                }}
                              />
                              <span style={{ 
                                color: option === 'yes' ? '#10b981' : 
                                       option === 'no' ? '#ef4444' : 
                                       'var(--muted)'
                              }}>
                                {option === 'yes' ? 'Да' : 
                                 option === 'no' ? 'Нет' : 
                                 'Не требуется'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          ))}
        </div>
          </div>

          {/* План на завтра */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              План работ на завтра
            </h2>

            <textarea
              value={formData.next_day_plan}
              onChange={(e) => setFormData(prev => ({ ...prev, next_day_plan: e.target.value }))}
              placeholder="Опишите планируемые работы на завтра..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--panel)',
                color: 'var(--text)',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Кнопка сохранения */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 32px',
                background: saving ? 'var(--muted)' : 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {saving ? 'Сохранение...' : (todayChecklist ? 'Обновить чек-лист' : 'Создать чек-лист')}
            </button>
          </div>
        </>
      )}
        </div>
  )
}