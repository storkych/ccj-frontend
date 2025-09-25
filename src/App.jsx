import React from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Objects from './pages/Objects.jsx'
import ObjectDetail from './pages/ObjectDetail.jsx'
import WorkPlanForm from './pages/WorkPlanForm.jsx'
import DailyChecklist from './pages/DailyChecklist.jsx'

function Layout({ children }){
  const { user, logout } = useAuth()
  const location = useLocation()
  return (
    <div className="app">
      <aside>
        <div className="logo">
          <div className="logo-badge"></div>
          <div className="hide-compact">СтройКонтроль</div>
        </div>
        <div className="side-section">
          <div className="side-title">Навигация</div>
          <nav className="nav">
            <NavLink className={({isActive})=>isActive?'active':''} to="/objects">Объекты</NavLink>
            <NavLink className={({isActive})=>isActive?'active':''} to="/work-plans/new">Перечень работ</NavLink>
            <NavLink className={({isActive})=>isActive?'active':''} to="/daily-checklist">Ежедневный чек-лист</NavLink>
          </nav>
        </div>
        <div className="side-section">
          <div className="side-title">Профиль</div>
          {user ? (
            <div className="nav">
              <div className="pill">{user.full_name} — {user.role}</div>
              <button className="btn ghost" onClick={logout}>Выйти</button>
            </div>
          ) : null}
        </div>
      </aside>
      <div>
        <header>
          <div className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m21 21-4.3-4.3" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="11" r="7" stroke="#6b7280" strokeWidth="2" fill="none"/></svg>
            <input placeholder="Поиск по объектам, актам, замечаниям…" />
          </div>
          {user ? <button className="btn ghost" onClick={logout}>Выйти</button> : null}
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}

function Protected({ children }){
  const { user } = useAuth()
  const location = useLocation()
  if(!user) return <Navigate to="/login" replace state={{ from: location }} />
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
        <Route path="/work-plans/new" element={<Protected><Layout><WorkPlanForm/></Layout></Protected>} />
        <Route path="/daily-checklist" element={<Protected><Layout><DailyChecklist/></Layout></Protected>} />
        <Route path="*" element={<Navigate to="/objects" />} />
      </Routes>
    </AuthProvider>
  )
}
