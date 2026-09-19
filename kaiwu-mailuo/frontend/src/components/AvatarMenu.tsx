import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'

/** 右上角圆形头像 + 下拉菜单（登录 / 分享海报 / 收藏 / 昵称 / 教师控制台） */
export default function AvatarMenu({ onShare }: { onShare: () => void }) {
  const { user, setUser, favorites, content } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const favNames = favorites
    .map((id) => content?.nodes.find((n) => n.id === id)?.title)
    .filter(Boolean) as string[]

  const rename = () => {
    if (!user) return
    const name = window.prompt('修改昵称', user.name)
    if (name && name.trim()) setUser({ ...user, name: name.trim() })
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
                收藏地点{favNames.length ? `（${favNames.length}）` : '（空）'}
                {favNames.length > 0 && (
                  <span className="am-favs">{favNames.join(' · ')}</span>
                )}
              </div>
              <button className="am-item" onClick={() => { setOpen(false); rename() }}>修改昵称</button>
              {user.role === 'teacher' && (
                <a className="am-item" href="#/teacher" onClick={() => setOpen(false)}>教师控制台 →</a>
              )}
              <button className="am-item am-quit" onClick={() => { setUser(null); setOpen(false) }}>退出登录</button>
            </>
          ) : (
            <>
              <div className="am-head"><span className="am-name">游客</span><span className="am-role">未登录</span></div>
              <a className="am-item" href="#/login" onClick={() => setOpen(false)}>登录 / 注册</a>
              <button className="am-item" onClick={() => { setOpen(false); onShare() }}>分享研学海报</button>
              <div className="am-item am-static">收藏地点（登录后可用）</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
