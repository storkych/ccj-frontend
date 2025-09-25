// Simple in-memory mock to simulate backend endpoints
export const roles = ['admin','sysadmin','ssk','iko','foreman']

export const foremen = [
  { id:'f1', full_name:'Иван Петров', phone:'+7 900 111-22-33' },
  { id:'f2', full_name:'Сергей Смирнов', phone:'+7 900 222-33-44' },
  { id:'f3', full_name:'Алексей Котов', phone:'+7 900 333-44-55' },
]

export let objects = [
  { id:'o1', name:'ЖК «Река»', status:'active', progress:48, address:'ул. Лесная, 12', polygonId:'c1',
    ssk:'Анна Соколова', iko:'Илья Орлов', foreman:null,
    violations_total:6, violations_open:4,
    visits:{ ssk:3, iko:2, foreman:7 },
    deliveries_today:2, ai_flag:'risk schedule'
  },
  { id:'o2', name:'Мост М7', status:'active', progress:76, address:'трасса М7, км 214', polygonId:'c2',
    ssk:'Анна Соколова', iko:'Илья Орлов', foreman:'Иван Петров',
    violations_total:2, violations_open:1,
    visits:{ ssk:5, iko:3, foreman:11 },
    deliveries_today:1, ai_flag:'ok'
  },
  { id:'o3', name:'БЦ «Север»', status:'active', progress:68, address:'пр. Мира, 7', polygonId:'c3',
    ssk:'Анна Соколова', iko:'Илья Орлов', foreman:'Сергей Смирнов',
    violations_total:0, violations_open:0,
    visits:{ ssk:2, iko:1, foreman:4 },
    deliveries_today:4, ai_flag:'ok'
  },
]

export function apiDelay(ms=350){ return new Promise(r=>setTimeout(r, ms)) }

export async function getObjects(){ await apiDelay(); return { items: objects, total: objects.length } }

export async function getObject(id){ await apiDelay(); return objects.find(o=>o.id===id) }

export async function patchObject(id, patch){
  await apiDelay();
  objects = objects.map(o => o.id===id ? { ...o, ...patch } : o)
  return objects.find(o=>o.id===id)
}

export async function getForemen(){ await apiDelay(); return { items: foremen, total: foremen.length } }

export async function createWorkPlan({ object_id, items }){
  await apiDelay();
  return { id: 'wp_'+object_id, object_id, items, created_at: new Date().toISOString() }
}

export async function createDailyChecklist({ object_id, answers }){
  await apiDelay();
  return { id: 'dc_'+object_id, object_id, answers, status:'submitted', created_at: new Date().toISOString() }
}
