import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store'
import { api, type ProcessNode, type SpectrumResponse } from '../api'

const REL_COLOR: Record<string, string> = {
  documented_relation: 'var(--rel-doc)',
  functional_comparison: 'var(--rel-func)',
  conceptual_parallel: 'var(--rel-para)',
}
const REL_LABEL: Record<string, string> = {
  documented_relation: '史料关联',
  functional_comparison: '功能类比',
  conceptual_parallel: '设计解释',
}
const STATE_LABEL: Record<string, string> = {
  unseen: '未接触', exposed: '已接触', verified: '已验证', gap_detected: '出现断点',
}
const STATE_COLOR: Record<string, string> = {
  unseen: 'transparent', exposed: 'var(--steel)', verified: 'var(--ok)', gap_detected: 'var(--gap)',
}

/* 脉络网布局：古列在左，今列在右，关系边横跨两侧 */
const AX_ANC = 104
const AX_MOD = 232
const TOP = 40
const GAP_A = 92
const GAP_M = 73.6

export default function Spectrum() {
  const { content, session } = useApp()
  const [data, setData] = useState<SpectrumResponse | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const sid = session.id

  useEffect(() => {
    if (sid == null) { setData(null); return }
    api.spectrum(sid).then(setData).catch(() => {})
  }, [sid])

  const finish = async () => {
    if (sid == null) return
    await api.finish(sid)
    setData(await api.spectrum(sid))
  }

  const grouped = useMemo(() => {
    const ns = content?.nodes ?? []
    const byEra = (era: string) => ns.filter((n) => n.era === era).sort((a, b) => a.id.localeCompare(b.id))
    return { ancient: byEra('ancient'), modern: byEra('modern') }
  }, [content])

  if (!content) return <div className="page" />

  const states: Record<string, string> = data?.states
    ?? Object.fromEntries(content.nodes.map((n) => [n.id, 'unseen']))
  const yOf = (id: string) =>
    id.startsWith('A')
      ? TOP + grouped.ancient.findIndex((n) => n.id === id) * GAP_A
      : TOP + grouped.modern.findIndex((n) => n.id === id) * GAP_M
  const xOf = (id: string) => (id.startsWith('A') ? AX_ANC : AX_MOD)

  const selectedNode: ProcessNode | undefined = content.nodes.find((n) => n.id === selected)

  return (
    <div className="page">
      <div className="eyebrow accent">参观结束</div>
      <h2 className="h-page" style={{ marginTop: 12 }}>我的开物谱</h2>

      <div className="spec-graph">
        <svg viewBox="0 0 360 452" role="img" aria-label="古今工艺脉络网">
          <text className="g-era-label" x={AX_ANC} y={16} textAnchor="middle">古 · 凤凰山</text>
          <text className="g-era-label" x={AX_MOD} y={16} textAnchor="middle">今 · 新钢</text>
          <line className="g-axis" x1={AX_ANC} y1={30} x2={AX_ANC} y2={420} />
          <line className="g-axis" x1={AX_MOD} y1={30} x2={AX_MOD} y2={420} />

          {content.edges.map((e) => {
            const s1 = states[e.from_id] ?? 'unseen'
            const s2 = states[e.to_id] ?? 'unseen'
            const x1 = xOf(e.from_id); const x2 = xOf(e.to_id)
            const y1 = yOf(e.from_id); const y2 = yOf(e.to_id)
            const mx = (x1 + x2) / 2
            const color = REL_COLOR[e.relation_type] ?? 'var(--ink-3)'
            // 虚线只表示"未接触"：两端都到过即为实线；验证/断点边加重
            const known1 = s1 !== 'unseen'; const known2 = s2 !== 'unseen'
            const strong = s1 === 'verified' || s2 === 'verified' || s1 === 'gap_detected' || s2 === 'gap_detected'
            let width = 1.2
            let opacity = 0.3
            let dash: string | undefined = '2 5'
            if (known1 && known2) { dash = undefined; width = 1.6; opacity = 0.55 }
            else if (known1 || known2) { dash = '6 4'; width = 1.6; opacity = 0.5 }
            if (strong) { dash = undefined; width = 2.2; opacity = 0.85 }
            if (selected) {
              const connected = e.from_id === selected || e.to_id === selected
              opacity = connected ? 0.95 : 0.06
              width = connected ? 2.2 : 1.2
              if (!connected) dash = dash ?? '2 5'
              else dash = undefined
            }
            return (
              <path
                key={e.id}
                className="g-edge"
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                stroke={color}
                strokeWidth={width}
                strokeDasharray={dash}
                opacity={opacity}
                strokeLinecap="round"
              />
            )
          })}

          {[...grouped.ancient, ...grouped.modern].map((n) => {
            const st = states[n.id] ?? 'unseen'
            const cx = xOf(n.id); const cy = yOf(n.id)
            const discFill = st === 'unseen' ? 'var(--surface)' : STATE_COLOR[st]
            const discStroke = st === 'unseen' ? 'var(--hairline)' : 'none'
            const idFill = st === 'unseen' ? 'var(--ink-3)' : '#fff'
            const isSel = selected === n.id
            return (
              <g key={n.id} className={`g-node ${isSel ? 'sel' : ''}`} onClick={() => setSelected(isSel ? null : n.id)}>
                {st === 'gap_detected' && (
                  <circle className="pulse" cx={cx} cy={cy} r={16} fill="none" stroke="var(--gap)" strokeWidth={1.5} />
                )}
                <circle
                  className="disc"
                  cx={cx} cy={cy} r={16}
                  fill={discFill}
                  stroke={isSel ? 'var(--ink)' : discStroke}
                  strokeWidth={isSel ? 1.5 : 1}
                />
                <text className="g-id" x={cx} y={cy + 3.5} fill={idFill}>{n.id}</text>
                <text
                  className="g-name"
                  x={n.era === 'ancient' ? cx - 26 : cx + 26}
                  y={cy + 4}
                  textAnchor={n.era === 'ancient' ? 'end' : 'start'}
                  fill={isSel ? 'var(--accent)' : 'var(--ink)'}
                >{n.title}</text>
                <circle cx={cx} cy={cy} r={26} fill="transparent" style={{ pointerEvents: 'all' }} />
              </g>
            )
          })}
        </svg>
        {selectedNode && (
          <div className="spec-sel">
            <span className="ss-name">{selectedNode.title}</span>
            <span className="t-fine">{selectedNode.era === 'ancient' ? '古' : '今'} · {selectedNode.stage}</span>
            <span className="ss-state" style={{ color: STATE_COLOR[states[selectedNode.id]] === 'transparent' ? 'var(--ink-3)' : STATE_COLOR[states[selectedNode.id]] }}>
              {STATE_LABEL[states[selectedNode.id]] ?? '未接触'}
            </span>
          </div>
        )}
      </div>

      <div className="legend" style={{ marginTop: 14 }}>
        <span><i style={{ background: 'transparent', border: '1px solid var(--hairline)' }} />未接触</span>
        <span><i style={{ background: 'var(--steel)' }} />已接触</span>
        <span><i style={{ background: 'var(--ok)' }} />已验证</span>
        <span><i style={{ background: 'var(--accent)' }} />出现断点</span>
      </div>
      <div className="legend" style={{ marginTop: 6 }}>
        {Object.entries(REL_LABEL).map(([k, label]) => (
          <span key={k}><i className="line" style={{ background: REL_COLOR[k] }} />{label}</span>
        ))}
      </div>

      <div className="spec-list">
        {content.nodes.map((n) => (
          <div key={n.id} className="spec-row">
            <span className={`s-dot ${(data?.states ?? {})[n.id] ?? 'unseen'}`} />
            <span className="s-name">{n.title}</span>
            <span className="s-era">{n.era === 'ancient' ? '古' : '今'} · {n.stage}</span>
          </div>
        ))}
      </div>

      {data && data.key_changes.length > 0 && (
        <div className="key-change">
          <div className="kc-title">关键变化</div>
          {data.key_changes.map((k, i) => <div key={i} className="kc-item">{k}</div>)}
        </div>
      )}

      {sid != null && (
        <button className="btn-primary" style={{ marginTop: 26 }} onClick={finish}>
          结束研学
        </button>
      )}
    </div>
  )
}
