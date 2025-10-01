import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

// A reusable map component to draw and view polygons
export default function AreaMap({
  center = [55.751244, 37.618423],
  zoom = 12,
  polygons = [], // [{ geometry, name }]
  onPolygonCreated, // (geojsonGeometry) => void
  readOnly = false,
  height = 400,
}){
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(()=>{
    if (mapRef.current) return
    const map = L.map(containerRef.current, {
      attributionControl: false
    }).setView(center, zoom)
    mapRef.current = { map }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(map)

    const drawn = new L.FeatureGroup().addTo(map)
    mapRef.current.drawn = drawn

    // existing polygons
    try{
      polygons.forEach(p => {
        if (!p?.geometry) return
        const layer = L.geoJSON({ type:'Feature', properties:{}, geometry: p.geometry })
        layer.addTo(drawn)
      })
      if (drawn.getLayers().length > 0) {
        map.fitBounds(drawn.getBounds(), { padding:[20,20] })
      }
    }catch{}

    if (!readOnly) {
      const drawControl = new L.Control.Draw({
        draw: {
          polygon: { allowIntersection: false, showArea: false },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false
        },
        edit: false
      })
      map.addControl(drawControl)

      function onCreated(e){
        const layer = e.layer
        drawn.addLayer(layer)
        const gj = layer.toGeoJSON()
        onPolygonCreated && onPolygonCreated(gj.geometry)
      }

      map.on(L.Draw.Event.CREATED, onCreated)

      // cleanup for listeners if draw enabled
      mapRef.current._onCreatedHandler = onCreated
    }

    return () => {
      if (mapRef.current?._onCreatedHandler) {
        map.off(L.Draw.Event.CREATED, mapRef.current._onCreatedHandler)
      }
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update existing polygons on prop change
  useEffect(()=>{
    const inst = mapRef.current
    if (!inst) return
    const { map, drawn } = inst
    drawn.clearLayers()
    try{
      polygons.forEach(p => {
        if (!p?.geometry) return
        const layer = L.geoJSON({ type:'Feature', properties:{}, geometry: p.geometry })
        layer.addTo(drawn)
      })
      if (drawn.getLayers().length > 0) {
        map.fitBounds(drawn.getBounds(), { padding:[20,20] })
      }
    }catch{}
  }, [polygons])

  return (
    <div ref={containerRef} style={{ width:'100%', height: typeof height==='number'? `${height}px` : height, border:'1px solid var(--border)', borderRadius:8, position:'relative', zIndex: 1 }} />
  )
}


