import { useState } from 'react'
import { useApp } from '../store'

const MODES = [
  { key: 'casual', title: '轻松看看', desc: '古今故事 · 基础导览' },
  { key: 'curious', title: '想看懂', desc: '认知导航 · 工艺因果' },
  { key: 'school', title: '学校研学', desc: '观察任务 · 课堂衔接 · 教师反馈' },
]

export default function Home({ onEnter }: { onEnter: (tab: 'craft' | 'walk') => void }) {
  const { content, session, startSession } = useApp()
  const [mode, setMode] = useState('school')
  const [variant, setVariant] = useState('adaptive')
  const [starting, setStarting] = useState(false)

  const start = async (tab: 'craft' | 'walk') => {
    if (session.id != null) { onEnter(tab); return }
    setStarting(true)
    try {
      await startSession(mode, variant)
      onEnter(tab)
    } finally {
      setStarting(false)
    }
  }

  const qCount = content?.questions.length ?? 0
  const nAncient = content?.nodes.filter((n) => n.era === 'ancient').length ?? 0
  const nModern = content?.nodes.filter((n) => n.era === 'modern').length ?? 0

  return (
    <div className="page">
      <div className="hero">
        <div className="eyebrow accent">工业研学 · 江西新余</div>
        <h1 className="h-display" style={{ marginTop: 20 }}>开物脉络</h1>
        <svg className="mark" viewBox="0 0 300 60" width="240">
          <path d="M22 44 L36 20 L58 16 L70 30 L64 46 L30 48 Z" stroke="#1c1915" strokeWidth="1.4" fill="none" />
          <path d="M118 30 L186 30" stroke="#b8432c" strokeWidth="1.2" strokeDasharray="2 5" />
          <rect x="216" y="24" width="58" height="12" stroke="#3e4a57" strokeWidth="1.4" fill="none" />
          <rect x="216" y="40" width="58" height="6" stroke="#3e4a57" strokeWidth="1.4" fill="none" />
          <path d="M225 24 L225 12 M240 24 L240 12 M255 24 L255 12" stroke="#3e4a57" strokeWidth="1.2" />
        </svg>
        <div className="slogan">一块铁 · 近四百年</div>
      </div>

      <div className="modes">
        {MODES.map((m) => (
          <button key={m.key} className={`mode-card ${mode === m.key ? 'selected' : ''}`} onClick={() => setMode(m.key)}>
            <span className="m-check">✓</span>
            <span className="m-body">
              <span className="m-title">{m.title}</span>
              <span className="m-desc" style={{ display: 'block' }}>{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="btn-primary accent" disabled={starting} onClick={() => start('craft')}>
          进入
        </button>
        <button className="btn-ghost" onClick={() => start('walk')}>
          直达现场
        </button>
      </div>

      <div className="ab-row">
        <span className="t-fine">分组</span>
        <select value={variant} onChange={(e) => setVariant(e.target.value)} aria-label="测试分组">
          <option value="adaptive">B · 缺口感知</option>
          <option value="fixed">A · 固定序列</option>
        </select>
      </div>

      <div className="t-fine" style={{ textAlign: 'center', marginTop: 26, letterSpacing: '0.15em' }}>
        {qCount} 问 · {nAncient} 古 · {nModern} 今
      </div>
    </div>
  )
}
