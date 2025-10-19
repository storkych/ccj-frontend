import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { browseViolationFiles, browseForemanFiles } from '../api/api.js'

export default function FileSelectorModal({ 
  open, 
  onClose, 
  onSelectFiles, 
  allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
  multiple = true 
}) {
  const { user } = useAuth()
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [fullStructure, setFullStructure] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewFiles, setPreviewFiles] = useState([])

  useEffect(() => {
    if (open) {
      loadFiles()
      setSelectedFiles([])
      setPreviewFiles([])
    }
  }, [open])

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
      console.error('[file selector] error:', err)
      setError('Ошибка загрузки файлов: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setLoading(false)
    }
  }

  const navigateToPath = (path) => {
    if (!fullStructure) return
    
    if (!path || path === '') {
      setFiles(fullStructure.children || [])
      setCurrentPath(fullStructure.path || '')
      updateBreadcrumbs(fullStructure.path || '')
      return
    }
    
    const targetFolder = findFolderInStructure(fullStructure, path)
    if (targetFolder) {
      setFiles(targetFolder.children || [])
      setCurrentPath(targetFolder.path || '')
      updateBreadcrumbs(targetFolder.path || '')
    }
  }

  const findFolderInStructure = (structure, targetPath) => {
    if (!structure || !targetPath) return null
    
    if (structure.path === targetPath) {
      return structure
    }
    
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

  const updateBreadcrumbs = (path) => {
    if (!path) {
      setBreadcrumbs([{ name: 'Корневая папка', path: '' }])
      return
    }
    
    const crumbs = [{ name: 'Корневая папка', path: '' }]
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
    }
  }

  const isImageFile = (file) => {
    if (!file.name) return false
    const ext = file.name.toLowerCase().split('.').pop()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  }

  const handleFileClick = (file) => {
    if (file.type === 'dir') {
      navigateToPath(file.path)
    } else if (isImageFile(file)) {
      toggleFileSelection(file)
    }
  }

  const toggleFileSelection = (file) => {
    const isSelected = selectedFiles.some(f => f.path === file.path)
    
    if (isSelected) {
      setSelectedFiles(prev => prev.filter(f => f.path !== file.path))
      setPreviewFiles(prev => prev.filter(f => f.path !== file.path))
    } else {
      if (!multiple && selectedFiles.length > 0) {
        setSelectedFiles([file])
        setPreviewFiles([file])
      } else {
        setSelectedFiles(prev => [...prev, file])
        setPreviewFiles(prev => [...prev, file])
      }
    }
  }

  const handleSelect = () => {
    onSelectFiles(selectedFiles)
    onClose()
  }

  const getFileIcon = (file) => {
    if (file.type === 'dir') return '📁'
    
    const ext = file.name?.toLowerCase().split('.').pop() || ''
    const iconMap = {
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
      'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄',
      'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵'
    }
    return iconMap[ext] || '📄'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        width: '90vw',
        maxWidth: '1200px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Заголовок */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Выберите файлы
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Хлебные крошки */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              )}
              <button
                onClick={() => navigateToPath(crumb.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--brand)',
                  cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
                  fontSize: '14px',
                  fontWeight: index === breadcrumbs.length - 1 ? '600' : '400',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (index !== breadcrumbs.length - 1) {
                    e.target.style.background = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== breadcrumbs.length - 1) {
                    e.target.style.background = 'none'
                  }
                }}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Контент */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Список файлов */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            borderRight: '1px solid var(--border)'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--muted)'
              }}>
                Загрузка файлов...
              </div>
            ) : error ? (
              <div style={{
                color: '#dc2626',
                textAlign: 'center',
                padding: '20px'
              }}>
                {error}
              </div>
            ) : files.length === 0 ? (
              <div style={{
                color: 'var(--muted)',
                textAlign: 'center',
                padding: '20px'
              }}>
                Папка пуста
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => handleFileClick(file)}
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: file.type === 'dir' || isImageFile(file) ? 'pointer' : 'default',
                      background: selectedFiles.some(f => f.path === file.path) ? 'var(--brand)' : 'var(--bg)',
                      color: selectedFiles.some(f => f.path === file.path) ? 'white' : 'var(--text)',
                      transition: 'all 0.2s ease',
                      opacity: file.type === 'dir' || isImageFile(file) ? 1 : 0.5
                    }}
                    onMouseEnter={(e) => {
                      if (file.type === 'dir' || isImageFile(file)) {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (file.type === 'dir' || isImageFile(file)) {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{getFileIcon(file)}</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </span>
                    </div>
                    {file.size && (
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7
                      }}>
                        {formatFileSize(file.size)}
                      </div>
                    )}
                    {file.type === 'dir' && (
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7
                      }}>
                        Папка
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Превью выбранных файлов */}
          <div style={{
            width: '300px',
            padding: '20px',
            background: 'var(--bg-secondary)',
            overflowY: 'auto'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Выбранные файлы ({selectedFiles.length})
            </h3>
            
            {previewFiles.length === 0 ? (
              <div style={{
                color: 'var(--muted)',
                textAlign: 'center',
                padding: '20px'
              }}>
                Выберите файлы
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {previewFiles.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      background: 'var(--bg)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{getFileIcon(file)}</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => toggleFileSelection(file)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '14px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Превью изображения */}
                    {isImageFile(file) && (file.presigned_url || file.url) && (
                      <div style={{
                        width: '100%',
                        height: '100px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={file.presigned_url || file.url}
                          alt={file.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--muted)'
          }}>
            {selectedFiles.length} файлов выбрано
          </div>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleSelect}
              disabled={selectedFiles.length === 0}
              style={{
                padding: '8px 16px',
                background: selectedFiles.length === 0 ? 'var(--bg-secondary)' : 'var(--brand)',
                color: selectedFiles.length === 0 ? 'var(--muted)' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Выбрать ({selectedFiles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
