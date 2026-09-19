import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { HERO_SLIDES, CRAFT_CARD_IMAGES, IMG_META } from '../images'

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
  const { content, session, startSession, setCraftQi, setQaContext, user, setUser } = useApp()
  const [starting, setStarting] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)

  // —— 无缝轮播：首尾各克隆一张，播完过渡后瞬时归位 ——
  const n = HERO_SLIDES.length
  const [pos, setPos] = useState(1)                    // 在扩展轨道中的位置
  const [anim, setAnim] = useState(true)
  const extended = [HERO_SLIDES[n - 1], ...HERO_SLIDES, HERO_SLIDES[0]]

  const go = (dir: 1 | -1) => setPos((p) => p + dir)
  const onTrackEnd = () => {
    if (pos === 0) { setAnim(false); setPos(n) }
    else if (pos === n + 1) { setAnim(false); setPos(1) }
  }
  useEffect(() => {
    if (!anim) requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)))
  }, [anim])

  // 自动轮播（首帧停留 8s）
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => {
      iv = setInterval(() => setPos((p) => p + 1), 5200)
    }, 8000)
    return () => { clearTimeout(t); if (iv) clearInterval(iv) }
  }, [])

  const start = async (tab: 'craft' | 'walk') => {
    if (!mode) return
    if (session.id != null) { onEnter(tab); return }
    setStarting(true)
    try {
      await startSession(mode, 'adaptive')
      onEnter(tab)
    } finally {
      setStarting(false)
    }
  }

  const scrollStrip = (dx: number) => stripRef.current?.scrollBy({ left: dx, behavior: 'smooth' })
  const activeDot = ((pos - 1) % n + n) % n

  return (
    <div className="page" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div className="hero-carousel" style={{ margin: '0 22px' }}>
        <div className="hc-viewport">
          <div
            className="hc-track"
            style={{ transform: `translateX(-${pos * 100}%)`, transition: anim ? undefined : 'none' }}
            onTransitionEnd={onTrackEnd}
          >
            {extended.map((s, i) => (
              <div key={i} className="hc-slide">
                <img src={s.src} alt={s.title} draggable={false} />
                <div className="hc-info">
                  <div className="hc-eyebrow">{s.eyebrow}</div>
                  <div className="hc-title">{s.title}</div>
                  <button className="hc-link" onClick={() => onEnter(s.tab)}>了解更多 →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="hc-arrow left" aria-label="上一张" onClick={() => go(-1)}>‹</button>
        <button className="hc-arrow right" aria-label="下一张" onClick={() => go(1)}>›</button>
        <div className="hc-dots">
          {HERO_SLIDES.map((_, i) => <i key={i} className={i === activeDot ? 'on' : ''} />)}
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        <div className="modes">
          <div className="eyebrow modes-label">选择你的参观方式</div>
          {MODES.map((m) => (
            <button
              key={m.key}
              className={`mode-card ${mode === m.key ? 'selected' : ''}`}
              onClick={() => onMode(m.key)}
            >
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
          <button className="btn-primary accent" disabled={starting || !mode} onClick={() => start('craft')}>
            {mode ? '进入' : '先选择一种参观方式'}
          </button>
          <button className="btn-ghost" disabled={!mode} onClick={() => start('walk')}>
            直达现场
          </button>
        </div>
      </div>

      <div style={{ marginTop: 34, paddingLeft: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>按工艺阶段逛 · 左右滑动</div>
        <div className="strip-wrap">
          <div className="strip" ref={stripRef}>
            {(content?.questions ?? []).map((q) => {
              const qi = (content?.questions ?? []).indexOf(q)
              const imgName = CRAFT_CARD_IMAGES[q.id] ?? 'm2'
              return (
                <button
                  key={q.id}
                  className="strip-card"
                  onClick={() => { setCraftQi(qi); onEnter('craft') }}
                >
                  <img src={IMG_META[imgName]?.src ?? `/images/${imgName}.jpg`} alt="" loading="lazy" />
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
        {(content?.questions?.length ?? 0) > 0 && (
          <div className="test-card">
            <img src="/images/m2.jpg" alt="新钢厂区" loading="lazy" />
            <div className="test-body">
              <span className="test-tag">考考你</span>
              <div className="test-q">高炉里出来的，已经是能做汽车的钢了吗？</div>
              <button className="test-link" onClick={() => { setQaContext(null); onEnter('qa') }}>
                去问个明白 ↗
              </button>
            </div>
          </div>
        )}
      </div>

      {/* —— 产品化页脚 —— */}
      <footer className="site-footer">
        <div className="sf-brand">
          <span className="sf-logo">开物脉络</span>
          <span className="sf-tagline">面向新余工业研学的古今工艺认知导航</span>
        </div>
        <p className="sf-about">
          以《天工开物》与凤凰山古铁冶为起点，串起新余钢铁的完整产业链，让每一次参观都变成一场可追问、可验证的造物课。
        </p>
        <div className="sf-links">
          <a href="#/about">关于我们</a>
          <a href="#/about">参观指南</a>
          <a href="#/privacy">隐私政策</a>
          <a href="#/terms">服务条款</a>
          {user ? (
            <button className="sf-user" onClick={() => setUser(null)}>
              {user.name}（{user.role === 'teacher' ? '老师' : '学生'}）· 退出
            </button>
          ) : (
            <a href="#/login">登录 / 注册</a>
          )}
        </div>
        {user?.role === 'teacher' && (
          <a className="sf-teacher" href="#/teacher">进入教师控制台 →</a>
        )}
        <div className="sf-copy">© 2026 开物脉络 · NCDA 天工开物杯参赛作品 · 图片来源见各页图注</div>
      </footer>
    </div>
  )
}
