import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { browseViolationFiles, browseForemanFiles } from '../api/api.js'

export default function FileStorage() {
  const { user } = useAuth()
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [fullStructure, setFullStructure] = useState(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    setError('')
    try {
      let data
      if (user?.role === 'foreman') {
        data = await browseForemanFiles(user.id)
      } else if (user?.role === 'ssk') {
        data = await browseViolationFiles('ССК', user.id)
      } else if (user?.role === 'iko') {
        data = await browseViolationFiles('ИКО', user.id)
      } else {
        throw new Error('Недостаточно прав для доступа к файловому хранилищу')
      }
      
      setFullStructure(data)
      setFiles(data.children || [])
      setCurrentPath(data.path || '')
      setBreadcrumbs([{ name: data.name || 'Корневая папка', path: data.path || '' }])
    } catch (err) {
      console.error('[file storage] error:', err)
      if (err.message.includes('422')) {
        setError('Недостаточно прав для доступа к файловому хранилищу или неверные параметры запроса')
      } else if (err.message.includes('401')) {
        setError('Требуется авторизация для доступа к файловому хранилищу')
      } else if (err.message.includes('403')) {
        setError('Доступ к файловому хранилищу запрещен')
      } else if (err.message.includes('404')) {
        setError('Файловое хранилище не найдено')
      } else {
        setError(err.message || 'Ошибка загрузки файлов')
      }
    } finally {
      setLoading(false)
    }
  }

  const navigateToPath = (path) => {
    console.log('[file storage] navigating to path:', path)
    
    if (!fullStructure) {
      console.error('[file storage] no structure loaded')
      return
    }
    
    // Если это корневая папка
    if (!path || path === '') {
      setFiles(fullStructure.children || [])
      setCurrentPath(fullStructure.path || '')
      updateBreadcrumbs(fullStructure.path || '')
      return
    }
    
    // Ищем папку в структуре
    const targetFolder = findFolderInStructure(fullStructure, path)
    
    if (targetFolder) {
      console.log('[file storage] found folder:', targetFolder)
      setFiles(targetFolder.children || [])
      setCurrentPath(targetFolder.path || '')
      updateBreadcrumbs(targetFolder.path || '')
    } else {
      console.error('[file storage] folder not found:', path)
      setError('Папка не найдена')
    }
  }

  const findFolderInStructure = (structure, targetPath) => {
    if (!structure || !targetPath) return null
    
    // Если это корневая папка
    if (structure.path === targetPath) {
      return structure
    }
    
    // Рекурсивно ищем в дочерних элементах
    if (structure.children) {
      for (const child of structure.children) {
        if (child.type === 'dir' && child.path === targetPath) {
          return child
        }
        if (child.children) {
          const found = findFolderInStructure(child, targetPath)
          if (found) return found
        }
      }
    }
    
    return null
  }

  const isValidPath = (path) => {
    if (!path || !fullStructure) return false
    return findFolderInStructure(fullStructure, path) !== null
  }

  const updateBreadcrumbs = (path) => {
    if (!path) {
      setBreadcrumbs([{ name: 'Корневая папка', path: '' }])
      return
    }
    
    // Создаем хлебные крошки на основе реальных путей в структуре
    const crumbs = [{ name: 'Корневая папка', path: '' }]
    
    // Находим все папки на пути к текущей
    const buildBreadcrumbs = (structure, targetPath, currentCrumbs = []) => {
      if (!structure || !structure.children) return null
      
      for (const child of structure.children) {
        if (child.type === 'dir') {
          const newCrumbs = [...currentCrumbs, { name: child.name, path: child.path }]
          
          if (child.path === targetPath) {
            return newCrumbs
          }
          
          if (child.children) {
            const result = buildBreadcrumbs(child, targetPath, newCrumbs)
            if (result) return result
          }
        }
      }
      return null
    }
    
    const foundCrumbs = buildBreadcrumbs(fullStructure, path)
    if (foundCrumbs) {
      setBreadcrumbs([{ name: 'Корневая папка', path: '' }, ...foundCrumbs])
    } else {
      // Fallback - простое разбиение пути
      const parts = path.split('/').filter(Boolean)
      const simpleCrumbs = [{ name: 'Корневая папка', path: '' }]
      
      let currentPath = ''
      parts.forEach(part => {
        currentPath += (currentPath ? '/' : '') + part
        simpleCrumbs.push({ name: part, path: currentPath })
      })
      
      setBreadcrumbs(simpleCrumbs)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      zip: '📦',
      rar: '📦',
      txt: '📄',
      csv: '📊'
    }
    return iconMap[ext] || '📄'
  }

  const handleFileClick = (file) => {
    if (file.type === 'dir') {
      console.log('[file storage] navigating to path:', file.path)
      setError('') // Очищаем ошибки при навигации
      navigateToPath(file.path)
    } else if (file.presigned_url) {
      window.open(file.presigned_url, '_blank')
    } else if (file.url) {
      window.open(file.url, '_blank')
    }
  }

  const handleBreadcrumbClick = (path) => {
    console.log('[file storage] breadcrumb click:', path, 'isValid:', isValidPath(path))
    if (isValidPath(path) || path === '') {
      navigateToPath(path)
    } else {
      console.warn('[file storage] invalid breadcrumb path:', path)
    }
  }

  return (
    <div className="page">

      {/* Хлебные крошки */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            )}
            <button
              onClick={() => handleBreadcrumbClick(crumb.path)}
              disabled={!isValidPath(crumb.path) && crumb.path !== ''}
              style={{
                background: 'none',
                border: 'none',
                color: index === breadcrumbs.length - 1 ? 'var(--text)' : 
                       (!isValidPath(crumb.path) && crumb.path !== '') ? 'var(--muted)' : 'var(--brand)',
                cursor: (index === breadcrumbs.length - 1 || (!isValidPath(crumb.path) && crumb.path !== '')) ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: index === breadcrumbs.length - 1 ? '600' : '400',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                opacity: (!isValidPath(crumb.path) && crumb.path !== '') ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (index !== breadcrumbs.length - 1 && isValidPath(crumb.path)) {
                  e.target.style.background = 'var(--bg-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                if (index !== breadcrumbs.length - 1 && isValidPath(crumb.path)) {
                  e.target.style.background = 'none'
                }
              }}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Ошибка */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
            <button
              onClick={loadFiles}
              disabled={loading}
              style={{
                padding: '6px 12px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#b91c1c'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = '#dc2626'
                }
              }}
            >
              Обновить
            </button>
          </div>
        </div>
      )}

      {/* Список файлов */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--muted)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border)',
              borderTop: '3px solid var(--brand)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            Загрузка файлов...
          </div>
        ) : files.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--muted)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'var(--bg-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px'
            }}>
              📁
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)', fontSize: '18px', fontWeight: '600' }}>
              Папка пуста
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              В этой папке пока нет файлов
            </p>
          </div>
        ) : (
          <div>
            {/* Заголовок таблицы */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto auto',
              gap: '16px',
              padding: '16px 20px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div style={{ width: '24px' }}></div>
              <div>Имя</div>
              <div style={{ textAlign: 'right' }}>Размер</div>
              <div style={{ textAlign: 'right' }}>Изменен</div>
              <div style={{ width: '40px' }}></div>
            </div>

            {/* Список файлов */}
            {files.map((file, index) => (
              <div
                key={index}
                onClick={() => handleFileClick(file)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto auto',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: index < files.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                <div style={{ fontSize: '20px' }}>
                  {file.type === 'dir' ? '📁' : getFileIcon(file.name)}
                </div>
                <div>
                  <div style={{
                    fontWeight: '500',
                    color: 'var(--text)',
                    marginBottom: '2px'
                  }}>
                    {file.name}
                  </div>
                  {file.type === 'dir' && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)'
                    }}>
                      Папка
                    </div>
                  )}
                </div>
                <div style={{
                  textAlign: 'right',
                  fontSize: '13px',
                  color: 'var(--muted)'
                }}>
                  {file.type === 'dir' ? '—' : formatFileSize(file.size)}
                </div>
                <div style={{
                  textAlign: 'right',
                  fontSize: '13px',
                  color: 'var(--muted)'
                }}>
                  {formatDate(file.last_modified)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {file.type === 'dir' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15,3 21,3 21,9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}