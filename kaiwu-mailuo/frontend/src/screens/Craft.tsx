import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store'
import { CRAFT_PANEL_IMAGES, IMG_META, FALLBACK_IMG } from '../images'
import Lightbox from '../components/Lightbox'
import SpeakButton from '../components/SpeakButton'

type View = 'auto' | 'ancient' | 'modern' | 'why'

export default function Craft({ onGoto }: { onGoto: (tab: 'qa') => void }) {
  const { content, signal, craftQi, setCraftQi, setQaContext } = useApp()
  const [qi, setQi] = useState(0)
  const [pos, setPos] = useState(0)
  const [view, setView] = useState<View>('auto')
  const [lightboxImg, setLightboxImg] = useState<{ src: string; credit: string; license: string; page: string } | null>(null)

  const questions = content?.questions ?? []
  const q = questions[qi]

  const answered = useMemo(() => new Set<string>(), [])
  const era = pos < 50 ? 'ancient' : 'modern'
  const shown = view === 'auto' ? era : view

  // 其他页面（首页阶段卡）跳转时定位到指定问题
  useEffect(() => {
    if (craftQi == null) return
    setQi(craftQi)
    setPos(craftQi % 2 === 0 ? 0 : 100)
    setView('auto')
    window.scrollTo(0, 0)
    setCraftQi(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftQi])

  useEffect(() => {
    if (q) signal({ question_id: q.id, signal_type: 'action_click', detail: `craft_q_${q.id}` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi])

  if (!q) return <div className="page" />

  const ancientNodes = content?.nodes.filter((n) => n.era === 'ancient' && n.question_ids.includes(q.id)) ?? []
  const modernNodes = content?.nodes.filter((n) => n.era === 'modern' && n.question_ids.includes(q.id)) ?? []
  const eraNodes = shown === 'ancient' ? ancientNodes : modernNodes
  const panelName = shown === 'why' ? 'm2' : (CRAFT_PANEL_IMAGES[q.id]?.[shown] ?? 'm2')
  const panelImg = IMG_META[panelName] ?? FALLBACK_IMG
  const eraAnswer = shown === 'ancient' ? q.ancient_answer_short : q.modern_answer_short

  return (
    <div className="page">
      <div className="q-head">
        <span className="q-code">造物 {q.code}</span>
        <h2 className="q-title">{q.title}</h2>
        <p className="q-essence">{q.essence}</p>
      </div>

      <div className="slider-block">
        <div className="slider-ends">
          <span className="end-ancient">明代 · 凤凰山</span>
          <span className="end-modern">今天 · 新钢</span>
        </div>
        <input
          type="range" min={0} max={100} value={pos}
          onChange={(e) => { setPos(Number(e.target.value)); setView('auto') }}
          aria-label="时间轴"
        />
        <div className="q-seg">
          <button className={view === 'auto' ? 'active' : ''} onClick={() => setView('auto')}>跟随时间轴</button>
          <button className={view === 'ancient' ? 'active' : ''} onClick={() => setView('ancient')}>古</button>
          <button className={view === 'modern' ? 'active' : ''} onClick={() => setView('modern')}>今</button>
          <button className={view === 'why' ? 'active' : ''} onClick={() => setView('why')}>变</button>
        </div>
      </div>

      {shown !== 'why' ? (
        <div key={`${q.id}-${shown}`} className={`era-panel ${shown}`}>
          <img
            className="era-img clickable"
            src={panelImg.src}
            alt={q.title}
            onClick={() => setLightboxImg(panelImg)}
          />
          <span className="e-tag">{shown === 'ancient' ? '古' : '今'} · {panelImg.credit}</span>
          <div className="era-answer">
            {eraAnswer}
            <SpeakButton text={eraAnswer} />
          </div>
          <ul className="era-points">
            {eraNodes.map((n) => (
              <li key={n.id}><b>{n.title}</b>　{n.summary}</li>
            ))}
          </ul>
          <button
            className="panel-link"
            onClick={() => { setQaContext(q.id); onGoto('qa') }}
          >再问一句 →</button>
        </div>
      ) : (
        <div key={`${q.id}-why`} className="why-block">
          <div className="why-duo">
            <figure>
              <img
                className="clickable"
                src={IMG_META[CRAFT_PANEL_IMAGES[q.id]?.ancient ?? 'a1']?.src ?? ''}
                alt="古"
                onClick={() => setLightboxImg(IMG_META[CRAFT_PANEL_IMAGES[q.id]?.ancient ?? 'a1'] ?? null)}
              />
              <figcaption>古 · {q.code}</figcaption>
            </figure>
            <span className="why-arrow">→</span>
            <figure>
              <img
                className="clickable"
                src={IMG_META[CRAFT_PANEL_IMAGES[q.id]?.modern ?? 'm1']?.src ?? ''}
                alt="今"
                onClick={() => setLightboxImg(IMG_META[CRAFT_PANEL_IMAGES[q.id]?.modern ?? 'm1'] ?? null)}
              />
              <figcaption>今 · 新钢</figcaption>
            </figure>
          </div>
          <div className="why-plain">
            <span className="w-tag">变 · 为什么不一样了</span>
            <p>{q.why_changed}</p>
            <SpeakButton text={q.why_changed} />
          </div>
        </div>
      )}

      {/* 步骤节点轴：左 1·3·5·7，右 2·4·6 */}
      <div className="q-axis">
        {questions.map((qq, i) => {
          const side = i % 2 === 0 ? 'left' : 'right'
          return (
            <button
              key={qq.id}
              className={`q-node ${side} ${i === qi ? 'active' : ''} ${answered.has(qq.id) ? 'answered' : ''}`}
              onClick={() => { setQi(i); setView('auto'); setPos(i % 2 === 0 ? 0 : 100) }}
            >
              <span className="qn-dot" />
              <span className="qn-body">
                <b>{qq.code}</b>
                <i>{qq.title}</i>
              </span>
            </button>
          )
        })}
      </div>

      {lightboxImg && (
        <Lightbox img={{ ...lightboxImg, src: lightboxImg.src }} onClose={() => setLightboxImg(null)} />
      )}
    </div>
  )
}
