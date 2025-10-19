// Копируем нужные функции из api.js
const BASE = import.meta.env.VITE_API_URL || 'https://building-api.itc-hub.ru';
const CV_BASE = 'https://building-cv.itc-hub.ru';

function getTokens(){
  try { return JSON.parse(localStorage.getItem('ccj_tokens')||'{}') } catch(e){ return {} }
}

async function http(path, { method='GET', headers={}, body, retry=true } = {}){
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const tokens = getTokens()
  const h = { 'Content-Type':'application/json', ...headers }
  if (tokens.access) h['Authorization'] = `Bearer ${tokens.access}`
  const ts = new Date().toISOString()
  try{ console.log(`[api →]`, ts, method, url, body ? JSON.parse(body) : undefined) }catch{ console.log(`[api →]`, ts, method, url) }
  const res = await fetch(url, { method, headers:h, body })
  if (res.status === 401 && retry && tokens.refresh){
    const rr = await fetch(`${BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh: tokens.refresh }) })
    if (rr.ok) {
      const newTokens = await rr.json()
      localStorage.setItem('ccj_tokens', JSON.stringify(newTokens))
      return http(path, { method, headers, body, retry: false })
    } else {
      localStorage.removeItem('ccj_tokens')
      window.location.href = '/login'
      return
    }
  }
  if (!res.ok) {
    const errorText = await res.text()
    console.error(`[api ←]`, ts, method, url, res.status, errorText)
    throw new Error(`API error: ${res.status} - ${errorText}`)
  }
  const data = await res.json()
  console.log(`[api ←]`, ts, method, url, res.status, data)
  return data
}

// Deliveries API
export async function getDeliveries(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.today) queryParams.append('today', 'true')
  if (params.object_id) queryParams.append('object_id', params.object_id)
  if (params.status) queryParams.append('status', params.status)
  
  const url = `/deliveries/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return await http(url)
}

export async function getDelivery(id) {
  return await http(`/deliveries/${id}`)
}

export async function updateDelivery(id, data) {
  return await http(`/deliveries/${id}`, { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  })
}

export async function attachDeliveryPhotos(id, photos) {
  return await http(`/deliveries/${id}/photos`, { 
    method: 'POST', 
    body: JSON.stringify({ photos }) 
  })
}

// API методы для ССК - используем правильную ручку /deliveries/{id}/status
export async function setDeliveryStatus({ id, status, comment }) {
  return await http(`/deliveries/${id}/status`, { 
    method: 'POST', 
    body: JSON.stringify({ status, comment }) 
  })
}

export async function acceptDelivery({ id, comment = '' }) {
  return await setDeliveryStatus({ id, status: 'accepted', comment })
}

export async function rejectDelivery({ id, comment = '' }) {
  return await setDeliveryStatus({ id, status: 'rejected', comment })
}

export async function sendDeliveryToLab({ id, comment = '' }) {
  return await setDeliveryStatus({ id, status: 'sent_to_lab', comment })
}

// Принятие доставки прорабом (устанавливает статус в "delivered")
export async function receiveDelivery(id, objectId) {
  return await http(`/deliveries/${id}/receive`, { 
    method: 'POST',
    body: JSON.stringify({ object_id: objectId })
  })
}

// Computer Vision API functions
export async function extractTextFromImage(imageBase64, objectId = null, deliveryId = null) {
  const url = `${CV_BASE}/api/extract`
  const tokens = getTokens()
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokens.access}`
  }
  
  const body = JSON.stringify({
    images_base64: [imageBase64],
    object_id: objectId ? String(objectId) : null,
    delivery_id: deliveryId ? String(deliveryId) : null,
    date: new Date().toISOString().split('T')[0]
  })

  const ts = new Date().toISOString()
  console.log(`[cv-api →]`, ts, 'POST', url, 'Image processing...', {
    object_id: objectId ? String(objectId) : null,
    delivery_id: deliveryId ? String(deliveryId) : null,
    date: new Date().toISOString().split('T')[0],
    image_size: imageBase64.length
  })
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[cv-api ←]`, ts, 'POST', url, response.status, errorText)
      throw new Error(`CV API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`[cv-api ←]`, ts, 'POST', url, response.status, data)
    return data
  } catch (error) {
    console.error(`[cv-api ←]`, ts, 'POST', url, 'Error:', error.message)
    throw error
  }
}

// Новая функция для обработки нескольких фотографий
export async function extractTextFromMultipleImages(photos, objectId, deliveryId) {
  const url = `${CV_BASE}/api/extract`
  const tokens = getTokens()
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokens.access}`
  }
  
  // Конвертируем все фотографии в base64
  const materials = await Promise.all(
    photos.map(async (photo, index) => {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          // Убираем префикс data:image/...;base64, оставляем только base64 строку
          const base64String = e.target.result.split(',')[1]
          resolve(base64String)
        }
        reader.readAsDataURL(photo.file)
      })
      return {
        number: index + 1,
        photo: base64
      }
    })
  )
  
  const body = JSON.stringify({
    images_base64: materials.map(m => m.photo),
    object_id: String(objectId),
    delivery_id: String(deliveryId),
    date: new Date().toISOString().split('T')[0]
  })

  const ts = new Date().toISOString()
  console.log(`[cv-api →]`, ts, 'POST', url, 'Multiple images processing...', {
    object_id: String(objectId),
    delivery_id: String(deliveryId),
    date: new Date().toISOString().split('T')[0],
    images_count: materials.length
  })
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[cv-api ←]`, ts, 'POST', url, response.status, errorText)
      throw new Error(`CV API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`[cv-api ←]`, ts, 'POST', url, response.status, data)
    return data
  } catch (error) {
    console.error(`[cv-api ←]`, ts, 'POST', url, 'Error:', error.message)
    throw error
  }
}

export async function confirmDeliveryMaterials(id, materialsData) {
  return await http(`/deliveries/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(materialsData) 
  })
}
