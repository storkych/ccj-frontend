
import React from 'react'

export default function QRPage(){
  const sample = 'QR:OBJ:o1:ЖК «Река»'
  return (
    <div className="page">
      <h1>QR код</h1>
      <div className="card" style={{display:'grid', placeItems:'center', minHeight:260}}>
        <div style={{width:180, height:180, background:'repeating-linear-gradient(45deg,#111 0 8px,#222 8px 16px)', display:'grid', placeItems:'center', borderRadius:12, border:'1px solid #333'}}>
          <div style={{fontWeight:700, textAlign:'center'}}>QR</div>
        </div>
        <div className="muted" style={{marginTop:8}}>{sample}</div>
      </div>
    </div>
  )
}
