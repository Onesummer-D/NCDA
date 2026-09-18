import { useMemo, useState } from 'react'
import { useApp } from '../store'

export default function Craft() {
  const { content, signal } = useApp()
  const [qi, setQi] = useState(0)
  const [pos, setPos] = useState(0)
  const [view, setView] = useState<'auto' | 'ancient' | 'modern' | 'why'>('auto')

  const questions = content?.questions ?? []
  const q = questions[qi]

  const answered = useMemo(() => new Set<string>(), [])
  const era = pos < 50 ? 'ancient' : 'modern'
  const shown = view === 'auto' ? era : view

  if (!q) return <div className="page" />

  const pick = (i: number) => {
    setQi(i)
    setView('auto')
    setPos(i % 2 === 0 ? 0 : 100)
    if (!answered.has(q.id)) {
      answered.add(q.id)
      signal({ question_id: q.id, signal_type: 'action_click', detail: `craft_q_${q.id}` })
    }
  }

  const ancientNodes = content?.nodes.filter((n) => n.era === 'ancient' && n.question_ids.includes(q.id)) ?? []
  const modernNodes = content?.nodes.filter((n) => n.era === 'modern' && n.question_ids.includes(q.id)) ?? []

  return (
    <div className="page">
      <div className="q-head">
        <span className="q-code">造物 {q.code}</span>
        <h2 className="q-title">{q.title}</h2>
        <p className="q-essence">{q.essence}</p>
      </div>

      <div className="slider-block">
        <div className="slider-ends"><span>明代 · 凤凰山</span><span>今天 · 新钢</span></div>
        <input
          type="range" min={0} max={100} value={pos}
          onChange={(e) => { setPos(Number(e.target.value)); setView('auto') }}
          aria-label="时间轴"
        />
      </div>

      {shown !== 'why' ? (
        <div className={`era-panel ${era}`}>
          <span className="e-tag">{era === 'ancient' ? '古' : '今'}</span>
          <div className="era-answer">{era === 'ancient' ? q.ancient_answer_short : q.modern_answer_short}</div>
          <ul className="era-points">
            {(era === 'ancient' ? ancientNodes : modernNodes).map((n) => (
              <li key={n.id}><b>{n.title}</b>　{n.summary}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="why-panel">
          <span className="e-tag" style={{ color: 'var(--accent)' }}>变</span>
          <div className="w-text">{q.why_changed}</div>
        </div>
      )}

      <div className="q-dots">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            className={`${i === qi ? 'active' : ''} ${answered.has(qq.id) ? 'answered' : ''}`}
            onClick={() => pick(i)}
          >{qq.code}</button>
        ))}
      </div>
    </div>
  )
}
