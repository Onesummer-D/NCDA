import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../store'
import { api, type ProcessNode, type SpectrumResponse } from '../api'
import { SPECTRUM_HERO } from '../images'

const REL_COLOR: Record<string, string> = {
  documented_relation: 'var(--rel-doc)',
  functional_comparison: 'var(--rel-func)',
  conceptual_parallel: 'var(--rel-para)',
}
const STATE_LABEL: Record<string, string> = {
  unseen: '未接触', exposed: '已接触', verified: '已验证', gap_detected: '出现断点',
}
const STATE_COLOR: Record<string, string> = {
  unseen: 'transparent', exposed: 'var(--steel)', verified: 'var(--ok)', gap_detected: 'var(--gap)',
}
/** 古列用罗马数字，今列用阿拉伯数字（开物谱脉络网与现场页工艺链共用） */
export const numLabel = (id: string) =>
  id.startsWith('A')
    ? (['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][Number(id.slice(1)) - 1] ?? id)
    : String(Number(id.slice(1)))
/** 脉络网里的长名缩写（完整名见选中信息条与现场页） */
const SHORT_NAME: Record<string, string> = { M6: '精深加工' }

/** 圈内数字自动反色：浅色圈配深字，深色圈配白字（按相对亮度判断） */
function inkOnDisc(cssColor: string): string {
  const hex = cssColor.startsWith('var(')
    ? getComputedStyle(document.documentElement).getPropertyValue(cssColor.slice(4, -1)).trim()
    : cssColor
  const n = parseInt(hex.replace('#', ''), 16)
  if (Number.isNaN(n)) return 'var(--ink)'
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
  return lum > 140 ? 'var(--ink)' : '#ffffff'
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
  const [posterMsg, setPosterMsg] = useState('')
  const sid = session.id
  const posterRef = useRef<HTMLCanvasElement>(null)

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

  // —— 分享海报：把本次研学的开物谱画成一张可保存的图 ——
  const makePoster = () => {
    const canvas = posterRef.current
    if (!canvas || !content) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 720, H = 1080
    canvas.width = W; canvas.height = H
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    // 顶部色带
    ctx.fillStyle = '#b8432c'
    ctx.fillRect(0, 0, W, 10)
    // 标题
    ctx.fillStyle = '#1c1915'
    ctx.font = 'bold 52px "Microsoft YaHei", sans-serif'
    ctx.fillText('开物脉络', 48, 110)
    ctx.fillStyle = '#857e6e'
    ctx.font = '22px "Microsoft YaHei", sans-serif'
    ctx.fillText('新余工业研学 · 我的开物谱', 48, 150)
    const date = new Date().toLocaleDateString('zh-CN')
    ctx.fillText(date, W - 48 - ctx.measureText(date).width, 110)
    // 统计
    const states = data?.states ?? {}
    const count = (s: string) => Object.values(states).filter((x) => x === s).length
    ctx.fillStyle = '#4f4a42'
    ctx.font = '26px "Microsoft YaHei", sans-serif'
    ctx.fillText(`已验证 ${count('verified')} · 出现断点 ${count('gap_detected')} · 已接触 ${count('exposed')} · 未接触 ${count('unseen')}`, 48, 210)
    // 分隔线
    ctx.strokeStyle = 'rgba(28,25,21,.12)'
    ctx.beginPath(); ctx.moveTo(48, 240); ctx.lineTo(W - 48, 240); ctx.stroke()
    // 节点清单（两列）
    ctx.font = '24px "Microsoft YaHei", sans-serif'
    const items = [...grouped.ancient, ...grouped.modern]
    items.forEach((nd, i) => {
      const col = i % 2, row = Math.floor(i / 2)
      const x = 60 + col * 330, y = 300 + row * 64
      const st = states[nd.id] ?? 'unseen'
      ctx.beginPath()
      ctx.arc(x + 8, y - 8, 9, 0, Math.PI * 2)
      if (st === 'unseen') { ctx.strokeStyle = 'rgba(28,25,21,.3)'; ctx.lineWidth = 1.5; ctx.stroke() }
      else { ctx.fillStyle = STATE_COLOR[st] === 'transparent' ? '#999' : STATE_COLOR[st]; ctx.fill() }
      ctx.fillStyle = '#1c1915'
      ctx.fillText(nd.title, x + 28, y)
      ctx.fillStyle = '#857e6e'
      ctx.font = '17px "Microsoft YaHei", sans-serif'
      ctx.fillText(STATE_LABEL[st] ?? '未接触', x + 28, y + 24)
      ctx.font = '24px "Microsoft YaHei", sans-serif'
    })
    // 底部
    ctx.strokeStyle = 'rgba(28,25,21,.12)'
    ctx.beginPath(); ctx.moveTo(48, H - 90); ctx.lineTo(W - 48, H - 90); ctx.stroke()
    ctx.fillStyle = '#1c1915'
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif'
    ctx.fillText('一块铁 · 近四百年', 48, H - 52)
    ctx.fillStyle = '#857e6e'
    ctx.font = '18px "Microsoft YaHei", sans-serif'
    ctx.fillText('开物脉络 · 新余工业研学', W - 48 - ctx.measureText('开物脉络 · 新余工业研学').width, H - 52)
    // 下载
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `开物谱研学海报-${date}.png`
    a.click()
    setPosterMsg('海报已保存到下载目录')
    setTimeout(() => setPosterMsg(''), 2500)
  }

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
      <h2 className="h-page">我的开物谱</h2>

      <div className="spec-hero">
        <img src={SPECTRUM_HERO.src} alt={SPECTRUM_HERO.credit} />
        <div className="spec-hero-cap">
          <b>{SPECTRUM_HERO.credit}</b>
          <span>{SPECTRUM_HERO.license}</span>
        </div>
      </div>
      <p className="spec-intro">
        左边是明代凤凰山的古法，右边是今天新钢的产线。
        你每走到一处、验证一问，属于你的脉络就会被点亮。
        <br />
        实线代表你已经接触过的开物脉络，虚线还在等你去探索。
      </p>

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
            const idFill = inkOnDisc(discFill)
            const isSel = selected === n.id
            return (
              <g key={n.id} className="g-node" onClick={() => setSelected(isSel ? null : n.id)}>
                {st === 'gap_detected' && (
                  <circle className="pulse" cx={cx} cy={cy} r={19} fill="none" stroke="var(--gap)" strokeWidth={1.5} />
                )}
                <circle
                  className="disc"
                  cx={cx} cy={cy} r={19}
                  fill={discFill}
                  stroke={isSel ? 'var(--ink)' : discStroke}
                  strokeWidth={isSel ? 1.5 : 1}
                />
                <text className="g-id" x={cx} y={cy + 4.5} fill={idFill}>{numLabel(n.id)}</text>
                <text
                  className="g-name"
                  x={n.era === 'ancient' ? cx - 30 : cx + 30}
                  y={cy + 5}
                  textAnchor={n.era === 'ancient' ? 'end' : 'start'}
                  fill={isSel ? 'var(--accent)' : 'var(--ink)'}
                >{SHORT_NAME[n.id] ?? n.title}</text>
                <circle cx={cx} cy={cy} r={28} fill="transparent" style={{ pointerEvents: 'all' }} />
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
        <span><i style={{ background: 'var(--gap)' }} />理解出现断点</span>
      </div>

      {data && data.key_changes.length > 0 && (
        <div className="key-change">
          <div className="kc-title">关键变化</div>
          {data.key_changes.map((k, i) => <div key={i} className="kc-item">{k}</div>)}
        </div>
      )}

      {sid != null && (
        <>
          <button className="btn-primary accent" style={{ marginTop: 26 }} onClick={makePoster}>
            生成研学海报 · 分享这一趟
          </button>
          {posterMsg && <div className="poster-msg">{posterMsg}</div>}
          <button className="btn-ghost" style={{ marginTop: 10 }} onClick={finish}>
            结束研学
          </button>
        </>
      )}
      <canvas ref={posterRef} style={{ display: 'none' }} />
    </div>
  )
}
