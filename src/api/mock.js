// src/api/mock.js
// Простые моки + искусственная задержка
export const apiDelay = (ms = 200) => new Promise(res => setTimeout(res, ms))

export const roles = ['admin', 'sysadmin', 'ssk', 'iko', 'foreman']

// ==== Справочники
export const foremen = [
    { id: 'f1', full_name: 'Иван Петров', phone: '+7 900 111-22-33' },
    { id: 'f2', full_name: 'Сергей Смирнов', phone: '+7 900 222-33-44' },
    { id: 'f3', full_name: 'Алексей Котов', phone: '+7 900 333-44-55' },
]

// ==== Объекты
export let objects = [
    { id:'o1', name:'ЖК «Река»', status:'active', activation_state:'ready', progress:48, address:'ул. Лесная, 12', polygonId:'c1',
        ssk:'Анна Соколова', ssk_id:'ssk1', iko:'Илья Орлов', iko_id:'iko1', foreman:null, foreman_id:null,
        violations_total:6, violations_open:4,
        visits:{ ssk:3, iko:2, foreman:7 },
        deliveries_today:2, ai_flag:'risk schedule'
    },
    { id:'o2', name:'Мост М7', status:'active', activation_state:'active', progress:76, address:'трасса М7, км 214', polygonId:'c2',
        ssk:'Анна Соколова', ssk_id:'ssk1', iko:'Илья Орлов', iko_id:'iko1', foreman:'Иван Петров', foreman_id:'f1',
        violations_total:2, violations_open:1,
        visits:{ ssk:5, iko:3, foreman:11 },
        deliveries_today:1, ai_flag:'ok'
    },
    { id:'o3', name:'БЦ «Север»', status:'paused', activation_state:'not_ready', progress:68, address:'пр. Мира, 7', polygonId:'c3',
        ssk:'Анна Соколова', ssk_id:'ssk1', iko:'Илья Орлов', iko_id:'iko1', foreman:'Сергей Смирнов', foreman_id:'f2',
        violations_total:0, violations_open:0,
        visits:{ ssk:1, iko:1, foreman:3 },
        deliveries_today:0, ai_flag:'risk quality'
    },
]

export async function getObjects(){
    await apiDelay();
    return { items: objects, total: objects.length }
}
export async function getObject(id){
    await apiDelay();
    return objects.find(o => o.id === id)
}
export async function patchObject(id, patch){
    await apiDelay();
    const o = objects.find(x => x.id === id)
    if (o) Object.assign(o, patch)
    return o
}
export async function getForemen(){
    await apiDelay();
    return { items: foremen, total: foremen.length }
}

// ==== Работы / планы
export async function createWorkPlan({ object_id, items }){
    await apiDelay();
    return { id: 'wp_'+object_id, object_id, items, created_at: new Date().toISOString() }
}

// ==== Ежедневные чек-листы
export let dailyChecklists = [
    { id:'dc1', object_id:'o1', foreman:'Иван Петров', date:'2025-09-28', status:'submitted' },
    { id:'dc2', object_id:'o2', foreman:'Сергей Смирнов', date:'2025-09-28', status:'submitted' },
]
export async function createDailyChecklist({ object_id, answers }){
    await apiDelay();
    const it = { id: 'dc_'+object_id, object_id, answers, status:'submitted', created_at: new Date().toISOString() }
    dailyChecklists.unshift(it)
    return it
}
export async function getDailyChecklists(){ await apiDelay(); return { items: dailyChecklists } }
export async function markDailyChecklistReviewed({ id }){ await apiDelay(); const c=dailyChecklists.find(x=>x.id===id); if(c) c.status='reviewed'; return c }

// ==== Файловое хранилище / Памятки
export let files = [
    { id:'root', name:'/', type:'folder', parent:null },
    { id:'fdocs', name:'Документы', type:'folder', parent:'root' },
    { id:'fmemos', name:'Памятки', type:'folder', parent:'root' },
    { id:'spec1', name:'Смета_ЖК_Река.pdf', type:'file', parent:'fdocs', size: '1.2 MB', object_id:'o1' },
    { id:'spec2', name:'Паспорт_материала_бетон.pdf', type:'file', parent:'fdocs', size: '820 KB', object_id:'o2' },
    { id:'memo1', name:'Памятка по ТБ.docx', type:'file', parent:'fmemos', size: '64 KB' },
]
export async function getFileTree(){ await apiDelay(); return { items: files } }
export async function getMemos(){ await apiDelay(); return { items: files.filter(f=>f.parent==='fmemos') } }

// ==== Уведомления
export let notifications = [
    { id:'n1', to:'foreman', text:'Поставка №P-101 по объекту ЖК «Река» ожидает подтверждения', created_at: new Date(Date.now()-3600e3).toISOString() },
    { id:'n2', to:'ssk', text:'Прораб Иван Петров отправил чек-лист за сегодня по объекту БЦ «Север»', created_at: new Date(Date.now()-7200e3).toISOString() },
    { id:'n3', to:'iko', text:'Нарушение №V-77 ожидает подтверждения исправления', created_at: new Date(Date.now()-1800e3).toISOString() }
]
export async function getNotifications(role){ await apiDelay(); return { items: notifications.filter(n=>n.to===role) } }

// ==== Тикеты
export let tickets = [
    { id:'t1', author_role:'foreman', title:'Не открывается карточка поставки', status:'open', created_at:new Date().toISOString() },
]
export async function getTickets(){ await apiDelay(); return { items: tickets } }
export async function createTicket({ title, body, object_id }){ await apiDelay(); const t={ id:'t'+(tickets.length+1), title, body, object_id, status:'open', created_at:new Date().toISOString() }; tickets.unshift(t); return t }

// ==== График работ
export let schedules = [
    { id:'s1', object_id:'o1', title:'Черновые работы', assignee:'f1', start:'2025-09-25', end:'2025-10-05' },
    { id:'s2', object_id:'o2', title:'Арматура', assignee:'f2', start:'2025-09-27', end:'2025-10-10' },
]
export async function getSchedules({ object_id }={}){ await apiDelay(); return { items: object_id? schedules.filter(s=>s.object_id===object_id): schedules } }

// ==== Посещения
export let visits = [
    { id:'v1', role:'ssk', object_id:'o1', date:'2025-09-29', status:'planned' },
    { id:'v2', role:'iko', object_id:'o1', date:'2025-09-30', status:'planned' },
    { id:'v3', role:'foreman', object_id:'o2', date:'2025-09-28', status:'done' },
]
export async function getVisits({ role, object_id }={}){
    await apiDelay();
    let arr = visits;
    if (role) arr = arr.filter(v=>v.role===role);
    if (object_id) arr = arr.filter(v=>v.object_id===object_id);
    return { items: arr }
}

// ==== Поставки
export let deliveries = [
    { id:'d1', object_id:'o1', title:'Бетон М300', status:'new', photos:[], lab:false, created_at:new Date().toISOString() },
    { id:'d2', object_id:'o2', title:'Кирпич керамический', status:'new', photos:[], lab:false, created_at:new Date().toISOString() },
    { id:'d3', object_id:'o1', title:'Арматура A500', status:'accepted', photos:[], lab:false, created_at:new Date(Date.now()-86400e3).toISOString() },
]
export async function getDeliveries({ object_id }={}){ await apiDelay(); return { items: object_id? deliveries.filter(d=>d.object_id===object_id): deliveries } }
export async function uploadDeliveryPhoto({ delivery_id, file }){
    await apiDelay();
    const d = deliveries.find(x=>x.id===delivery_id);
    if (d){ d.photos.push({ id:'p'+(d.photos.length+1), name:file?.name||'mock.jpg' }); }
    return d;
}
export async function acceptDelivery({ id }){ await apiDelay(); const d=deliveries.find(x=>x.id===id); if(d) d.status='accepted'; return d }
export async function sendDeliveryToLab({ id }){ await apiDelay(); const d=deliveries.find(x=>x.id===id); if(d) d.lab=true; return d }

// ==== Нарушения
export let violations = [
    { id:'vi1', object_id:'o1', status:'open', title:'Отсутствуют ограждения', description:'На участке 1 не установлены ограждения', photos:[], created_at:new Date().toISOString(), reports:[] },
    { id:'vi2', object_id:'o2', status:'in_review', title:'Неправильное хранение материалов', description:'Паллеты размещены в проходе', photos:[], created_at:new Date(Date.now()-86400e3).toISOString(), reports:[] },
]
export async function getViolations({ object_id }={}){ await apiDelay(); return { items: object_id? violations.filter(v=>v.object_id===object_id): violations } }
export async function getViolation(id){ await apiDelay(); return violations.find(v=>v.id===id) }
export async function createViolation({ object_id, title, description, photos=[] }){ await apiDelay(); const v={ id:'vi'+(violations.length+1), object_id, status:'open', title, description, photos, created_at:new Date().toISOString(), reports:[] }; violations.unshift(v); return v }
export async function submitViolationReport({ id, text, photos=[] }){ await apiDelay(); const v=violations.find(x=>x.id===id); if(v){ v.reports.push({ text, photos, date:new Date().toISOString() }); v.status='in_review' } return v }
export async function confirmViolation({ id }){ await apiDelay(); const v=violations.find(x=>x.id===id); if(v) v.status='closed'; return v }
export async function declineViolation({ id }){ await apiDelay(); const v=violations.find(x=>x.id===id); if(v) v.status='open'; return v }

// ==== AI
export async function getAIObjectReports({ object_id }){ await apiDelay(); return { items: [{ id:'ai1', object_id, summary:'Риск задержки поставки бетона. Рекомендация: сместить бетонные работы на 1 день.' }] } }
export async function aiChat({ object_id, message }){ await apiDelay(); return { reply: `AI по объекту ${object_id||'—'}: принял ваше сообщение "${message}".` } }

// ==== ENV
export function getEnv(){
    return { api_url: import.meta.env.VITE_API_URL || 'MOCK', build_mode: import.meta.env.MODE }
}
