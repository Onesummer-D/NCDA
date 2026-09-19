import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../store'
import { api, type ObservationTask, type RecoResponse, type SpectrumResponse } from '../api'
import { NODE_IMAGES, FALLBACK_IMG, type ImgMeta } from '../images'
import Lightbox from '../components/Lightbox'
import SpeakButton from '../components/SpeakButton'

/** 从推荐理由推断依据类型，驱动卡片徽章（Gap Engine 的可解释性外显） */
function reasonFlag(reasons: string[]): { label: string; hot: boolean } {
  if (reasons.some((r) => r.startsWith('命中理解断点'))) return { label: '补断点', hot: true }
  if (reasons.some((r) => r.includes('负担调节'))) return { label: '减负担', hot: false }
  if (reasons.some((r) => r.includes('当前工艺节点'))) return { label: '顺当前', hot: false }
  return { label: '讲解序列', hot: false }
}

export default function Walk({ onGoto }: { onGoto: (tab: 'qa' | 'spectrum') => void }) {
  const { content, session, signal, evidenceTitle, favorites, toggleFav, walkNodeId, setWalkNodeId } = useApp()
  const [current, setCurrent] = useState('A1')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [reco, setReco] = useState<RecoResponse | null>(null)
  const [spec, setSpec] = useState<SpectrumResponse | null>(null)
  const [stage, setStage] = useState<'observe' | 'quiz'>('observe')
  const [lightbox, setLightbox] = useState(false)

  const nodes = content?.nodes ?? []
  const node = nodes.find((n) => n.id === current)
  const task: ObservationTask | undefined = content?.tasks.find((t) => t.node_id === current)

  const refreshReco = useCallback(async (nodeId: string) => {
    if (session.id == null) return
    const r = await api.recommend(session.id, nodeId)
    setReco(r)
  }, [session.id])

  const refreshSpec = useCallback(async () => {
    if (session.id == null) return
    try { setSpec(await api.spectrum(session.id)) } catch { /* 未开始会话时忽略 */ }
  }, [session.id])

  useEffect(() => {
    if (session.id == null || !current) return
    signal({ node_id: current, signal_type: 'visit' })
    setPicked(null)
    setStage('observe')
    refreshReco(current)
    refreshSpec()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, session.id])

  // 从收藏/菜单跳到指定节点
  useEffect(() => {
    if (walkNodeId == null) return
    setCurrent(walkNodeId)
    setExpanded(null)
    window.scrollTo(0, 0)
    setWalkNodeId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkNodeId])

  if (!node) return <div className="page" />

  const pickOption = (i: number) => {
    if (picked !== null || !task) return
    setPicked(i)
    const correct = task.correct_index === i
    signal({
      node_id: node.id, task_id: task.id, signal_type: 'task_answer',
      correct, gap_topic: correct ? null : task.gap_topic_on_wrong,
    })
    refreshReco(node.id)
    refreshSpec()
  }

  const chain = [...nodes].sort((a, b) => (a.era === b.era ? a.id.localeCompare(b.id) : a.era === 'ancient' ? -1 : 1))
  const modernChain = chain.filter((n) => n.era === 'modern')
  const idx = modernChain.findIndex((n) => n.id === current)
  const nextModern = idx >= 0 && idx + 1 < modernChain.length ? modernChain[idx + 1] : null
  const lastWrong = picked !== null && task && picked !== task.correct_index
  const img: ImgMeta = NODE_IMAGES[node.id] ?? FALLBACK_IMG
  const mainEvidence = node.evidence_ids[0]
  const fav = favorites.includes(node.id)

  return (
    <div className="page">
      {lightbox && <Lightbox img={img} onClose={() => setLightbox(false)} />}
      <div className="node-media">
        <img src={img.src} alt={node.title} onClick={() => setLightbox(true)} style={{ cursor: 'zoom-in' }} />
      </div>
      <div className="nm-actions">
        <button className="nm-btn" onClick={() => setLightbox(true)} aria-label="放大查看">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.8-4.8" />
            <path d="M10.5 7.8v5.4M7.8 10.5h5.4" />
          </svg>
        </button>
        <a className="nm-btn" href={img.src} download={`kaiwu-${node.id}.jpg`} aria-label="下载图片">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v10" />
            <path d="M8 10.5l4 4 4-4" />
            <path d="M4.5 19.5h15" />
          </svg>
        </a>
        <button
          className={`nm-btn ${fav ? 'faved' : ''}`}
          onClick={() => toggleFav(node.id)}
          aria-label={fav ? '取消收藏' : '收藏这个地点'}
          title={fav ? '取消收藏' : '收藏这个地点'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z" />
          </svg>
        </button>
      </div>
      <a className="src-block" href={img.page} target="_blank" rel="noreferrer">
        <img className="src-thumb" src={img.src} alt="" />
        <span className="src-main">
          <span className="src-pub">{mainEvidence ? evidenceTitle(mainEvidence) : '开物脉络内容库'}</span>
        </span>
        <span className="src-tag">{img.page.includes('wikimedia') ? 'Wikimedia Commons' : img.page.includes('cctv') ? '央视网' : '新余市博物馆'}</span>
      </a>
      <div className="node-head" style={{ marginTop: 18 }}>
        <h2 className="node-title">{node.title}</h2>
        <p className="node-summary">{node.summary}</p>
      </div>

      {node.is_observation_point && task && (
        stage === 'observe' ? (
          <div className="observe">
            <div className="o-eyebrow">观察</div>
            <div className="o-text">{task.prompt.replace(/^观察提示：/, '').replace(/^观察任务：/, '')}</div>
            <SpeakButton text={task.prompt} dark />
            <div className="o-actions">
              {task.mode === 'choice' ? (
                <button className="o-btn primary" onClick={() => setStage('quiz')}>继续</button>
              ) : (
                <button className="o-btn primary" onClick={() => {
                  signal({ node_id: node.id, task_id: task.id, signal_type: 'task_answer', correct: null, detail: task.expected_signal_correct })
                  refreshReco(node.id)
                  refreshSpec()
                }}>记录</button>
              )}
            </div>
          </div>
        ) : (
          <div className="quiz">
            {task.options.map((opt, i) => (
              <button
                key={i}
                className={`quiz-option ${picked === i ? (task.correct_index === i ? 'picked-correct' : 'picked-wrong') : picked !== null ? 'dim' : ''}`}
                onClick={() => pickOption(i)}
              >
                <span className="opt-key">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )
      )}

      {lastWrong && (
        <div className="gap-flag">理解断点 · 炼铁 → 炼钢</div>
      )}
      {picked !== null && task && picked === task.correct_index && (
        <div className="gap-flag ok-flag">已验证</div>
      )}

      {reco && reco.recommendations.length > 0 && (
        <div className="reco">
          <div className="eyebrow" style={{ marginBottom: 12 }}>补一环</div>
          {reco.recommendations.map((r) => {
            const flag = reasonFlag(r.reasons)
            return (
              <div key={r.id} className="reco-card">
                <div className="r-head">
                  <span className="r-eyebrow">{r.depth === 'deep' ? '深一层' : r.depth === 'intro' ? '先知道' : '核心'}</span>
                  {reco.variant === 'adaptive' && <span className={`r-flag ${flag.hot ? '' : 'quiet'}`}>{flag.label}</span>}
                </div>
                <div className="r-title">{r.title}</div>
                <div className="r-body">{r.body}</div>
                {reco.variant === 'adaptive' && r.reasons.length > 0 && (
                  <div className="r-why">依据 · {r.reasons.join(' / ')}</div>
                )}
                <div className="r-src"><b>来源</b>　{r.source_refs.map(evidenceTitle).join('；')}</div>
              </div>
            )
          })}
        </div>
      )}

      {session.mode === 'school' && content && content.curriculum.some((c) => c.node_id === node.id) && (
        <div className="curriculum">
          <div className="eyebrow" style={{ marginBottom: 6 }}>课堂衔接</div>
          {content.curriculum.filter((c) => c.node_id === node.id).map((c) => (
            <div key={c.id} className="cur-row">
              <span className="c-badge" data-subject={c.subject.slice(0, 2)}>
                {c.subject.slice(0, 1)}
              </span>
              <span className="c-text"><b>{c.subject}</b>　{c.concept} —— {c.hook}</span>
            </div>
          ))}
        </div>
      )}

      {nextModern && (
        <button className="btn-primary next-btn" onClick={() => { setCurrent(nextModern.id); setExpanded(null); window.scrollTo(0, 0) }}>
          下一站 · {nextModern.title}
        </button>
      )}

      <div className="chain">
        <div className="eyebrow" style={{ marginBottom: 6 }}>工艺链</div>
        {chain.map((n) => (
          <div key={n.id}>
            <button
              className={`chain-row ${n.era} ${n.id === current ? 'current' : ''}`}
              onClick={() => { setCurrent(n.id); setExpanded(n.id === expanded ? null : n.id); window.scrollTo(0, 0) }}
            >
              <span className="ch-id">{n.id}</span>
              <span className="ch-name">{n.title}</span>
              {n.is_observation_point && <span className="ch-obs" title="观察点" />}
              <span className="ch-stage">{n.stage}</span>
              {spec && <span className={`ch-state ${spec.states[n.id] ?? 'unseen'}`} title="开物谱状态" />}
            </button>
            {expanded === n.id && (
              <ul className="node-detail">
                {n.details.map((d, i) => <li key={i}>{d}</li>)}
                <li style={{ color: 'var(--ink-3)' }}>来源：{n.evidence_ids.map(evidenceTitle).join('；')}</li>
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="actions" style={{ marginTop: 26 }}>
        <button className="btn-ghost" onClick={() => onGoto('spectrum')}>开物谱</button>
        <button className="btn-ghost" onClick={() => onGoto('qa')}>追问</button>
      </div>
    </div>
  )
}
