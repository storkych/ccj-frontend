import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getChecklists, getTodayChecklist, createChecklist, updateChecklist } from '../api/api.js'
import { getObjects } from '../api/api.js'
import NotificationToast from '../components/NotificationToast.jsx'
import { useNotification } from '../hooks/useNotification.js'

export default function DailyChecklist() {
  const { user } = useAuth()
  const { notification, showSuccess, showError, hide } = useNotification()
  const [selectedObject, setSelectedObject] = useState('')
  const [objects, setObjects] = useState([])
  const [todayChecklist, setTodayChecklist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [switchingObject, setSwitchingObject] = useState(false)
          const [formData, setFormData] = useState({
            safety_answers: {},
            issues: []
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

  // Подсчет общего количества пунктов
  const totalItems = safetyChecklist.reduce((total, section) => total + section.items.length, 0)

  useEffect(() => {
    loadData() // Первоначальная загрузка
  }, [])

  useEffect(() => {
    if (selectedObject) {
      loadData(true) // Переключение объекта
    }
  }, [selectedObject])

  const loadData = async (isObjectSwitch = false) => {
    try {
      if (isObjectSwitch) {
        setSwitchingObject(true)
      } else {
        setLoading(true)
      }
      
      // Загружаем объекты
      const objectsData = await getObjects()
      setObjects(objectsData.items || [])
      
      // Загружаем сегодняшний чек-лист если объект выбран
      if (selectedObject) {
        const checklist = await getTodayChecklist(selectedObject)
        setTodayChecklist(checklist)
        
                if (checklist) {
                  // Заполняем форму данными из существующего чек-листа
                  setFormData({
                    safety_answers: checklist.data?.safety_answers || {},
                    issues: checklist.data?.issues || []
                  })
                } else {
                  // Сбрасываем форму для нового чек-листа
                  setFormData({
                    safety_answers: {},
                    issues: []
                  })
                }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      showError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
      setSwitchingObject(false)
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
      showError('Выберите объект')
      return
    }

    // Проверяем, что все пункты заполнены
    const answeredItems = Object.keys(formData.safety_answers).length
    if (answeredItems < totalItems) {
      showError(`Заполните все пункты чек-листа. Осталось заполнить: ${totalItems - answeredItems} из ${totalItems}`)
      return
    }

    try {
    setSaving(true)
      
              const checklistData = {
                object_id: parseInt(selectedObject),
                data: {
                  date: new Date().toISOString().split('T')[0],
                  safety_answers: formData.safety_answers,
                  issues: formData.issues
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
      showSuccess(todayChecklist ? 'Чек-лист обновлен!' : 'Чек-лист создан!')
      
    } catch (error) {
      console.error('Ошибка сохранения чек-листа:', error)
      showError('Ошибка при сохранении чек-листа')
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
      <NotificationToast 
        notification={notification} 
        onClose={hide} 
      />
      {/* Выбор объекта */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
                <div style={{
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    lineHeight: '1.2'
                  }}>
                    Ежедневный чек-лист прораба
                  </h2>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: 'var(--muted)',
                    lineHeight: '1.3'
                  }}>
                    Выберите объект для заполнения чек-листа безопасности
                  </p>
                </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <label style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text)',
            minWidth: '120px'
          }}>
            Объект:
          </label>
                  <select
                    value={selectedObject}
                    onChange={(e) => setSelectedObject(e.target.value)}
                    disabled={switchingObject}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: switchingObject ? 'var(--bg-secondary)' : 'var(--bg)',
                      color: switchingObject ? 'var(--muted)' : 'var(--text)',
                      fontSize: '14px',
                      minWidth: '300px',
                      transition: 'all 0.3s ease',
                      cursor: switchingObject ? 'not-allowed' : 'pointer',
                      opacity: switchingObject ? 0.7 : 1
                    }}
                  >
            <option value="">Выберите объект</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
          </select>
        </div>

                {selectedObject && !switchingObject && (
                  <div style={{
                    padding: '16px',
                    background: todayChecklist ? '#f0fdf4' : '#fefce8',
                    border: `1px solid ${todayChecklist ? '#22c55e' : '#eab308'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: todayChecklist ? '#22c55e' : '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {todayChecklist ? '✓' : '!'}
            </div>
            <span style={{ 
              color: todayChecklist ? '#15803d' : '#a16207',
              fontWeight: '500'
            }}>
              {todayChecklist ? 'Чек-лист на сегодня уже создан. Вы можете его редактировать.' : 'Чек-лист на сегодня еще не создан. Заполните форму ниже.'}
            </span>
          </div>
        )}
      </div>

      {!selectedObject && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text)'
          }}>
            Ежедневный чек-лист прораба
          </h3>
          <p style={{
            margin: '0',
            fontSize: '16px',
            color: 'var(--muted)',
            lineHeight: '1.5',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            Выберите объект выше, чтобы начать заполнение чек-листа безопасности
          </p>
        </div>
      )}

      {selectedObject && (
        <>
          {switchingObject ? (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '60px 40px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border)',
                borderTop: '3px solid var(--brand)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px auto'
              }} />
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: 'var(--muted)',
                fontWeight: '500'
              }}>
                Загружаем чек-лист...
              </p>
            </div>
          ) : (
            <>
              {/* Чек-лист безопасности */}
              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                animation: 'fadeIn 0.3s ease-out'
              }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text)',
              lineHeight: '1.2'
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
                    {section.items.map(item => {
                      const answer = formData.safety_answers[item.id]
                      const getItemStyle = () => {
                        if (answer === 'yes') {
                          return {
                            outline: '2px solid #22c55e',
                            outlineOffset: '-2px',
                            boxShadow: '0 0 0 1px #22c55e20'
                          }
                        } else if (answer === 'no') {
                          return {
                            outline: '2px solid #ef4444',
                            outlineOffset: '-2px',
                            boxShadow: '0 0 0 1px #ef444420'
                          }
                        } else if (answer === 'not_required') {
                          return {
                            outline: '2px solid #6b7280',
                            outlineOffset: '-2px',
                            boxShadow: '0 0 0 1px #6b728020'
                          }
                        } else {
                          return {
                            border: '1px solid var(--border)'
                          }
                        }
                      }
                      
                      return (
                      <div key={item.id} style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '16px',
                        alignItems: 'flex-start',
                        padding: '16px',
                        background: 'var(--panel)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                        ...getItemStyle()
                      }}>
                        {/* Номер пункта */}
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: answer === 'yes' ? '#22c55e' : 
                                 answer === 'no' ? '#ef4444' : 
                                 answer === 'not_required' ? '#6b7280' : 
                                 'var(--brand)',
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
                              gap: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              whiteSpace: 'nowrap',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: formData.safety_answers[item.id] === option 
                                ? (option === 'yes' ? '#f0fdf4' : 
                                   option === 'no' ? '#fef2f2' : 
                                   '#f9fafb') 
                                : 'transparent',
                              border: `2px solid ${formData.safety_answers[item.id] === option 
                                ? (option === 'yes' ? '#22c55e' : 
                                   option === 'no' ? '#ef4444' : 
                                   '#6b7280') 
                                : 'var(--border)'}`,
                              transition: 'all 0.2s ease',
                              fontWeight: formData.safety_answers[item.id] === option ? '600' : '500'
                            }}>
                              <input
                                type="radio"
                                name={item.id}
                                value={option}
                                checked={formData.safety_answers[item.id] === option}
                                onChange={(e) => handleSafetyAnswerChange(item.id, e.target.value)}
                                style={{
                                  margin: 0,
                                  width: '16px',
                                  height: '16px',
                                  accentColor: option === 'yes' ? '#22c55e' : 
                                             option === 'no' ? '#ef4444' : 
                                             '#6b7280',
                                  borderRadius: '4px'
                                }}
                              />
                              <span style={{ 
                                color: formData.safety_answers[item.id] === option 
                                  ? (option === 'yes' ? '#15803d' : 
                                     option === 'no' ? '#dc2626' : 
                                     '#374151')
                                  : (option === 'yes' ? '#10b981' : 
                                     option === 'no' ? '#ef4444' : 
                                     'var(--muted)')
                              }}>
                                {option === 'yes' ? 'Да' : 
                                 option === 'no' ? 'Нет' : 
                                 'Не требуется'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      )
                    })}
              </div>
            </div>
          ))}
        </div>
          </div>


              {/* Кнопка сохранения */}
              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                    <button
                      onClick={handleSave}
                      disabled={saving || Object.keys(formData.safety_answers).length < totalItems}
                      style={{
                        padding: '16px 40px',
                        background: (saving || Object.keys(formData.safety_answers).length < totalItems) ? 'var(--muted)' : 'var(--brand)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: (saving || Object.keys(formData.safety_answers).length < totalItems) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: (saving || Object.keys(formData.safety_answers).length < totalItems) ? 'none' : '0 4px 12px rgba(255, 138, 0, 0.3)',
                        transform: (saving || Object.keys(formData.safety_answers).length < totalItems) ? 'none' : 'translateY(0)',
                        minWidth: '200px'
                      }}
                      onMouseEnter={(e) => {
                        if (!saving && Object.keys(formData.safety_answers).length >= totalItems) {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 6px 16px rgba(255, 138, 0, 0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving && Object.keys(formData.safety_answers).length >= totalItems) {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = '0 4px 12px rgba(255, 138, 0, 0.3)'
                        }
                      }}
                    >
                      {saving ? 'Сохранение...' : 
                       Object.keys(formData.safety_answers).length < totalItems ? 
                       `Заполните все пункты (${Object.keys(formData.safety_answers).length}/${totalItems})` :
                       (todayChecklist ? 'Обновить чек-лист' : 'Создать чек-лист')}
                    </button>
              </div>
            </>
          )}
        </>
      )}
        </div>
  )
}