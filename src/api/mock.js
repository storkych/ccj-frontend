
// Unified API client (replaces mocks). We keep the filename so imports don't break.
const BASE = import.meta.env.VITE_API_URL || 'https://building-api.itc-hub.ru';

function getTokens(){
  try { return JSON.parse(localStorage.getItem('ccj_tokens')||'{}') } catch(e){ return {} }
}
function setTokens(t){ localStorage.setItem('ccj_tokens', JSON.stringify(t||{})) }

async function http(path, { method='GET', headers={}, body, retry=true } = {}){
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const tokens = getTokens()
  const h = { 'Content-Type':'application/json', ...headers }
  if (tokens.access) h['Authorization'] = `Bearer ${tokens.access}`
  const ts = new Date().toISOString()
  try{ console.log(`[api →]`, ts, method, url, body ? JSON.parse(body) : undefined) }catch{ console.log(`[api →]`, ts, method, url) }
  const res = await fetch(url, { method, headers:h, body })
  if (res.status === 401 && retry && tokens.refresh){
    // try refresh
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
    throw new Error(txt || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type')||''
  const out = ct.includes('application/json') ? await res.json() : await res.text()
  try{ console.log(`[api ←]`, method, url, res.status, out) }catch{ console.log(`[api ←]`, method, url, res.status) }
  return out
}

// ===== Auth helpers (used by AuthContext) =====
export async function apiLogin({ email, password }){
  const data = await http('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) })
  if (data.access) setTokens({ access: data.access, refresh: data.refresh })
  return data
}
export async function apiLogout(){
  const tokens = getTokens()
  try{ await http('/auth/logout', { method:'POST', body: JSON.stringify({ refresh: tokens.refresh||'' }) }) }catch(e){ /* ignore */ }
  setTokens({})
}
export async function apiMe(){
  return await http('/users/me')
}

// ===== Objects =====
export async function getObjects({ mine, status } = {}){
  const qs = new URLSearchParams()
  if (mine != null) qs.set('mine', String(mine))
  if (status) qs.set('status', status)
  return await http(`/objects?${qs.toString()}`)
}
export async function getObject(id){ return await http(`/objects/${id}`) }
export async function patchObject(id, patch){ return await http(`/objects/${id}`, { method:'PATCH', body: JSON.stringify(patch) }) }
export async function requestActivation(id){ return await http(`/objects/${id}/activation/request`, { method:'POST' }) }
export async function ikoActivationCheck(id, checklistData){ return await http(`/objects/${id}/activation/iko-check`, { method:'POST', body: JSON.stringify(checklistData) }) }
export async function suspendObject(id, payload){ return await http(`/objects/${id}/suspend`, { method:'POST', body: JSON.stringify(payload||{}) }) }
export async function resumeObject(id){ return await http(`/objects/${id}/resume`, { method:'POST' }) }
export async function completeObject(id){ return await http(`/objects/${id}/complete`, { method:'POST' }) }
export async function getObjectHistory(id, { limit=50, offset=0 } = {}){
  const qs = new URLSearchParams({ limit:String(limit), offset:String(offset) })
  return await http(`/objects/${id}/history?${qs.toString()}`)
}

// ===== Users =====
export async function getForemen(){ return await http('/foremen') }
export async function searchUsers({ role, query } = {}){
  const qs = new URLSearchParams()
  if (role) qs.set('role', role)
  if (query) qs.set('query', query)
  return await http(`/users?${qs.toString()}`)
}

// ===== Notifications =====
export async function getNotifications(){ return await http('/notifications?mine=true') }
export async function markNotificationRead(id){ return await http(`/notifications/${id}/read`, { method:'POST' }) }

// ===== Files / Documents / Exec docs =====
export async function getFileTree({ object_id } = {}){
  const qs = new URLSearchParams()
  if (object_id) qs.set('object_id', object_id)
  return await http(`/documents?${qs.toString()}`)
}
export async function getMemos(){ return await http('/memos') }

// ===== Tickets =====
export async function getTickets({ status } = {}){
  const qs = new URLSearchParams()
  if (status) qs.set('status', status)
  qs.set('mine', 'true')
  return await http(`/tickets?${qs.toString()}`)
}
export async function createTicket({ object_id, title, body, text }){
  const payload = { object_id: object_id||undefined, text: text || body || title }
  return await http('/tickets', { method:'POST', body: JSON.stringify(payload) })
}
export async function setTicketStatus({ id, status }){
  return await http(`/tickets/${id}/status`, { method:'POST', body: JSON.stringify({ status }) })
}

// ===== Work plans / schedules =====
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


// ===== Work plans =====
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

// ===== Visits & QR =====
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

// ===== Deliveries / Invoices / Labs =====
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

// ===== Violations / Prescriptions =====
export async function getViolations(params = {}){
  const qs = new URLSearchParams()
  for (const [k,v] of Object.entries(params)) if (v!=null && v!=='') qs.set(k, v)
  // alias in backend to prescriptions list
  return await http(`/violations?${qs.toString()}`)
}
export async function getViolation(id){
  return await http(`/prescriptions/${id}`)
}
export async function createViolation(payload){ return await http('/prescriptions', { method:'POST', body: JSON.stringify(payload) }) }
export async function submitViolationReport({ id, text, photos_folder_url, attachments }){
  const body = { comment: text, attachments: attachments || (photos_folder_url ? [photos_folder_url] : []) }
  return await http(`/prescriptions/${id}/fix`, { method:'POST', body: JSON.stringify(body) })
}
export async function reviewViolation({ id, decision, comment }){
  const accepted = decision === 'approve' || decision === true
  return await http(`/prescriptions/${id}/verify`, { method:'POST', body: JSON.stringify({ accepted, comment }) })
}
export async function confirmViolation({ id }){ return reviewViolation({ id, decision:'approve' }) }
export async function declineViolation({ id }){ return reviewViolation({ id, decision:'reject' }) }

// ===== Daily checklists =====
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

// ===== AI =====
export async function getAIObjectReports({ object_id }){
  return await http('/ai/structured', { method:'POST', body: JSON.stringify({ prompt:`Сводка по объекту ${object_id}`, schema_json:{ type:'object', properties:{ summary:{ type:'string' } }, required:['summary'] } }) })
}
export async function aiChat({ object_id, message }){
  const r = await http('/ai/free', { method:'POST', body: JSON.stringify({ prompt:`[object=${object_id||''}] ${message}` }) })
  return { reply: r.text || '' }
}

// ===== Misc =====
export function getEnv(){ 
  return { api_url: BASE, build_mode: import.meta.env.MODE }
}

// ===== Areas (polygons) =====
export async function createArea({ name, geometry, object }){
  return await http('/areas', { method:'POST', body: JSON.stringify({ name, geometry, object }) })
}
export async function getArea(id){
  return await http(`/areas/${id}`)
}


// Compatibility helpers (used by old UI components)
export async function acceptDelivery({ id, comment }){
  return await setDeliveryStatus({ id, status: 'accepted', comment })
}
export async function sendDeliveryToLab({ id, comment }){
  return await setDeliveryStatus({ id, status: 'sent_to_lab', comment })
}


// Upload delivery photo (compat):
// NOTE: backend upload endpoint is not defined; this client helper only returns a stub object
// so the UI can proceed. Replace later with real upload (signed URL -> PUT -> confirm).
export async function uploadDeliveryPhoto({ delivery_id, file }){
  return { id: `p_${Date.now()}`, name: (file && file.name) || 'photo.jpg', delivery_id }
}
