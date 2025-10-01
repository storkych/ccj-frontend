
import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getViolation, submitViolationReport, reviewViolation } from '../api/mock.js'

export default function ViolationDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [v, setV] = useState(null)
  const [object, setObject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportText, setReportText] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  async function load(){ 
    setLoading(true)
    try {
      const violation = await getViolation(id)
      setV(violation)
      // object уже содержит полную информацию в ответе API
      if (violation.object && typeof violation.object === 'object') {
        setObject(violation.object)
      }
    } catch (e) {
      console.warn('[ui violation detail] error', e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ load() }, [id])

  async function sendReport(e){
    e.preventDefault()
    if (!reportText.trim()) return alert('Введите описание выполненных работ')
    setSaving(true)
    try {
      await submitViolationReport({ id, text: reportText })
      alert('Отчет об устранении отправлен')
      setReportText('')
      load()
    } catch (e) {
      alert('Ошибка отправки отчета: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  async function verify(accepted) {
    if (!accepted && !comment.trim()) return alert('Введите комментарий при отклонении')
    setSaving(true)
    try {
      await reviewViolation({ id, decision: accepted ? 'approve' : 'reject', comment: comment || undefined })
      alert(accepted ? 'Нарушение подтверждено как исправленное' : 'Нарушение отклонено')
      setComment('')
      load()
    } catch (e) {
      alert('Ошибка проверки: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if(loading) return <div className="page"><div className="muted">Загрузка...</div></div>
  if(!v) return <div className="page"><div className="muted">Нарушение не найдено</div></div>

  const getStatusInfo = (status) => {
    const statusMap = {
      'open': { label: 'Открыто', color: '#ef4444' },
      'fixed': { label: 'Исправлено', color: '#f59e0b' },
      'verified': { label: 'Проверено', color: '#10b981' },
      'closed': { label: 'Закрыто', color: '#6b7280' }
    }
    return statusMap[status] || { label: status, color: '#6b7280' }
  }

  const statusInfo = getStatusInfo(v.status)

  return (
    <div className="page">
      <div className="row" style={{gap:12, alignItems:'center', marginBottom: 20}}>
        <Link to="/violations" className="link">← Назад к списку</Link>
        <h1 style={{margin:0}}>{v.title}</h1>
        <span 
          className="pill" 
          style={{
            backgroundColor: statusInfo.color + '20',
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}40`
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="card" style={{marginBottom: 20}}>
        <h3 style={{marginTop: 0, marginBottom: 16}}>Информация о нарушении</h3>
        <div style={{display: 'grid', gap: 12}}>
          <div>
            <strong>Объект:</strong> {object ? `${object.name} (${object.address})` : `Объект #${v.object}`}
          </div>
          {v.description && (
            <div>
              <strong>Описание:</strong> {v.description}
            </div>
          )}
          <div className="row" style={{gap: 16, flexWrap: 'wrap'}}>
            {v.requires_stop && (
              <span style={{color: '#ef4444', fontWeight: '600'}}>⚠️ Требует остановки работ</span>
            )}
            {v.requires_personal_recheck && (
              <span style={{color: '#f59e0b', fontWeight: '600'}}>👁️ Требует личной проверки</span>
            )}
          </div>
          <div style={{color: 'var(--muted)', fontSize: '14px'}}>
            Создано: {new Date(v.created_at).toLocaleString('ru-RU')}
          </div>
        </div>
      </div>

      {v.attachments && v.attachments.length > 0 && (
        <div className="card" style={{marginBottom: 20}}>
          <h3 style={{marginTop: 0, marginBottom: 12}}>Вложения</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {v.attachments.map((attachment, index) => (
              <a 
                key={index} 
                href={attachment} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{color: 'var(--brand)', textDecoration: 'none'}}
              >
                📎 Вложение {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'foreman' && v.status === 'open' && (
        <div className="card" style={{marginBottom: 20}}>
          <h3 style={{marginTop: 0, marginBottom: 16}}>Отчет об устранении</h3>
          <form onSubmit={sendReport}>
            <textarea 
              className="input" 
              rows="4" 
              placeholder="Опишите выполненные работы по устранению нарушения..." 
              value={reportText} 
              onChange={e=>setReportText(e.target.value)}
              style={{marginBottom: 12}}
            />
            <div className="row" style={{justifyContent:'flex-end'}}>
              <button className="btn" disabled={saving || !reportText.trim()}>
                {saving ? 'Отправляем...' : 'Отправить отчет'}
              </button>
            </div>
          </form>
        </div>
      )}

      {(user?.role === 'ssk' || user?.role === 'iko') && v.status === 'fixed' && (
        <div className="card" style={{marginBottom: 20}}>
          <h3 style={{marginTop: 0, marginBottom: 16}}>Проверка устранения</h3>
          <div style={{marginBottom: 12}}>
            <textarea 
              className="input" 
              rows="3" 
              placeholder="Комментарий (обязательно при отклонении)..." 
              value={comment} 
              onChange={e=>setComment(e.target.value)}
            />
          </div>
          <div className="row" style={{gap: 8}}>
            <button 
              className="btn" 
              onClick={() => verify(true)}
              disabled={saving}
            >
              {saving ? 'Проверяем...' : '✅ Подтвердить устранение'}
            </button>
            <button 
              className="btn ghost" 
              onClick={() => verify(false)}
              disabled={saving || !comment.trim()}
            >
              {saving ? 'Проверяем...' : '❌ Отклонить'}
            </button>
          </div>
        </div>
      )}

      {v.fix_comment && (
        <div className="card" style={{marginBottom: 20}}>
          <h3 style={{marginTop: 0, marginBottom: 12}}>Отчет прораба</h3>
          <div style={{padding: 12, backgroundColor: 'var(--bg-light)', borderRadius: '6px'}}>
            {v.fix_comment}
          </div>
        </div>
      )}
    </div>
  )
}
