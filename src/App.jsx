import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { getNotifications } from './api/api.js'
import Login from './pages/Login.jsx'
import Objects from './pages/Objects.jsx'
import ObjectDetail from './pages/ObjectDetail.jsx'
import WorkPlanForm from './pages/WorkPlanForm.jsx'
import DailyChecklist from './pages/DailyChecklist.jsx'

import FileStorage from './pages/FileStorage.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import Memos from './pages/Memos.jsx'
import AIChat from './pages/AIChat.jsx'
import QRPage from './pages/QRPage.jsx'
import Tickets from './pages/Tickets.jsx'
import WorkSchedule from './pages/WorkSchedule.jsx'
import Deliveries from './pages/Deliveries.jsx'
import Violations from './pages/Violations.jsx'
import Visits from './pages/Visits.jsx'
import SSKChecklists from './pages/SSKChecklists.jsx'

const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const icons = {
    objects: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    files: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
    memos: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
    ai: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    tickets: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
    schedule: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    checklist: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    deliveries: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    violations: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    visits: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    analytics: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
    notifications: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  }
  return icons[name] || null
}

function Layout({ children }){
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const allItems = [
    { to:'/objects', label:'Объекты', icon: 'objects' },
    { to:'/files', label:'Файловое хранилище', icon: 'files' },
    { to:'/memos', label:'Памятки', icon: 'memos' },
    { to:'/ai', label:'ИИ чат', icon: 'ai' },
    { to:'/tickets', label:'Тикеты', icon: 'tickets' },
    { to:'/work-schedule', label:'График работ', icon: 'schedule' },
  ]
  const byRole = {
    foreman: [
      { to:'/daily-checklist', label:'Ежедневный чек-лист', icon: 'checklist' },
      { to:'/deliveries', label:'Поставки материалов', icon: 'deliveries' },
      { to:'/violations', label:'Нарушения', icon: 'violations' },
    ],
    ssk: [
      { to:'/ssk/checklists', label:'Ежедневные чек-листы прорабов', icon: 'analytics' },
      { to:'/violations', label:'Нарушения', icon: 'violations' },
      { to:'/deliveries', label:'Поставки', icon: 'deliveries' },
      { to:'/visits', label:'Посещения', icon: 'visits' },
    ],
    iko: [
      { to:'/visits', label:'Посещения', icon: 'visits' },
      { to:'/violations', label:'Нарушения', icon: 'violations' },
    ],
    admin: []
  }
  const menu = [...allItems, ...(byRole[user?.role] || [])]

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(r => {
        const notifications = r.notifications || []
        setNotifications(notifications)
        setUnreadCount(notifications.filter(n => !n.is_read).length)
      }).catch(e => {
        console.warn('[ui notifications] error', e)
        setNotifications([])
        setUnreadCount(0)
      })
    }
  }, [user])

  return (
    <div className="app">
      
      
      
      <aside>
        <div className="logo">
          <img src="/src/assets/logo.svg" alt="СтройКонтроль" style={{width: 40, height: 40}} />
          <div className="hide-compact">СтройКонтроль</div>
        </div>
        <nav className="nav">
          {menu.map(item => (
            <NavLink key={item.to} className={({isActive})=>isActive?'active':''} to={item.to}>
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>



      <div>
        <header>
          <div className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m21 21-4.3-4.3" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="11" r="7" stroke="#6b7280" strokeWidth="2" fill="none"/></svg>
            <input placeholder="Поиск по объектам, актам, замечаниям…" />
          </div>
          {user ? (
            <div className="row" style={{gap:12, alignItems:'center'}}>
              <NavLink to="/notifications" className={`profile-link ${unreadCount > 0 ? 'has-unread' : ''}`} style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'8px 12px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', textDecoration:'none', color:'var(--text)', transition:'all 0.2s', position:'relative', height:'48px', minWidth:'80px'}}>
                <Icon name="notifications" size={18} />
                <span style={{fontSize:'14px', fontWeight:'500'}}>Уведомления</span>
                {unreadCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--brand)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(255,138,0,0.4)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </NavLink>
              <NavLink to="/profile" className="profile-link" style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', textDecoration:'none', color:'var(--text)', transition:'all 0.2s'}}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, var(--brand), var(--brand)80)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
                  <div style={{fontSize:'14px', fontWeight:'600', color:'var(--text)'}}>
                    {user.full_name || 'Профиль'}
                  </div>
                  <div style={{fontSize:'12px', color:'var(--text-secondary)'}}>
                    {user.role?.toUpperCase()}
                  </div>
                </div>
              </NavLink>
              <button 
                className="profile-link logout" 
                onClick={logout} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 8, 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border)', 
                  textDecoration: 'none', 
                  color: 'var(--text)', 
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  height: '48px',
                  minWidth: '60px'
                }}
              >
                Выйти
              </button>
            </div>
          ) : null}
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}

function Protected({ children }){
  const { user } = useAuth()
  const location = useLocation()

  const allItems = [
    { to:'/objects', label:'Объекты', icon: 'objects' },
    { to:'/files', label:'Файловое хранилище', icon: 'files' },
    { to:'/memos', label:'Памятки', icon: 'memos' },
    { to:'/ai', label:'ИИ чат', icon: 'ai' },
    { to:'/tickets', label:'Тикеты', icon: 'tickets' },
    { to:'/work-schedule', label:'График работ', icon: 'schedule' },
  ]
  const byRole = {
    foreman: [
      { to:'/daily-checklist', label:'Ежедневный чек-лист', icon: 'checklist' },
      { to:'/deliveries', label:'Поставки материалов', icon: 'deliveries' },
      { to:'/violations', label:'Нарушения', icon: 'violations' },
    ],
    ssk: [
      { to:'/ssk/checklists', label:'Ежедневные чек-листы прорабов', icon: 'analytics' },
      { to:'/violations', label:'Нарушения', icon: 'violations' },
      { to:'/deliveries', label:'Поставки', icon: 'deliveries' },
      { to:'/visits', label:'Посещения', icon: 'visits' },
    ],
    iko: [
      { to:'/visits', label:'Посещения', icon: 'visits' },
      { to:'/violations', label:'Нарушения', icon: 'violations' },
    ],
    admin: []
  }
  const menu = [...allItems, ...(byRole[user?.role] || [])]

  if(!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function RoleProtected({ allow = [], children }){
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" />
    if (allow.length > 0 && !allow.includes(user.role)) {
        return <div style={{ padding:20 }}>⛔ Доступ запрещён для роли: {user.role}</div>
    }
    return children
}

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/" element={<Protected><Layout><Navigate to="/objects" /></Layout></Protected>} />
        <Route path="/objects" element={<Protected><Layout><Objects/></Layout></Protected>} />
        <Route path="/objects/:id" element={<Protected><Layout><ObjectDetail/></Layout></Protected>} />
        <Route path="/work-plans/new/:objectId" element={<Protected><Layout><WorkPlanForm/></Layout></Protected>} />
        <Route path="/daily-checklist" element={<Protected><RoleProtected roles={["foreman"]}><Layout><DailyChecklist/></Layout></RoleProtected></Protected>} />

        <Route path="/files" element={<Protected><Layout><FileStorage/></Layout></Protected>} />
        <Route path="/notifications" element={<Protected><Layout><Notifications/></Layout></Protected>} />
        <Route path="/profile" element={<Protected><Layout><Profile/></Layout></Protected>} />
        <Route path="/memos" element={<Protected><Layout><Memos/></Layout></Protected>} />
        <Route path="/ai" element={<Protected><Layout><AIChat/></Layout></Protected>} />
        <Route path="/qr" element={<Protected><Layout><QRPage/></Layout></Protected>} />
        <Route path="/tickets" element={<Protected><Layout><Tickets/></Layout></Protected>} />
        <Route path="/work-schedule" element={<Protected><Layout><WorkSchedule/></Layout></Protected>} />
        <Route path="/deliveries" element={<Protected><RoleProtected roles={["foreman","ssk"]}><Layout><Deliveries/></Layout></RoleProtected></Protected>} />
        <Route path="/violations" element={<Protected><RoleProtected roles={["foreman","ssk","iko"]}><Layout><Violations/></Layout></RoleProtected></Protected>} />
        <Route path="/visits" element={<Protected><RoleProtected roles={["ssk","iko"]}><Layout><Visits/></Layout></RoleProtected></Protected>} />
        <Route path="/ssk/checklists" element={<Protected><RoleProtected roles={["ssk"]}><Layout><SSKChecklists/></Layout></RoleProtected></Protected>} />
        <Route path="*" element={<Navigate to="/objects" />} />
      </Routes>
    </AuthProvider>
  )
}