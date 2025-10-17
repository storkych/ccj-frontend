import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

export default function SubAreaMap({
  mainPolygon = null, // Основной полигон объекта
  onPolygonCreated = () => {}, // (geojsonGeometry) => void
  height = 500,
  subAreaName = '',
  onNameChange = () => {},
  existingGeometry = null, // Существующая геометрия для отображения при изменении
  onClear = () => {} // Функция очистки карты
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [createdPolygon, setCreatedPolygon] = useState(null)
  
  // Debug: отслеживаем изменения createdPolygon
  useEffect(() => {
    console.log('createdPolygon изменился:', createdPolygon)
  }, [createdPolygon])
  
  // Отображаем созданный полигон на карте по координатам
  useEffect(() => {
    console.log('=== useEffect для createdPolygon сработал ===')
    console.log('createdPolygon:', createdPolygon)
    console.log('hasMapRef:', !!mapRef.current)
    console.log('hasDrawn:', !!mapRef.current?.drawn)
    
    if (createdPolygon) {
      // Ждем инициализации карты
      const checkMap = () => {
        if (mapRef.current?.drawn) {
          console.log('=== ОТОБРАЖЕНИЕ СОЗДАННОГО ПОЛИГОНА ===')
          
          // Логируем что было на карте до добавления
          console.log('Слои на карте ДО добавления createdPolygon:')
          mapRef.current.drawn.eachLayer((layer, index) => {
            console.log(`Слой ${index}:`, {
              type: layer.constructor.name,
              color: layer.options?.color,
              name: layer.feature?.properties?.name,
              geometry: layer.feature?.geometry?.type
            })
          })
      
      // Удаляем предыдущий созданный полигон, если есть
      if (mapRef.current.createdPolygonLayer) {
        mapRef.current.drawn.removeLayer(mapRef.current.createdPolygonLayer)
      }
      
      // Создаем новый полигон из координат точно как зеленый квадрат
      console.log('=== ПОЛНЫЕ ДАННЫЕ КРАСНОГО ПОЛИГОНА ===')
      console.log('createdPolygon:', createdPolygon)
      console.log('createdPolygon._latlngs:', createdPolygon._latlngs)
      
      // Извлекаем координаты из _latlngs
      const latlngs = createdPolygon._latlngs[0] // Берем первый (и единственный) полигон
      console.log('latlngs:', latlngs)
      
      // Преобразуем в формат GeoJSON coordinates [lng, lat]
      const coordinates = latlngs.map(latlng => [latlng.lng, latlng.lat])
      console.log('coordinates для GeoJSON:', coordinates)
      
      const geometry = {
        type: 'Polygon',
        coordinates: [coordinates] // Обертываем в массив для Polygon
      }
      console.log('geometry:', geometry)
      
      const featureData = {
        type: 'Feature',
        properties: { name: 'Созданный подполигон' },
        geometry: geometry
      }
      console.log('featureData для L.geoJSON:', featureData)
      
      const newLayer = L.geoJSON(featureData, {
        style: {
          color: '#ef4444',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ef4444',
          fillOpacity: 0.3
        }
      })
      console.log('Красный полигон создан:', newLayer)
      console.log('=== КОНЕЦ ДАННЫХ КРАСНОГО ПОЛИГОНА ===')
      
      // Добавляем новый полигон в drawn
      newLayer.addTo(mapRef.current.drawn)
      mapRef.current.createdPolygonLayer = newLayer // Сохраняем ссылку для удаления
      
      console.log('Красный полигон отображен через L.geoJSON')
      
      // Логируем что стало на карте после добавления
      console.log('Слои на карте ПОСЛЕ добавления createdPolygon:')
      mapRef.current.drawn.eachLayer((layer, index) => {
        console.log(`Слой ${index}:`, {
          type: layer.constructor.name,
          color: layer.options?.color,
          name: layer.feature?.properties?.name,
          geometry: layer.feature?.geometry?.type
        })
      })
      
      console.log('=== ОТОБРАЖЕНИЕ СОЗДАННОГО ПОЛИГОНА ЗАВЕРШЕНО ===')
        } else {
          // Если карта еще не готова, ждем 100мс и пробуем снова
          setTimeout(checkMap, 100)
        }
      }
      
      checkMap()
    }
  }, [createdPolygon])
  

  useEffect(() => {
    if (mapRef.current) return
    
    const map = L.map(containerRef.current, {
      attributionControl: false
    }).setView([55.751244, 37.618423], 12)
    mapRef.current = { map }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(map)

    const drawn = new L.FeatureGroup().addTo(map)
    mapRef.current.drawn = drawn

    // Отображаем основной полигон объекта
    console.log('mainPolygon структура:', mainPolygon)
    console.log('mainPolygon.geometry:', mainPolygon?.geometry)
    console.log('mainPolygon.geometry.coordinates:', mainPolygon?.geometry?.coordinates)
    
    if (mainPolygon && mainPolygon.geometry && mainPolygon.geometry.coordinates) {
      try {
        const mainLayer = L.geoJSON({ 
          type: 'Feature', 
          properties: { name: 'Основной полигон' }, 
          geometry: mainPolygon.geometry 
        }, {
          style: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillColor: '#3b82f6',
            fillOpacity: 0.2
          }
        })
        mainLayer.addTo(drawn)
        
        // Подгоняем карту под основной полигон
        const bounds = mainLayer.getBounds()
        map.fitBounds(bounds, { padding: [20, 20] })
        
        
      } catch (error) {
        console.error('Ошибка отображения основного полигона:', error)
      }
    }

    // Настройка инструментов рисования
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { 
          allowIntersection: false, 
          showArea: false,
          shapeOptions: {
            color: '#ef4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ef4444',
            fillOpacity: 0.3
          }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
      },
      edit: false
    })
    map.addControl(drawControl)
    
    // Сохраняем ссылку на контрол для управления видимостью
    mapRef.current.drawControl = drawControl
    
    // Отключаем автоматическое удаление нарисованных полигонов
    map.on(L.Draw.Event.DRAWSTART, function() {
      console.log('Начало рисования')
      
      // Удаляем предыдущий красный полигон, если он есть
      if (createdPolygon) {
        drawn.removeLayer(createdPolygon)
        setCreatedPolygon(null)
        console.log('Предыдущий полигон удален')
      }
    })
    
    map.on(L.Draw.Event.DRAWSTOP, function() {
      console.log('Окончание рисования')
    })

    function onCreated(e) {
      console.log('=== СОЗДАНИЕ ПОЛИГОНА: Начало ===')
      
      const layer = e.layer
      const geometry = layer.toGeoJSON().geometry
      
      console.log('Создан новый полигон:', {
        geometry: geometry,
        layerType: layer.constructor.name,
        layerOptions: layer.options
      })
      
      // Логируем что было на карте до добавления нового полигона
      console.log('Слои на карте ДО добавления нового полигона:')
      drawn.eachLayer((existingLayer, index) => {
        console.log(`Существующий слой ${index}:`, {
          type: existingLayer.constructor.name,
          color: existingLayer.options?.color,
          name: existingLayer.feature?.properties?.name,
          geometry: existingLayer.feature?.geometry?.type
        })
      })
      
      // Проверяем, что подполигон находится внутри основного полигона
      if (mainPolygon && mainPolygon.geometry && mainPolygon.geometry.coordinates) {
        try {
          const mainPolygonLayer = L.geoJSON(mainPolygon.geometry)
          const subPolygonLayer = L.geoJSON(geometry)
          
          // Простая проверка - центр подполигона должен быть внутри основного
          const subCenter = subPolygonLayer.getBounds().getCenter()
          const isInside = mainPolygonLayer.getBounds().contains(subCenter)
          
          if (!isInside) {
            alert('Подполигон должен находиться внутри основного полигона объекта!')
            drawn.removeLayer(layer)
            return
          }
        } catch (error) {
          console.error('Ошибка проверки границ подполигона:', error)
        }
      }
      
      // Сохраняем полигон в состоянии (он будет отображен в useEffect)
      setCreatedPolygon(layer)
      
      console.log('Полигон сохранен в состоянии, будет отображен по координатам')
      
      // Вызываем callback
      if (onPolygonCreated) {
        onPolygonCreated(geometry)
      }
      
      console.log('=== СОЗДАНИЕ ПОЛИГОНА: Завершено ===')
    }

    map.on(L.Draw.Event.CREATED, onCreated)

    // cleanup for listeners
    mapRef.current._onCreatedHandler = onCreated

    return () => {
      if (mapRef.current?._onCreatedHandler) {
        map.off(L.Draw.Event.CREATED, mapRef.current._onCreatedHandler)
      }
      if (map) {
        map.remove()
      }
      mapRef.current = null
    }
  }, []) // Убираем зависимости, чтобы карта создавалась только один раз

  // Отображаем существующий подполигон при изменении existingGeometry
  useEffect(() => {
    if (existingGeometry && mapRef.current?.drawn) {
      console.log('Отображаем существующий подполигон при изменении:', existingGeometry)
      
      // Удаляем предыдущий существующий подполигон
      const existingLayers = mapRef.current.drawn.getLayers()
      existingLayers.forEach(layer => {
        if (layer.options.color === '#ef4444') {
          mapRef.current.drawn.removeLayer(layer)
        }
      })
      
      // Добавляем новый существующий подполигон
      const existingLayer = L.geoJSON({
        type: 'Feature',
        properties: { name: 'Существующий подполигон' },
        geometry: existingGeometry
      }, {
        style: {
          color: '#ef4444',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ef4444',
          fillOpacity: 0.3
        }
      })
      existingLayer.addTo(mapRef.current.drawn)
      console.log('Существующий подполигон обновлен')
    }
  }, [existingGeometry])

  // Управление видимостью кнопки рисования
  useEffect(() => {
    if (mapRef.current?.drawControl) {
      const drawControl = mapRef.current.drawControl
      if (createdPolygon || existingGeometry) {
        // Скрываем кнопку рисования, если уже есть полигон (нарисованный или существующий)
        drawControl.getContainer().style.display = 'none'
      } else {
        // Показываем кнопку рисования, если нет полигона
        drawControl.getContainer().style.display = 'block'
      }
    }
  }, [createdPolygon, existingGeometry])

  // Функция очистки карты
  const clearMap = () => {
    if (mapRef.current?.drawn) {
      // Удаляем все слои
      mapRef.current.drawn.clearLayers()
      
      // Заново добавляем основной полигон
      if (mainPolygon && mainPolygon.geometry && mainPolygon.geometry.coordinates) {
        try {
          const mainLayer = L.geoJSON({ 
            type: 'Feature', 
            properties: { name: 'Основной полигон' }, 
            geometry: mainPolygon.geometry 
          }, {
            style: {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.2
            }
          })
          mainLayer.addTo(mapRef.current.drawn)
          
          // Подгоняем карту под основной полигон
          const bounds = mainLayer.getBounds()
          mapRef.current.map.fitBounds(bounds, { padding: [20, 20] })
        } catch (error) {
          console.error('Ошибка отображения основного полигона при очистке:', error)
        }
      }
      
      setCreatedPolygon(null)
      console.log('Карта очищена и основной полигон добавлен заново')
    }
  }

  // Очистка карты при вызове onClear
  useEffect(() => {
    if (onClear && mapRef.current?.drawn) {
      clearMap()
    }
  }, [onClear])

  // Сброс карты при пересоздании (когда existingGeometry становится null)
  useEffect(() => {
    if (existingGeometry === null && mapRef.current?.drawn) {
      console.log('=== ПЕРЕСОЗДАНИЕ: Начинаем очистку карты ===')
      
      // Логируем что было на карте до очистки
      console.log('Слои на карте ДО очистки:')
      mapRef.current.drawn.eachLayer((layer, index) => {
        console.log(`Слой ${index}:`, {
          type: layer.constructor.name,
          color: layer.options?.color,
          name: layer.feature?.properties?.name,
          geometry: layer.feature?.geometry?.type
        })
      })
      
      // Более агрессивная очистка - удаляем все слои
      mapRef.current.drawn.clearLayers()
      setCreatedPolygon(null)
      
      console.log('Все слои удалены, создаем основной полигон заново')
      
      // Заново добавляем основной полигон
      if (mainPolygon && mainPolygon.geometry && mainPolygon.geometry.coordinates) {
        try {
          const mainLayer = L.geoJSON({ 
            type: 'Feature', 
            properties: { name: 'Основной полигон' }, 
            geometry: mainPolygon.geometry 
          }, {
            style: {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.2
            }
          })
          mainLayer.addTo(mapRef.current.drawn)
          
          // Подгоняем карту под основной полигон
          const bounds = mainLayer.getBounds()
          mapRef.current.map.fitBounds(bounds, { padding: [20, 20] })
          
          console.log('Основной полигон добавлен заново')
        } catch (error) {
          console.error('Ошибка отображения основного полигона при пересоздании:', error)
        }
      }
      
      // Логируем что стало на карте после очистки
      console.log('Слои на карте ПОСЛЕ очистки:')
      mapRef.current.drawn.eachLayer((layer, index) => {
        console.log(`Слой ${index}:`, {
          type: layer.constructor.name,
          color: layer.options?.color,
          name: layer.feature?.properties?.name,
          geometry: layer.feature?.geometry?.type
        })
      })
      
      console.log('=== ПЕРЕСОЗДАНИЕ: Очистка завершена ===')
    }
  }, [existingGeometry])

  return (
    <div style={{ 
      width: '100%', 
      height: '700px',
      borderRadius: '8px',
      border: '1px solid var(--border)'
    }}>
      <div style={{
        background: 'var(--bg-light)',
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border)'
      }}>
        <h4 style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--text)'
        }}>
          Инструкция
        </h4>
        <div style={{
          fontSize: '14px',
          color: 'var(--muted)',
          lineHeight: '1.5'
        }}>
          <div style={{ marginBottom: '4px' }}>• <strong>Синий полигон</strong> - основной полигон объекта</div>
          <div style={{ marginBottom: '4px' }}>• <strong>Красный полигон</strong> - создаваемый подполигон</div>
          <div style={{ marginBottom: '4px' }}>• Используйте инструменты рисования для создания подполигона</div>
          <div>• Подполигон должен находиться внутри основного полигона</div>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: height - 80,
          overflow: 'hidden'
        }} 
      />
    </div>
  )
}
