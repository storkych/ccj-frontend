
const BASE = import.meta.env.VITE_API_URL || 'https://building-api.itc-hub.ru/api/v1';
const AI_BASE = 'https://building-ai.itc-hub.ru';
const S3_BASE = 'https://building-s3-api.itc-hub.ru';

function getTokens(){
  try { return JSON.parse(localStorage.getItem('ccj_tokens')||'{}') } catch(e){ return {} }
}
function setTokens(t){ localStorage.setItem('ccj_tokens', JSON.stringify(t||{})) }

// Функция для обработки истечения токена
function handleTokenExpired() {
  console.log('[api] Токен истёк, выполняем logout...')
  setTokens({})
  localStorage.removeItem('ccj_user')
  localStorage.removeItem('ccj_tokens')
  console.log('[api] Перенаправляем на страницу входа...')
  window.location.href = '/login'
  throw new Error('Токен истёк. Необходимо войти в систему заново.')
}

// Функция для проверки 403 ошибки с истёкшим токеном
function checkTokenExpiredError(res, txt) {
  if (res.status === 403) {
    console.log('[api] Получена 403 ошибка, проверяем на истечение токена...')
    try {
      const errorData = JSON.parse(txt)
      if (errorData.detail && errorData.detail.includes('Token expired')) {
        console.log('[api] Обнаружено истечение токена в JSON ответе')
        handleTokenExpired()
      }
    } catch (parseError) {
      if (txt.includes('Token expired')) {
        console.log('[api] Обнаружено истечение токена в тексте ответа')
        handleTokenExpired()
      }
    }
  }
}

export async function http(path, { method='GET', headers={}, body, retry=true } = {}){
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const tokens = getTokens()
  const h = { 'Content-Type':'application/json', ...headers }
  if (tokens.access) h['Authorization'] = `Bearer ${tokens.access}`
  const ts = new Date().toISOString()
  try{ console.log(`[api →]`, ts, method, url, body ? JSON.parse(body) : undefined) }catch{ console.log(`[api →]`, ts, method, url) }
  const res = await fetch(url, { method, headers:h, body })
  if (res.status === 401 && retry && tokens.refresh){
    const rr = await fetch(`${BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh: tokens.refresh }) })
    if (rr.ok){
      const data = await rr.json()
      setTokens({ access: data.access, refresh: data.refresh || tokens.refresh })
      console.log('[api ◇] token refreshed')
      return http(path, { method, headers, body, retry:false })
    }
  }
  if (!res.ok){
    const txt = await res.text().catch(()=>`HTTP ${res.status}`)
    console.warn(`[api ←]`, method, url, res.status, txt)
    
    // Обработка 403 ошибки с истёкшим токеном
    checkTokenExpiredError(res, txt)
    
    // Пытаемся распарсить JSON ошибку для получения детального сообщения
    try {
      const errorData = JSON.parse(txt)
      if (errorData.detail) {
        throw new Error(errorData.detail)
      }
    } catch (parseError) {
      // Если не удалось распарсить как JSON, используем текст как есть
    }
    
    throw new Error(txt || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type')||''
  const out = ct.includes('application/json') ? await res.json() : await res.text()
  try{ console.log(`[api ←]`, method, url, res.status, out) }catch{ console.log(`[api ←]`, method, url, res.status) }
  return out
}

export async function apiLogin({ email, password }){
  try {
    const data = await http('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) })
    if (data.access) setTokens({ access: data.access, refresh: data.refresh })
    return data
  } catch (error) {
    // Обработка специфических ошибок авторизации
    if (error.message.includes('Invalid credentials') || 
        error.message.includes('401') || 
        error.message.includes('Unauthorized')) {
      throw new Error('Неверный email или пароль')
    } else if (error.message.includes('422')) {
      throw new Error('Некорректные данные. Проверьте формат email')
    } else if (error.message.includes('429')) {
      throw new Error('Слишком много попыток входа. Попробуйте позже')
    } else if (error.message.includes('500')) {
      throw new Error('Ошибка сервера. Попробуйте позже')
    } else if (error.message.includes('Network') || error.message.includes('fetch')) {
      throw new Error('Ошибка сети. Проверьте подключение к интернету')
    }
    throw error
  }
}
export async function apiLogout(){
  const tokens = getTokens()
  try{ await http('/auth/logout', { method:'POST', body: JSON.stringify({ refresh: tokens.refresh||'' }) }) }catch(e){}
  setTokens({})
}
export async function apiMe(){
  return await http('/users/me')
}

export async function getObjects({ mine, status } = {}){
  const qs = new URLSearchParams()
  if (mine != null) qs.set('mine', String(mine))
  if (status) qs.set('status', status)
  return await http(`/objects?${qs.toString()}`)
}
export async function getObject(id){ return await http(`/objects/${id}`) }
export async function patchObject(id, patch){ return await http(`/objects/${id}`, { method:'PATCH', body: JSON.stringify(patch) }) }
export async function requestActivation(id){ return await http(`/objects/${id}/activation/request`, { method:'POST' }) }
export async function completeObjectBySSK(id){ return await http(`/objects/${id}/complete-by-ssk`, { method:'POST' }) }
export async function completeObjectByIKO(id){ return await http(`/objects/${id}/complete`, { method:'POST' }) }
export async function ikoActivationCheck(id, checklistData){ return await http(`/objects/${id}/activation/iko-check`, { method:'POST', body: JSON.stringify(checklistData) }) }
export async function suspendObject(id, payload){ return await http(`/objects/${id}/suspend`, { method:'POST', body: JSON.stringify(payload||{}) }) }
export async function resumeObject(id){ return await http(`/objects/${id}/resume`, { method:'POST' }) }
export async function completeObject(id){ return await http(`/objects/${id}/complete`, { method:'POST' }) }
export async function getObjectHistory(id, { limit=50, offset=0 } = {}){
  const qs = new URLSearchParams({ limit:String(limit), offset:String(offset) })
  return await http(`/objects/${id}/history?${qs.toString()}`)
}

export async function getForemen(){ return await http('/foremen') }
export async function searchUsers({ role, query } = {}){
  const qs = new URLSearchParams()
  if (role) qs.set('role', role)
  if (query) qs.set('query', query)
  return await http(`/users?${qs.toString()}`)
}

const NOTIFICATIONS_BASE = 'https://building-notifications.itc-hub.ru'

async function notificationsHttp(path, { method='GET', headers={}, body, retry=true } = {}){
  const url = path.startsWith('http') ? path : `${NOTIFICATIONS_BASE}${path}`
  const tokens = getTokens()
  const h = { 'Content-Type':'application/json', ...headers }
  if (tokens.access) h['Authorization'] = `Bearer ${tokens.access}`
  const ts = new Date().toISOString()
  try{ console.log(`[notifications →]`, ts, method, url, body ? JSON.parse(body) : undefined) }catch{ console.log(`[notifications →]`, ts, method, url) }
  const res = await fetch(url, { method, headers:h, body })
  if (res.status === 401 && retry && tokens.refresh){
    const rr = await fetch(`${BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh: tokens.refresh }) })
    if (rr.ok){
      const data = await rr.json()
      setTokens({ access: data.access, refresh: data.refresh || tokens.refresh })
      console.log('[notifications ◇] token refreshed')
      return notificationsHttp(path, { method, headers, body, retry:false })
    }
  }
  if (!res.ok){
    const txt = await res.text().catch(()=>`HTTP ${res.status}`)
    console.warn(`[notifications ←]`, method, url, res.status, txt)
    
    // Обработка 403 ошибки с истёкшим токеном
    checkTokenExpiredError(res, txt)
    
    throw new Error(txt || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type')||''
  const out = ct.includes('application/json') ? await res.json() : await res.text()
  try{ console.log(`[notifications ←]`, method, url, res.status, out) }catch{ console.log(`[notifications ←]`, method, url, res.status) }
  return out
}

export async function getNotifications(userId){ return await notificationsHttp(`/notifications/${userId}`) }
export async function markNotificationRead(id){ return await notificationsHttp(`/notifications/${id}/read`, { method:'PATCH' }) }

const VISITS_BASE = 'https://building-qr.itc-hub.ru'

async function visitsHttp(path, { method='GET', headers={}, body, retry=true } = {}){
  const url = path.startsWith('http') ? path : `${VISITS_BASE}${path}`
  const tokens = getTokens()
  const h = { 'Content-Type':'application/json', ...headers }
  if (tokens.access) h['Authorization'] = `Bearer ${tokens.access}`
  const ts = new Date().toISOString()
  try{ console.log(`[visits →]`, ts, method, url, body ? JSON.parse(body) : undefined) }catch{ console.log(`[visits →]`, ts, method, url) }
  const res = await fetch(url, { method, headers:h, body })
  if (res.status === 401 && retry && tokens.refresh){
    const rr = await fetch(`${BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh: tokens.refresh }) })
    if (rr.ok){
      const data = await rr.json()
      setTokens({ access: data.access, refresh: data.refresh || tokens.refresh })
      console.log('[visits ◇] token refreshed')
      return visitsHttp(path, { method, headers, body, retry:false })
    }
  }
  if (!res.ok){
    const txt = await res.text().catch(()=>`HTTP ${res.status}`)
    console.warn(`[visits ←]`, method, url, res.status, txt)
    
    // Обработка 403 ошибки с истёкшим токеном
    checkTokenExpiredError(res, txt)
    
    throw new Error(txt || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type')||''
  const out = ct.includes('application/json') ? await res.json() : await res.text()
  try{ console.log(`[visits ←]`, method, url, res.status, out) }catch{ console.log(`[visits ←]`, method, url, res.status) }
  return out
}

export async function createVisit(data){ return await visitsHttp('/api/v1/sessions/create', { method:'POST', body: JSON.stringify(data) }) }
export async function getVisits(params = {}){ 
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(params)) if (v!=null && v!=='') qs.set(k, v)
  return await visitsHttp(`/api/v1/sessions/list?${qs.toString()}`) 
}
export async function getPlannedVisits(objectId){ return await visitsHttp(`/api/v1/sessions/planned/${objectId}`) }

export async function getMemos(){ return await http('/memos') }

export async function getFileTree({ object_id } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  return await http(`/documents?${qs.toString()}`)
}
const TICKETS_BASE = 'https://building-admin.itc-hub.ru'

async function ticketsHttp(path, { method='GET', headers={}, body, retry=true } = {}){
  const url = path.startsWith('http') ? path : `${TICKETS_BASE}${path}`
  const tokens = getTokens()
  const h = { 'Content-Type':'application/json', ...headers }
  if (tokens.access) h['Authorization'] = `Bearer ${tokens.access}`
  const ts = new Date().toISOString()
  try{ console.log(`[tickets →]`, ts, method, url, body ? JSON.parse(body) : undefined) }catch{ console.log(`[tickets →]`, ts, method, url) }
  const res = await fetch(url, { method, headers:h, body })
  if (res.status === 401 && retry && tokens.refresh){
    const rr = await fetch(`${BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh: tokens.refresh }) })
    if (rr.ok){
      const data = await rr.json()
      setTokens({ access: data.access, refresh: data.refresh || tokens.refresh })
      console.log('[tickets ◇] token refreshed')
      return ticketsHttp(path, { method, headers, body, retry:false })
    }
  }
  if (!res.ok){
    const txt = await res.text().catch(()=>`HTTP ${res.status}`)
    console.warn(`[tickets ←]`, method, url, res.status, txt)
    
    // Обработка 403 ошибки с истёкшим токеном
    checkTokenExpiredError(res, txt)
    
    throw new Error(txt || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type')||''
  const out = ct.includes('application/json') ? await res.json() : await res.text()
  try{ console.log(`[tickets ←]`, method, url, res.status, out) }catch{ console.log(`[tickets ←]`, method, url, res.status) }
  return out
}

export async function createTicket(data){ 
  return await ticketsHttp('/api/tickets/create', { method:'POST', body: JSON.stringify(data) })
}

export async function getSchedules({ object_id } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  return await http(`/work-plans/list?${qs.toString()}`)
}

export async function getWorkPlans({ object_id } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  return await http(`/work-plans/list?${qs.toString()}`)
}


export async function createWorkPlan({ object_id, items, title }){
  const payload = { object_id, items }
  if (title) payload.title = title
  return await http('/work-plans', { method:'POST', body: JSON.stringify(payload) })
}
export async function addWorkPlanVersion({ id, doc_url }){
  return await http(`/work-plans/${id}/versions`, { method:'POST', body: JSON.stringify({ doc_url }) })
}
export async function getWorkPlan(id){
  return await http(`/work-plans/${id}`)
}

export async function updateWorkItemStatus(id, status){
  return await http(`/work-items/${id}/status`, { method:'POST', body: JSON.stringify({ status }) })
}
export async function requestWorkPlanChange({ id, proposed_doc_url, comment }){
  return await http(`/work-plans/${id}/request-change`, { method:'POST', body: JSON.stringify({ proposed_doc_url, comment }) })
}
export async function approveWorkPlanChange({ id, decision, comment }){
  return await http(`/work-plans/${id}/approve-change`, { method:'POST', body: JSON.stringify({ decision, comment }) })
}

export async function getVisitRequests(params = {}){
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(params)) if (v!=null && v!=='') qs.set(k, v)
  return await http(`/visit-requests?${qs.toString()}`)
}
export async function createVisitRequest({ object, planned_at }){
  return await http('/visit-requests', { method:'POST', body: JSON.stringify({ object, planned_at }) })
}
export async function createQrCode(payload){ return await http('/qr-codes', { method:'POST', body: JSON.stringify(payload) }) }
export async function getQrCode(id){ return await http(`/qr-codes/${id}`) }
export async function scanQrCode(id, payload){ return await http(`/qr-codes/${id}/scan`, { method:'POST', body: JSON.stringify(payload) }) }
export async function closeQrUpload(id, payload){ return await http(`/qr-codes/${id}/upload-complete`, { method:'POST', body: JSON.stringify(payload) }) }

export async function getDeliveries({ object_id, limit, offset } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  if (limit != null) qs.set('limit', String(limit))
  if (offset != null) qs.set('offset', String(offset))
  return await http(`/deliveries/list?${qs.toString()}`)
}
export async function markDeliveryReceived({ id, object_id, notes }){
  return await http(`/deliveries/${id}`, { method:'POST', body: JSON.stringify({ object_id, notes }) })
}
export async function setDeliveryStatus({ id, status, comment }){
  return await http(`/deliveries/${id}/status`, { method:'POST', body: JSON.stringify({ status, comment }) })
}
export async function uploadInvoice({ delivery_id, object_id, pdf_url, data }){
  return await http('/invoices', { method:'POST', body: JSON.stringify({ delivery_id, object_id, pdf_url, data }) })
}
export async function parseTTN({ invoice_id, image_urls }){
  return await http(`/invoices/${invoice_id}/parse-ttn`, { method:'POST', body: JSON.stringify({ image_urls }) })
}
export async function createLabOrder({ delivery_id, items, lab_id }){
  return await http('/labs/orders', { method:'POST', body: JSON.stringify({ delivery_id, items, lab_id }) })
}
export async function attachLabResults({ order_id, pdf_url, key_metrics }){
  return await http('/labs/results', { method:'POST', body: JSON.stringify({ order_id, pdf_url, key_metrics }) })
}

export async function getViolations(params = {}){
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(params)) if (v!=null && v!=='') qs.set(k, v)
  return await http(`/violations?${qs.toString()}`)
}
export async function getViolation(id){
  return await http(`/prescriptions/${id}`)
}
export async function createViolation(payload){ 
  return await http('/prescriptions', { method:'POST', body: JSON.stringify(payload) }) 
}

export async function createViolationWithPhotos(payload) {
  return await http('/prescriptions', { method:'POST', body: JSON.stringify(payload) })
}
export async function submitViolationReport({ id, text, photos_folder_url, attachments, fix_photos }){
  const body = { 
    comment: text, 
    attachments: attachments || (photos_folder_url ? [photos_folder_url] : []),
    fix_photos: fix_photos || []
  }
  return await http(`/prescriptions/${id}/fix`, { method:'POST', body: JSON.stringify(body) })
}
export async function reviewViolation({ id, decision, comment }){
  const accepted = decision === 'approve' || decision === true
  return await http(`/prescriptions/${id}/verify`, { method:'POST', body: JSON.stringify({ accepted, comment }) })
}
export async function confirmViolation({ id }){ return reviewViolation({ id, decision:'approve' }) }
export async function declineViolation({ id }){ return reviewViolation({ id, decision:'reject' }) }

export async function createDailyChecklist(payload){ return await http('/daily-checklists', { method:'POST', body: JSON.stringify(payload) }) }
export async function getDailyChecklists(params={}){
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(params)) if (v!=null && v!=='') qs.set(k, v)
  return await http(`/daily-checklists?${qs.toString()}`)
}
export async function reviewDailyChecklist({ id, decision, comment, photos }){
  return await http(`/daily-checklists/${id}/review`, { method:'POST', body: JSON.stringify({ decision, comment, photos }) })
}
export async function markDailyChecklistReviewed({ id }){ return reviewDailyChecklist({ id, decision:'approve' }) }

// API методы для ССК
export async function getSSKDailyChecklists({ object_id, status, page = 1, limit = 10 } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  if (status) qs.set('status', status)
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  return await http(`/daily-checklists?${qs.toString()}`)
}

export async function reviewSSKDailyChecklist({ id, decision, comment }){
  return await http(`/daily-checklists/${id}/review`, { 
    method:'POST', 
    body: JSON.stringify({ decision, comment }) 
  })
}

// API методы для прорабов (ежедневные чеклисты)
export async function getChecklists({ object_id } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  return await http(`/daily-checklists?${qs.toString()}`)
}

export async function getTodayChecklist(object_id){
  const today = new Date().toISOString().split('T')[0]
  const qs = new URLSearchParams()
  qs.set('object_id', object_id)
  qs.set('date', today)
  const data = await http(`/daily-checklists?${qs.toString()}`)
  return data.items && data.items.length > 0 ? data.items[0] : null
}

export async function createChecklist(payload){
  return await http('/daily-checklists', { method:'POST', body: JSON.stringify(payload) })
}

export async function updateChecklist(id, payload){
  return await http(`/daily-checklists/${id}`, { method:'PATCH', body: JSON.stringify(payload) })
}

export async function getAIObjectReports({ object_id }){
  return await http('/ai/structured', { method:'POST', body: JSON.stringify({ prompt:`Сводка по объекту ${object_id}`, schema_json:{ type:'object', properties:{ summary:{ type:'string' } }, required:['summary'] } }) })
}
export async function aiChat({ object_id, message }){
  const r = await http('/ai/free', { method:'POST', body: JSON.stringify({ prompt:`[object=${object_id||''}] ${message}` }) })
  return { reply: r.text || '' }
}

export function getEnv(){ 
  return { api_url: BASE, build_mode: import.meta.env.MODE }
}

export async function createArea({ name, geometry, object }){
  return await http('/areas', { method:'POST', body: JSON.stringify({ name, geometry, object }) })
}
export async function getArea(id){
  return await http(`/areas/${id}`)
}


export async function acceptDelivery({ id, comment }){
  return await setDeliveryStatus({ id, status: 'accepted', comment })
}
export async function sendDeliveryToLab({ id, comment }){
  return await setDeliveryStatus({ id, status: 'sent_to_lab', comment })
}


export async function uploadDeliveryPhoto({ delivery_id, file }){
  return { id: `p_${Date.now()}`, name: (file && file.name) || 'photo.jpg', delivery_id }
}

export async function generateAIResponse(prompt){
  const url = `${AI_BASE}/generate`
  const ts = new Date().toISOString()
  try{ console.log(`[ai →]`, ts, 'POST', url, { prompt }) }catch{ console.log(`[ai →]`, ts, 'POST', url) }
  const res = await fetch(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ prompt }) 
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  const data = await res.json()
  console.log(`[ai ←]`, ts, 'POST', url, res.status, data)
  return data
}

export async function askObjectQuestion(objectId, question){
  const url = `${AI_BASE}/object_question`
  const ts = new Date().toISOString()
  try{ console.log(`[ai →]`, ts, 'POST', url, { object_id: objectId, question }) }catch{ console.log(`[ai →]`, ts, 'POST', url) }
  const res = await fetch(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ object_id: objectId, question }) 
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  const data = await res.json()
  console.log(`[ai ←]`, ts, 'POST', url, res.status, data)
  return data
}

export async function browseViolationFiles(tag, entityId, path = '') {
  const url = `${S3_BASE}/browse/violation/${tag}/${entityId}${path ? `?path=${encodeURIComponent(path)}` : ''}`
  const ts = new Date().toISOString()
  const tokens = getTokens()
  const headers = { 'Content-Type': 'application/json' }
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`
  
  try{ console.log(`[s3 →]`, ts, 'GET', url) }catch{ console.log(`[s3 →]`, ts, 'GET', url) }
  const res = await fetch(url, { 
    method: 'GET', 
    headers
  })
  if (!res.ok) {
    const errorText = await res.text()
    console.error(`[s3 ←]`, ts, 'GET', url, res.status, errorText)
    throw new Error(`S3 API error: ${res.status} - ${errorText}`)
  }
  const data = await res.json()
  console.log(`[s3 ←]`, ts, 'GET', url, res.status, data)
  return data
}

export async function browseForemanFiles(foremanId, path = '') {
  const url = `${S3_BASE}/browse/foreman/${foremanId}${path ? `?path=${encodeURIComponent(path)}` : ''}`
  const ts = new Date().toISOString()
  const tokens = getTokens()
  const headers = { 'Content-Type': 'application/json' }
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`
  
  try{ console.log(`[s3 →]`, ts, 'GET', url) }catch{ console.log(`[s3 →]`, ts, 'GET', url) }
  const res = await fetch(url, { 
    method: 'GET', 
    headers
  })
  if (!res.ok) {
    const errorText = await res.text()
    console.error(`[s3 ←]`, ts, 'GET', url, res.status, errorText)
    throw new Error(`S3 API error: ${res.status} - ${errorText}`)
  }
  const data = await res.json()
  console.log(`[s3 ←]`, ts, 'GET', url, res.status, data)
  return data
}
