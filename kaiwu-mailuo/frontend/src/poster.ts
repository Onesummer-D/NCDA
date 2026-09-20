import QRCode from 'qrcode'
import type { ContentBundle } from './api'

export interface PosterInput {
  content: ContentBundle
  states: Record<string, string>
  visitStart: number | null
  userName?: string | null
  shareUrl: string
}

const STATE_FILL: Record<string, string> = {
  unseen: '#ffffff', exposed: '#3e4a57', verified: '#55704a', gap_detected: '#b8432c',
}
const STATE_STROKE: Record<string, string> = {
  unseen: 'rgba(28,25,21,.25)', exposed: 'none', verified: 'none', gap_detected: 'none',
}
/** 古列罗马数字，今列阿拉伯数字 */
const numLabel = (id: string) =>
  id.startsWith('A')
    ? (['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][Number(id.slice(1)) - 1] ?? id)
    : String(Number(id.slice(1)))

const EDGE_COLOR: Record<string, string> = {
  documented_relation: '#5a7184',
  functional_comparison: '#b8432c',
  conceptual_parallel: '#8a6ba0',
}

/**
 * 研学分享海报 v2：与开物谱同款的古今脉络网 + 打卡数据 + 二维码
 */
export async function renderPoster(input: PosterInput): Promise<Blob | null> {
  const { content, states, visitStart, userName, shareUrl } = input
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const W = 720, H = 1120
  canvas.width = W; canvas.height = H

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#b8432c'; ctx.fillRect(0, 0, W, 10)

  // 抬头
  ctx.fillStyle = '#1c1915'
  ctx.font = 'bold 46px "Microsoft YaHei", sans-serif'
  ctx.fillText('开物脉络', 48, 104)
  ctx.fillStyle = '#857e6e'
  ctx.font = '20px "Microsoft YaHei", sans-serif'
  const sub = userName ? `${userName} 的研学足迹 · 新余工业研学` : '我的研学足迹 · 新余工业研学'
  ctx.fillText(sub, 48, 140)
  const date = new Date().toLocaleDateString('zh-CN')
  ctx.fillText(date, W - 48 - ctx.measureText(date).width, 104)

  // 打卡数据行
  const count = (s: string) => Object.values(states).filter((x) => x === s).length
  ctx.fillStyle = '#4f4a42'
  ctx.font = '22px "Microsoft YaHei", sans-serif'
  let duration = '—'
  if (visitStart) {
    const mins = Math.max(1, Math.round((Date.now() - visitStart) / 60000))
    duration = mins >= 60 ? `${Math.floor(mins / 60)} 小时 ${mins % 60} 分` : `${mins} 分钟`
  }
  ctx.fillText(`已验证 ${count('verified')}　理解出现断点 ${count('gap_detected')}　游览时长 ${duration}`, 48, 192)
  ctx.strokeStyle = 'rgba(28,25,21,.12)'
  ctx.beginPath(); ctx.moveTo(48, 222); ctx.lineTo(W - 48, 222); ctx.stroke()

  // ===== 古今脉络网（与开物谱页同构）=====
  const anc = content.nodes.filter((n) => n.era === 'ancient').sort((a, b) => a.id.localeCompare(b.id))
  const mod = content.nodes.filter((n) => n.era === 'modern').sort((a, b) => a.id.localeCompare(b.id))
  const AXA = 190, AXM = 500
  const TOP = 290
  const GA = 78, GM = 62
  const yOf = (id: string) => TOP + (id.startsWith('A')
    ? anc.findIndex((n) => n.id === id) * GA
    : mod.findIndex((n) => n.id === id) * GM)
  const xOf = (id: string) => (id.startsWith('A') ? AXA : AXM)

  ctx.font = 'bold 19px "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#857e6e'
  ctx.textAlign = 'center'
  ctx.fillText('古 · 凤凰山', AXA, TOP - 46)
  ctx.fillText('今 · 新钢', AXM, TOP - 46)
  ctx.strokeStyle = 'rgba(28,25,21,.12)'
  ctx.beginPath(); ctx.moveTo(AXA, TOP - 30); ctx.lineTo(AXA, yOf(anc[anc.length - 1]?.id ?? 'A5') + 30); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(AXM, TOP - 30); ctx.lineTo(AXM, yOf(mod[mod.length - 1]?.id ?? 'M6') + 30); ctx.stroke()

  // 边
  const keyEdges = new Set(content.edges.filter((e) => {
    const s1 = states[e.from_id] ?? 'unseen'
    const s2 = states[e.to_id] ?? 'unseen'
    return s1 !== 'unseen' || s2 !== 'unseen'
  }).map((e) => e.id))
  for (const e of content.edges) {
    const lit = keyEdges.has(e.id)
    const strong = [states[e.from_id], states[e.to_id]].some((s) => s === 'verified' || s === 'gap_detected')
    ctx.beginPath()
    const x1 = xOf(e.from_id), y1 = yOf(e.from_id), x2 = xOf(e.to_id), y2 = yOf(e.to_id)
    const mx = (x1 + x2) / 2
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2)
    ctx.strokeStyle = EDGE_COLOR[e.relation_type] ?? '#999'
    ctx.globalAlpha = lit ? 0.9 : 0.16
    ctx.lineWidth = strong ? 2.4 : 1.3
    ctx.setLineDash(lit ? [] : [3, 5])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }
  // 节点
  ctx.font = 'bold 15px "Microsoft YaHei", sans-serif'
  for (const n of [...anc, ...mod]) {
    const cx = xOf(n.id), cy = yOf(n.id)
    const st = states[n.id] ?? 'unseen'
    ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2)
    ctx.fillStyle = STATE_FILL[st]
    ctx.fill()
    ctx.strokeStyle = STATE_STROKE[st] === 'none' ? 'rgba(0,0,0,0)' : STATE_STROKE[st]
    ctx.lineWidth = st === 'unseen' ? 1.5 : 0
    if (st === 'unseen') ctx.stroke()
    ctx.fillStyle = st === 'unseen' ? '#98917f' : '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(numLabel(n.id), cx, cy + 5)
    // 名称
    ctx.font = 'bold 16px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#1c1915'
    ctx.textAlign = n.era === 'ancient' ? 'right' : 'left'
    ctx.fillText(n.id === 'M6' ? '精深加工' : n.title, n.era === 'ancient' ? cx - 30 : cx + 30, cy + 5)
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif'
  }
  ctx.textAlign = 'left'

  // 底部：品牌 + 二维码
  const FOOT = H - 120
  ctx.strokeStyle = 'rgba(28,25,21,.12)'
  ctx.beginPath(); ctx.moveTo(48, FOOT); ctx.lineTo(W - 48, FOOT); ctx.stroke()
  ctx.fillStyle = '#1c1915'
  ctx.font = 'bold 26px "Microsoft YaHei", sans-serif'
  ctx.fillText('一块铁 · 近四百年', 48, FOOT + 46)
  ctx.fillStyle = '#857e6e'
  ctx.font = '16px "Microsoft YaHei", sans-serif'
  ctx.fillText('扫码打开我的开物谱', 48, FOOT + 74)
  try {
    const qr = await QRCode.toDataURL(shareUrl, { width: 200, margin: 0, color: { dark: '#1c1915', light: '#ffffff' } })
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = qr })
    ctx.drawImage(img, W - 48 - 96, FOOT + 18, 96, 96)
  } catch { /* 二维码失败不阻断海报 */ }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
