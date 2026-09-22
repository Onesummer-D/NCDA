import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'

/** 右上角圆形头像 + 下拉菜单（登录 / 分享海报 / 收藏 / 昵称 / 教师控制台） */
export default function AvatarMenu({ onShare }: { onShare: () => void }) {
  const { user, setUser, favorites, content, setWalkNodeId, logout } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const favNodes = favorites
    .map((id) => ({ id, title: content?.nodes.find((n) => n.id === id)?.title ?? id }))

  const rename = () => {
    if (!user) return
    const name = window.prompt('修改昵称', user.name)
    if (name && name.trim()) setUser({ ...user, name: name.trim() })
  }

  const gotoFav = (id: string) => {
    setWalkNodeId(id)
    location.hash = '#/walk'
    setOpen(false)
  }

  return (
    <div className="avatar-wrap" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen((o) => !o)} aria-label="个人中心">
        <span className="avatar-circle">{user ? user.name.slice(0, 1) : '客'}</span>
        <span className="avatar-dots" aria-hidden>⋮</span>
      </button>
      {open && (
        <div className="avatar-menu">
          {user ? (
            <>
              <div className="am-head">
                <span className="am-name">{user.name}</span>
                <span className="am-role">{user.role === 'teacher' ? '老师' : '学生'}</span>
              </div>
              <button className="am-item" onClick={() => { setOpen(false); onShare() }}>分享研学海报</button>
              <div className="am-item am-static">
                收藏地点{favNodes.length ? `（${favNodes.length}）` : '（空）'}
                {favNodes.length > 0 && favNodes.map((f) => (
                  <button key={f.id} className="am-fav" onClick={() => gotoFav(f.id)}>{f.title}</button>
                ))}
              </div>
              <button className="am-item" onClick={() => { setOpen(false); rename() }}>修改昵称</button>
              {user.role === 'teacher' && (
                <a className="am-item" href="#/teacher" onClick={() => setOpen(false)}>教师控制台</a>
              )}
              <button
                className="am-item am-quit"
                onClick={() => {
                  logout()
                  setOpen(false)
                  // 回到登录页：#/login 时 App 会卸载当前 Shell 并重挂全新 Provider
                  location.hash = '#/login'
                }}
              >退出登录</button>
            </>
          ) : (
            <>
              <div className="am-head"><span className="am-name">游客</span><span className="am-role">未登录</span></div>
              <a className="am-item" href="#/login" onClick={() => setOpen(false)}>登录 / 注册</a>
              <button className="am-item" onClick={() => { setOpen(false); onShare() }}>分享研学海报</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
