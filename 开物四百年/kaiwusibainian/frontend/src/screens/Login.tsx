import { useState } from 'react'
import { useApp, type UserInfo } from '../store'
import logoUrl from '../assets/logo-emblem.png'

/** 登录 / 注册（演示级：本地保存身份，区分游客 / 学生 / 老师） */
export default function Login() {
  const { setUser } = useApp()
  const [name, setName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')

  const enter = (u: UserInfo | null) => {
    try { localStorage.setItem('kaiwu_seen_v1', '1') } catch { /* ignore */ }
    setUser(u)
    location.hash = '#/'
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={logoUrl} alt="开物四百年" className="auth-mark" />
          <span className="auth-logo">开物四百年</span>
          <span className="auth-sub">新余工业研学 · 古今工艺认知导航</span>
        </div>

        <label className="auth-label">昵称</label>
        <input
          className="auth-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="怎么称呼你？"
          maxLength={12}
        />

        <label className="auth-label">我的身份</label>
        <div className="auth-roles">
          {[
            { key: 'student', title: '学生', desc: '研学任务 · 开物谱 · 问答' },
            { key: 'teacher', title: '老师', desc: '班级数据 · 教学反馈' },
          ].map((r) => (
            <button
              key={r.key}
              className={`auth-role ${role === r.key ? 'selected' : ''}`}
              onClick={() => setRole(r.key as 'student' | 'teacher')}
            >
              <b>{r.title}</b>
              <span>{r.desc}</span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button
            className="btn-primary accent"
            disabled={!name.trim()}
            onClick={() => enter({ name: name.trim(), role })}
          >进入开物四百年</button>
          <button className="btn-ghost" onClick={() => enter(null)}>先以游客身份逛逛</button>
        </div>
      </div>
    </div>
  )
}
