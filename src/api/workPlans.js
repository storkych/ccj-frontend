import { http } from './api.js'

function getTokens() {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token')
  }
}

// Создание запроса на изменение рабочего плана (Прораб)
export async function createWorkPlanChangeRequest(workPlanId, comment, items) {
  const ts = new Date().toISOString()
  const tokens = getTokens()
  const headers = { 'Content-Type': 'application/json' }
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`
  
  const body = {
    work_plan_id: workPlanId,
    comment: comment,
    items: items.map(item => ({
      id: item.id, // Include ID for existing items
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      start_date: item.start_date,
      end_date: item.end_date,
      sub_areas: item.sub_areas.map(subArea => ({
        name: subArea.name,
        geometry: subArea.geometry,
        color: subArea.color
      }))
    }))
  }
  
  try{ console.log(`[api →]`, ts, 'POST', '/work-plans/change-request', body) }catch{ console.log(`[api →]`, ts, 'POST', '/work-plans/change-request', body) }
  const res = await http('/work-plans/change-request', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  console.log(`[api ←]`, ts, 'POST', '/work-plans/change-request', res.status, res)
  return res
}

// Получение списка запросов на изменение
export async function getChangeRequests(params = {}) {
  const ts = new Date().toISOString()
  const tokens = getTokens()
  const headers = { 'Content-Type': 'application/json' }
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`
  
  // Формируем query параметры
  const queryParams = new URLSearchParams()
  if (params.status) queryParams.append('status', params.status)
  if (params.object_id) queryParams.append('object_id', params.object_id)
  
  const queryString = queryParams.toString()
  const url = queryString ? `/work-plans/change-requests?${queryString}` : '/work-plans/change-requests'
  
  try{ console.log(`[api →]`, ts, 'GET', url) }catch{ console.log(`[api →]`, ts, 'GET', url) }
  const res = await http(url, {
    method: 'GET',
    headers
  })
  console.log(`[api ←]`, ts, 'GET', url, res.status, res)
  return res
}

// Принятие решения по запросу на изменение
export async function makeChangeRequestDecision(changeRequestId, decision, comment, editedItems = null) {
  const ts = new Date().toISOString()
  const tokens = getTokens()
  const headers = { 'Content-Type': 'application/json' }
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`
  
  const body = {
    decision: decision,
    comment: comment
  }
  
  // Добавляем edited_items только для решения "edit"
  if (decision === 'edit' && editedItems) {
    body.edited_items = editedItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      start_date: item.start_date,
      end_date: item.end_date,
      sub_areas: item.sub_areas ? item.sub_areas.map(subArea => ({
        name: subArea.name,
        geometry: subArea.geometry,
        color: subArea.color
      })) : []
    }))
  }
  
  try{ console.log(`[api →]`, ts, 'POST', `/work-plans/change-requests/${changeRequestId}/decision`, body) }catch{ console.log(`[api →]`, ts, 'POST', `/work-plans/change-requests/${changeRequestId}/decision`, body) }
  const res = await http(`/work-plans/change-requests/${changeRequestId}/decision`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  console.log(`[api ←]`, ts, 'POST', `/work-plans/change-requests/${changeRequestId}/decision`, res.status, res)
  return res
}


