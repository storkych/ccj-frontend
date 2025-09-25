import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getObjects } from '../api/mock.js'

function Progress({ value }){
  return <div className="progress"><span style={{width: value+'%'}}/></div>
}

export default function Objects(){
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    getObjects().then(r => { setData(r.items); setLoading(false) })
  }, [])

  if(loading) return <div className="card">Загрузка объектов…</div>

  return (
    <div className="grid">
      <h2 style={{margin:'0 0 8px'}}>Объекты</h2>
      <div className="object-list">
        {data.map(o => (
          <article key={o.id} className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h4 style={{margin:0}}>{o.name}</h4>
              <span className={'status '+(o.violations_open>0?'red':'green')}>
                нарушений: {o.violations_open}/{o.violations_total}
              </span>
            </div>
            <div style={{margin:'10px 0'}}><Progress value={o.progress} /></div>
            <div className="row">
              <span className="pill">адрес: {o.address}</span>
              <span className="pill">поставки сегодня: {o.deliveries_today}</span>
              <span className="pill">посещения (ССК/ИКО/прораб): {o.visits.ssk}/{o.visits.iko}/{o.visits.foreman}</span>
            </div>
            <div className="row" style={{marginTop:10, justifyContent:'flex-end'}}>
              <Link className="link" to={`/objects/${o.id}`}>Открыть карточку →</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
