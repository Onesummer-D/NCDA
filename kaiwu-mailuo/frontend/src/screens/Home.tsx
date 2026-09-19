import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { HERO_SLIDES } from '../images'

const MODES = [
  { key: 'casual', title: '轻松看看', desc: '古今故事 · 基础导览', swatch: '#96692a', glyph: '谈' },
  { key: 'curious', title: '想看懂', desc: '认知导航 · 工艺因果', swatch: '#38617d', glyph: '析' },
  { key: 'school', title: '学校研学', desc: '观察任务 · 课堂衔接 · 教师反馈', swatch: '#b8432c', glyph: '研' },
]

export default function Home({ mode, onMode, onEnter }: {
  mode: string
  onMode: (m: string) => void
  onEnter: (tab: 'craft' | 'walk' | 'spectrum' | 'qa') => void
}) {
  const { content, session, startSession, setQaSeed, setCraftQi } = useApp()
  const [variant, setVariant] = useState('adaptive')
  const [starting, setStarting] = useState(false)
  const [slide, setSlide] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)

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

  // hero 自动轮播（首帧停留 8s，之后每 5.2s 翻页）
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => {
      iv = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5200)
    }, 8000)
    return () => { clearTimeout(t); if (iv) clearInterval(iv) }
  }, [])

  const scrollStrip = (dx: number) => stripRef.current?.scrollBy({ left: dx, behavior: 'smooth' })

  const qCount = content?.questions.length ?? 0
  const nAncient = content?.nodes.filter((n) => n.era === 'ancient').length ?? 0
  const nModern = content?.nodes.filter((n) => n.era === 'modern').length ?? 0

  // 阶段横滑卡：每道造物问配一张图（古法木刻优先）
  const questions = content?.questions ?? []

  return (
    <div className="page" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div className="hero-carousel" style={{ margin: '0 22px' }}>
        <div className="hc-viewport">
          <div className="hc-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {HERO_SLIDES.map((s) => (
              <div key={s.src} className="hc-slide">
                <img src={s.src} alt={s.title} />
                <span className="hc-credit">{s.license}</span>
                <div className="hc-info">
                  <div className="hc-eyebrow">{s.eyebrow}</div>
                  <div className="hc-title">{s.title}</div>
                  <button className="hc-link" onClick={() => onEnter(s.tab)}>了解更多 →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="hc-arrow left" aria-label="上一张" onClick={() => setSlide((slide + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}>‹</button>
        <button className="hc-arrow right" aria-label="下一张" onClick={() => setSlide((slide + 1) % HERO_SLIDES.length)}>›</button>
        <div className="hc-dots">
          {HERO_SLIDES.map((_, i) => <i key={i} className={i === slide ? 'on' : ''} />)}
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        <div className="modes">
          <div className="eyebrow modes-label">选择你的参观方式 · 界面会随之变化</div>
          {MODES.map((m) => (
            <button key={m.key} className={`mode-card ${mode === m.key ? 'selected' : ''}`} onClick={() => onMode(m.key)}>
              <span className="m-swatch" style={{ background: m.swatch }}>{m.glyph}</span>
              <span className="m-body">
                <span className="m-title">{m.title}</span>
                <span className="m-desc" style={{ display: 'block' }}>{m.desc}</span>
              </span>
              <span className="m-check">✓</span>
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
      </div>

      <div style={{ marginTop: 34, paddingLeft: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>按工艺阶段逛 · 左右滑动</div>
        <div className="strip-wrap">
          <div className="strip" ref={stripRef}>
            {(content?.questions ?? []).map((q) => {
              const nodes = content?.nodes.filter((n) => n.question_ids.includes(q.id)) ?? []
              const pick = nodes.find((n) => n.era === 'ancient') ?? nodes[0]
              const qi = questions.indexOf(q)
              return (
                <button
                  key={q.id}
                  className="strip-card"
                  onClick={() => { setCraftQi(qi); onEnter('craft') }}
                >
                  {pick?.id && <img src={`/images/${pick.id}.jpg`} alt={q.title} loading="lazy" />}
                  <span className="strip-title">
                    <b>{q.code}</b>
                    <span>{q.title}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <button className="strip-arrow" aria-label="向右滑动" onClick={() => scrollStrip(300)}>›</button>
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        {questions.length > 0 && (
          <div className="test-card">
            <img src="/images/m2.jpg" alt="高炉" loading="lazy" />
            <div className="test-body">
              <span className="test-tag">考考你</span>
              <div className="test-q">高炉里出来的，已经是能做汽车的钢了吗？</div>
              <button
                className="test-link"
                onClick={() => { setQaSeed('铁和钢到底有什么区别？'); onEnter('qa') }}
              >看看答案 ↗</button>
            </div>
          </div>
        )}

        <div className="ab-row">
          <span className="t-fine">分组</span>
          <select value={variant} onChange={(e) => setVariant(e.target.value)} aria-label="测试分组">
            <option value="adaptive">B · 缺口感知</option>
            <option value="fixed">A · 固定序列</option>
          </select>
        </div>

        <div className="t-fine" style={{ textAlign: 'center', marginTop: 26, letterSpacing: '0.12em' }}>
          {qCount} 问 · {nAncient} 古 · {nModern} 今 · {content?.edges.length ?? 0} 缘
        </div>
        <div className="t-fine" style={{ textAlign: 'center', marginTop: 10, letterSpacing: 0 }}>
          图片来源 Wikimedia Commons，授权信息见各页图注
        </div>
      </div>
    </div>
  )
}
