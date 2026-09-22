import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../store'
import { api, type ObservationTask, type RecoResponse, type SpectrumResponse } from '../api'
import { NODE_IMAGES, FALLBACK_IMG, type ImgMeta } from '../images'
import { numLabel } from './Spectrum'
import Lightbox from '../components/Lightbox'
import SpeakButton from '../components/SpeakButton'
import SubjectIcon from '../components/SubjectIcon'

/** 答错时的正确答案解析（与后端 GAP_EXPLAIN 一致，离线也可用） */
const GAP_EXPLAIN: Record<string, string> = {
  fe_vs_steel: "高炉出来的是铁水，含碳约 4%，硬而脆；钢的含碳量低于 2%。所以铁水还要进转炉降碳去杂，才能成为钢。",
  why_steelmaking: "炼钢的实质是受控氧化：向铁水中吹氧，把碳和杂质降下来。不炼钢，铁水就只是脆硬的生铁。",
  slab_not_product: "连铸出来的是钢坯，只是中间态；还要经过轧制压延，才能变成板材、线材等最终产品。",
  forming_principle: "锻打和轧制都靠金属在压力下塑性变形——一个是一下一下的锤击，一个是辊缝间的连续压缩，原理相同。",
  ancient_iron_quality: "古人靠反复锻打和控火把杂质挤出、把碳调匀（所谓“千锤百炼”），这与现代提纯的目标一致。",
  huohou: "古人靠看火色（暗红→橙黄→发白）、听风声、观察渣铁流动性来判断炉温，经验就是他们的“测温仪”。",
  knowledge_transfer: "《天工开物》用图文把工艺流程记录下来传给后人，宋应星写书的地方就在新余旁的分宜县。",
  industry_chain: "新余已形成“铁矿采选—炼铁—炼钢—轧材—精深加工”的完整钢铁产业链。",
  safety: "钢厂生产区高温、有机械与介质风险，参观必须走固定路线、由工作人员带领——这是场馆的硬性规定。",
}

export default function Walk({ onGoto }: { onGoto: (tab: 'qa' | 'spectrum') => void }) {
  const { content, session, signal, evidenceTitle, favorites, toggleFav, walkNodeId, setWalkNodeId } = useApp()
  const [current, setCurrent] = useState('A1')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reco, setReco] = useState<RecoResponse | null>(null)
  const [spec, setSpec] = useState<SpectrumResponse | null>(null)
  const [stage, setStage] = useState<'observe' | 'quiz'>('observe')
  const [lightbox, setLightbox] = useState(false)
  const [picked, setPicked] = useState<Record<string, number>>({})

  const nodes = content?.nodes ?? []
  const node = nodes.find((n) => n.id === current)
  const tasks: ObservationTask[] = content?.tasks.filter((t) => t.node_id === current) ?? []

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
    // 等访问记录落库后再拉开物谱/推荐，避免状态点亮滞后
    signal({ node_id: current, signal_type: 'visit' }).then(() => {
      refreshReco(current)
      refreshSpec()
    })
    setPicked({})
    setStage('observe')
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

  const pickOption = (t: ObservationTask, i: number) => {
    if (picked[t.id] !== undefined || t.correct_index == null) return
    setPicked((p) => ({ ...p, [t.id]: i }))
    const correct = t.correct_index === i
    signal({
      node_id: node.id, task_id: t.id, signal_type: 'task_answer',
      correct, gap_topic: correct ? null : t.gap_topic_on_wrong,
    }).then(() => {
      refreshReco(node.id)
      refreshSpec()
    })
  }

  const chain = [...nodes].sort((a, b) => (a.era === b.era ? a.id.localeCompare(b.id) : a.era === 'ancient' ? -1 : 1))
  // 每一站都有"下一站"：沿整条工艺链（古 A1–A5 → 今 M1–M6）顺序推进，末站 M6 除外
  const idxAll = chain.findIndex((n) => n.id === current)
  const nextNode = idxAll >= 0 && idxAll + 1 < chain.length ? chain[idxAll + 1] : null
  const img: ImgMeta = NODE_IMAGES[node.id] ?? FALLBACK_IMG
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
          <span className="src-pub">{img.credit}</span>
        </span>
        <span className="src-tag">图片来源<br />{img.page.includes('wikimedia') ? 'Wikimedia' : img.page.includes('cctv') ? '央视网' : '博物馆'}</span>
      </a>
      <div className="node-head" style={{ marginTop: 18 }}>
        <h2 className="node-title">{node.title}</h2>
        <p className="node-summary">{node.summary}</p>
      </div>

      {/* 轻松看看：只看故事与基础导览，不安排观察任务和答题 */}
      {session.mode !== 'casual' && node.is_observation_point && tasks.length > 0 && (
        stage === 'observe' ? (
          <div className="observe">
            <div className="o-eyebrow">观察</div>
            <div className="o-text">{tasks[0].prompt}</div>
            <SpeakButton text={tasks[0].prompt} dark />
            <div className="o-actions">
              <button className="o-btn primary" onClick={() => setStage('quiz')}>继续</button>
            </div>
          </div>
        ) : (
          <>
            <div className="quiz-recap">
              回到刚才的问题：<b>{tasks[0].prompt.split('\n').pop()?.replace(/^试着回答：/, '')}</b>
            </div>
            {tasks.map((t, qn) => {
              const pick = picked[t.id]
              const questionText = t.prompt.split('\n').pop()?.replace(/^试着回答：/, '')
              return (
                <div key={t.id} className="quiz-block">
                  {qn > 0 && (
                    <div className="quiz-recap"><b>第 {qn + 1} 问</b>　{questionText}</div>
                  )}
                  <div className="quiz">
                    {t.options.map((opt, i) => (
                      <button
                        key={i}
                        className={`quiz-option ${pick === i ? (t.correct_index === i ? 'picked-correct' : 'picked-wrong') : pick !== undefined ? 'dim' : ''}`}
                        onClick={() => pickOption(t, i)}
                      >
                        <span className="opt-key">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                  {pick !== undefined && t.correct_index != null && pick !== t.correct_index && (
                    <>
                      <div className="gap-flag">正确答案：{String.fromCharCode(65 + t.correct_index)}　{t.options[t.correct_index]}</div>
                      <div className="af-explain">{GAP_EXPLAIN[t.gap_topic_on_wrong ?? ''] ?? ''}</div>
                    </>
                  )}
                  {pick !== undefined && pick === t.correct_index && (
                    <div className="gap-flag ok-flag">答对了</div>
                  )}
                </div>
              )
            })}
          </>
        )
      )}

      {/* 轻松看看不展示认知导航；想看懂突出"认知导航"定位 */}
      {reco && reco.recommendations.length > 0 && session.mode !== 'casual' && (
        <div className="reco">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {session.mode === 'curious' ? '补一环 · 认知导航' : '补一环'}
          </div>
          {reco.recommendations.map((r) => (
            <div key={r.id} className="reco-card">
              <div className="r-eyebrow">{r.depth === 'deep' ? '深一层' : r.depth === 'intro' ? '先知道' : '核心'}</div>
              <div className="r-title">{r.title}</div>
              <div className="r-body">{r.body}</div>
              <div className="r-src"><b>来源</b>　{r.source_refs.map(evidenceTitle).join('；')}</div>
            </div>
          ))}
        </div>
      )}

      {session.mode === 'school' && content && content.curriculum.some((c) => c.node_id === node.id) && (
        <div className="curriculum">
          <div className="eyebrow" style={{ marginBottom: 6 }}>课堂衔接</div>
          {content.curriculum.filter((c) => c.node_id === node.id).map((c) => (
            <div key={c.id} className="cur-row">
              <span className="c-badge" data-subject={c.subject.slice(0, 2)}>
                <SubjectIcon subject={c.subject} />
              </span>
              <span className="c-text"><b>{c.subject} · {c.concept}</b>　{c.hook}</span>
            </div>
          ))}
        </div>
      )}

      {nextNode && (
        <button
          className={`btn-primary next-btn ${node.era === 'modern' ? 'modern-next' : ''}`}
          onClick={() => { setCurrent(nextNode.id); setExpanded(null); window.scrollTo(0, 0) }}
        >
          {node.era === 'ancient' && nextNode.era === 'modern'
            ? '穿越四百年 → 去看今天的开物脉络'
            : `下一站 · ${nextNode.title}`}
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
              <span className="ch-id">{numLabel(n.id)}</span>
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
