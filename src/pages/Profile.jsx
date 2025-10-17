
import React from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getEnv } from '../api/api.js'

export default function Profile(){
  const { user, logout } = useAuth()
  const env = getEnv()
  
  if(!user) return null

  const getRoleInfo = (role) => {
    const roles = {
      'ssk': { name: 'ССК', color: '#10b981', description: 'Служба строительного контроля' },
      'iko': { name: 'ИКО', color: '#3b82f6', description: 'Инженер по контролю качества' },
      'foreman': { name: 'Прораб', color: '#f59e0b', description: 'Прораб строительных работ' },
      'admin': { name: 'Администратор', color: '#8b5cf6', description: 'Системный администратор' }
    }
    return roles[role] || { name: role, color: '#6b7280', description: 'Пользователь системы' }
  }

  const roleInfo = getRoleInfo(user.role)

  return (
    <div className="page">

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text)', fontSize: '1.25rem' }}>Личная информация</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: `linear-gradient(135deg, ${roleInfo.color}, ${roleInfo.color}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>
                {user.full_name || 'Не указано'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Роль в системе:</span>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: `${roleInfo.color}20`,
                color: roleInfo.color,
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: roleInfo.color 
                }}></div>
                {roleInfo.name}
              </div>
            </div>

            <div style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {roleInfo.description}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text)', fontSize: '1.25rem' }}>Системная информация</h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>ID пользователя:</span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {user.id}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>API сервер:</span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {env.api_url}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Режим сборки:</span>
              <span style={{ 
                color: env.build_mode === 'production' ? 'var(--green)' : 'var(--orange)',
                fontWeight: '600',
                textTransform: 'uppercase',
                fontSize: '0.85rem'
              }}>
                {env.build_mode}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Версия приложения:</span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.25rem' }}>Доступные функции</h2>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {user.role === 'ssk' && (
            <>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Управление объектами</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Создание и контроль строительных объектов</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Графики работ</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Планирование и контроль выполнения работ</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Нарушения</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Выписка и контроль нарушений</div>
              </div>
            </>
          )}
          {user.role === 'iko' && (
            <>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Контроль качества</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Проверка качества строительных работ</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Активация объектов</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Активация и завершение объектов</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Посещения</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Планирование и проведение визитов</div>
              </div>
            </>
          )}
          {user.role === 'foreman' && (
            <>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Выполнение работ</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Контроль выполнения строительных работ</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Поставки материалов</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Прием и контроль поставок</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>Исправление нарушений</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Устранение выявленных нарушений</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
