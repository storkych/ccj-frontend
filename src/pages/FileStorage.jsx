
import React, { useEffect, useState } from 'react'
import { getFileTree } from '../api/mock.js'

export default function FileStorage(){
  const [items, setItems] = useState([])
  useEffect(()=>{ getFileTree().then(r=>setItems(r.items)) }, [])
  const grouped = items.reduce((acc,i)=>{ (acc[i.parent||'root']=acc[i.parent||'root']||[]).push(i); return acc }, {})
  return (
    <div className="page">
      <h1>Файловое хранилище</h1>
      <p className="muted">Структура папок и документов. Файлы из реального бэка будут отображаться здесь.</p>
      <div className="grid cols-2">
        {Object.entries(grouped).map(([folder, arr])=>(
          <section key={folder} className="card">
            <h3>{folder==='root'?'Корень':items.find(x=>x.id===folder)?.name}</h3>
            <ul>
              {arr.map(i=>(
                <li key={i.id} className="row" style={{justifyContent:'space-between'}}>
                  <span>{i.type==='folder'?'📁':'📄'} {i.name}</span>
                  <span className="muted">{i.size||''}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
