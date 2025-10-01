import React from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
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
import ViolationDetail from './pages/ViolationDetail.jsx'
import Visits from './pages/Visits.jsx'
import SSKChecklists from './pages/SSKChecklists.jsx'

function Layout({ children }){
  const { user, logout } = useAuth()
  const location = useLocation()

  const allItems = [
    { to:'/objects', label:'Объекты' },
    { to:'/files', label:'Файловое хранилище' },
    { to:'/notifications', label:'Уведомления' },
    { to:'/memos', label:'Памятки' },
    { to:'/ai', label:'ИИ чат' },
    { to:'/tickets', label:'Тикеты' },
    { to:'/work-schedule', label:'График работ' },
  ]
  const byRole = {
    foreman: [
      { to:'/daily-checklist', label:'Ежедневный чек-лист' },
      { to:'/deliveries', label:'Поставки материалов' },
      { to:'/violations', label:'Нарушения' },
    ],
    ssk: [
      { to:'/ssk/checklists', label:'Ежедневные чек-листы прорабов' },
      { to:'/violations', label:'Нарушения' },
      { to:'/deliveries', label:'Поставки' },
      { to:'/visits', label:'Посещения' },
    ],
    iko: [
      { to:'/visits', label:'Посещения' },
      { to:'/violations', label:'Нарушения' },
    ],
    admin: []
  }
  const menu = [...allItems, ...(byRole[user?.role] || [])]

  return (
    <div className="app">
      
      
      
      <aside>
        <div className="logo">
          <img src="/src/assets/logo.svg" alt="СтройКонтроль" style={{width: 40, height: 40}} />
          <div className="hide-compact">СтройКонтроль</div>
        </div>
        <nav className="nav">
          {menu.map(item => (
            <NavLink key={item.to} className={({isActive})=>isActive?'active':''} to={item.to}>{item.label}</NavLink>
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
    { to:'/objects', label:'Объекты' },
    { to:'/files', label:'Файловое хранилище' },
    { to:'/notifications', label:'Уведомления' },
    { to:'/memos', label:'Памятки' },
    { to:'/ai', label:'ИИ чат' },
    { to:'/tickets', label:'Тикеты' },
    { to:'/work-schedule', label:'График работ' },
  ]
  const byRole = {
    foreman: [
      { to:'/daily-checklist', label:'Ежедневный чек-лист' },
      { to:'/deliveries', label:'Поставки материалов' },
      { to:'/violations', label:'Нарушения' },
    ],
    ssk: [
      { to:'/ssk/checklists', label:'Ежедневные чек-листы прорабов' },
      { to:'/violations', label:'Нарушения' },
      { to:'/deliveries', label:'Поставки' },
      { to:'/visits', label:'Посещения' },
    ],
    iko: [
      { to:'/visits', label:'Посещения' },
      { to:'/violations', label:'Нарушения' },
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
        <Route path="/violations/:id" element={<Protected><RoleProtected roles={["foreman","ssk","iko"]}><Layout><ViolationDetail/></Layout></RoleProtected></Protected>} />
        <Route path="/visits" element={<Protected><RoleProtected roles={["ssk","iko"]}><Layout><Visits/></Layout></RoleProtected></Protected>} />
        <Route path="/ssk/checklists" element={<Protected><RoleProtected roles={["ssk"]}><Layout><SSKChecklists/></Layout></RoleProtected></Protected>} />
        <Route path="*" element={<Navigate to="/objects" />} />
      </Routes>
    </AuthProvider>
  )
}