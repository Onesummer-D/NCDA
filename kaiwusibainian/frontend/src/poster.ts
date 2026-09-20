import QRCode from 'qrcode'
import type { ContentBundle } from './api'

export interface PosterInput {
  content: ContentBundle
  states: Record<string, string>
  visitStart: number | null
  userName?: string | null
  shareUrl: string
}

/* ===== 工业硬核 × 新中式版画 配色（深铁灰底）===== */
const BG = '#1b1d20'
const INK = '#f0ebe0'
const MUTED = '#8a8f96'
const GOLD = '#f0a832'
const COPPER = '#cfa96b'
const VERMIL = '#d34e33'
const CARD = '#242629'
const CARD_LINE = '#33363a'
const SERIF = '"Noto Serif SC","Source Han Serif SC","STSong","SimSun",serif'
const SANS = '"Microsoft YaHei","PingFang SC",sans-serif'

const STATE_FILL: Record<string, string> = {
  unseen: BG, exposed: COPPER, verified: GOLD, gap_detected: VERMIL,
}
const STATE_TEXT: Record<string, string> = {
  unseen: '#6a6f76', exposed: '#221c10', verified: '#221c10', gap_detected: '#ffffff',
}
const STATE_STROKE: Record<string, string> = {
  unseen: '#3a3d42', exposed: 'none', verified: 'none', gap_detected: 'none',
}
/** 古列罗马数字，今列阿拉伯数字 */
const numLabel = (id: string) =>
  id.startsWith('A')
    ? (['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][Number(id.slice(1)) - 1] ?? id)
    : String(Number(id.slice(1)))

const EDGE_COLOR: Record<string, string> = {
  documented_relation: '#6a7d8c',
  functional_comparison: VERMIL,
  conceptual_parallel: '#9a7fc0',
}

/** 按探索进度给称号 */
function rankOf(touched: number, verified: number, total: number): string {
  if (touched === 0) return '初到炉台'
  if (verified >= Math.max(6, total - 3)) return '炼钢大宗师'
  if (touched >= total - 1) return '开物通才'
  if (touched >= 7) return '钢城探索者'
  if (touched >= 4) return '锻打行者'
  return '开物学徒'
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function setTracking(ctx: CanvasRenderingContext2D, px: string) {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = px
}

/**
 * 研学分享海报 v3：工业硬核 × 新中式版画
 * 深铁灰底 + 熔铁金高光；抬头带朱砂印章，探索度环形仪表 + 战绩卡，
 * 古今双轴脉络图（状态点亮），底部品牌语 + 引流二维码。
 */
export async function renderPoster(input: PosterInput): Promise<Blob | null> {
  const { content, states, visitStart, userName, shareUrl } = input
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const W = 720, H = 1120
  canvas.width = W; canvas.height = H

  // ===== 底色 =====
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#b8432c'; ctx.fillRect(0, 0, W, 6)

  const count = (s: string) => Object.values(states).filter((x) => x === s).length
  const nVerified = count('verified')
  const nTouched = Object.values(states).filter((s) => s !== 'unseen').length
  const total = content.nodes.length

  // ===== 抬头：品牌 + 印章 =====
  ctx.fillStyle = INK
  ctx.font = `bold 52px ${SERIF}`
  setTracking(ctx, '8px')
  ctx.fillText('开物四百年', 48, 100)
  setTracking(ctx, '0px')
  ctx.fillStyle = MUTED
  ctx.font = `20px ${SANS}`
  ctx.fillText('新余工业研学 · 我的开物谱', 48, 138)
  const date = new Date().toLocaleDateString('zh-CN')
  ctx.textAlign = 'right'
  ctx.fillText(date, W - 48, 100)
  ctx.textAlign = 'left'

  // 朱砂印章（开物 / 四百年 两行，微倾）
  ctx.save()
  ctx.translate(W - 48 - 46, 118)
  ctx.rotate(-0.06)
  ctx.fillStyle = '#b8432c'
  roundedRect(ctx, -46, -34, 92, 68, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 26px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.fillText('开 物', 0, -6)
  ctx.fillText('四百年', 0, 26)
  ctx.restore()
  ctx.textAlign = 'left'

  // ===== 用户 + 称号 =====
  ctx.fillStyle = INK
  ctx.font = `26px ${SANS}`
  ctx.fillText(userName ? `@${userName} 的研学之路` : '我的研学之路', 48, 202)
  const rank = rankOf(nTouched, nVerified, total)
  ctx.font = `bold 27px ${SERIF}`
  const rankText = `【 ${rank} 】`
  const rankW = ctx.measureText(rankText).width + 44
  ctx.fillStyle = 'rgba(240,168,50,0.10)'
  roundedRect(ctx, 48, 226, rankW, 52, 26)
  ctx.fill()
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2
  roundedRect(ctx, 48, 226, rankW, 52, 26)
  ctx.stroke()
  ctx.fillStyle = GOLD
  ctx.fillText(rankText, 70, 262)

  // ===== 探索度环形仪表 =====
  const cx0 = 128, cy0 = 408, r0 = 62
  ctx.lineWidth = 12
  ctx.strokeStyle = '#2c2f33'
  ctx.beginPath(); ctx.arc(cx0, cy0, r0, 0, Math.PI * 2); ctx.stroke()
  const frac = total ? nTouched / total : 0
  ctx.strokeStyle = GOLD
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(cx0, cy0, r0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.fillStyle = INK
  ctx.font = 'bold 34px "Inter","Segoe UI","Microsoft YaHei",sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(frac * 100)}%`, cx0, cy0 + 6)
  ctx.fillStyle = MUTED
  ctx.font = `15px ${SANS}`
  ctx.fillText('探索度', cx0, cy0 + 32)
  ctx.textAlign = 'left'

  // ===== 战绩卡 ×3 =====
  const stats: { label: string; num: string; color: string }[] = [
    { label: '已验证', num: String(nVerified), color: GOLD },
    { label: '已接触', num: String(nTouched - nVerified), color: COPPER },
    { label: '待解锁', num: String(total - nTouched), color: nTouched >= total ? MUTED : '#7d828a' },
  ]
  stats.forEach((s, i) => {
    const x = 232 + i * 152, y = 348, w = 140, h = 108
    ctx.fillStyle = CARD
    roundedRect(ctx, x, y, w, h, 14)
    ctx.fill()
    ctx.strokeStyle = CARD_LINE; ctx.lineWidth = 1
    roundedRect(ctx, x, y, w, h, 14)
    ctx.stroke()
    ctx.fillStyle = s.color
    ctx.font = 'bold 42px "Inter","Segoe UI","Microsoft YaHei",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(s.num, x + w / 2, y + 56)
    ctx.fillStyle = MUTED
    ctx.font = `17px ${SANS}`
    ctx.fillText(s.label, x + w / 2, y + 86)
  })
  ctx.textAlign = 'left'

  // 用时（超过 90 分钟显示「约半日」，避免挂机时间虚高）
  let duration = ''
  if (visitStart) {
    const mins = Math.max(1, Math.round((Date.now() - visitStart) / 60000))
    duration = mins > 90 ? '约半日' : mins >= 60 ? `${Math.floor(mins / 60)} 小时 ${mins % 60} 分` : `${mins} 分钟`
  }
  if (duration) {
    ctx.fillStyle = MUTED
    ctx.font = `18px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText(`本次研学 ${duration}`, W / 2, 496)
    ctx.textAlign = 'left'
  }

  // ===== 古今双轴脉络图 =====
  const anc = content.nodes.filter((n) => n.era === 'ancient').sort((a, b) => a.id.localeCompare(b.id))
  const mod = content.nodes.filter((n) => n.era === 'modern').sort((a, b) => a.id.localeCompare(b.id))
  const AXA = 185, AXM = 535
  const TOP = 566
  const GA = 76, GM = 62
  const yOf = (id: string) => TOP + (id.startsWith('A')
    ? anc.findIndex((n) => n.id === id) * GA
    : mod.findIndex((n) => n.id === id) * GM)
  const xOf = (id: string) => (id.startsWith('A') ? AXA : AXM)

  ctx.font = `bold 20px ${SERIF}`
  ctx.fillStyle = MUTED
  ctx.textAlign = 'center'
  ctx.fillText('古 · 凤凰山', AXA, TOP - 44)
  ctx.fillText('今 · 新钢', AXM, TOP - 44)
  ctx.strokeStyle = CARD_LINE
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(AXA, TOP - 28); ctx.lineTo(AXA, yOf(anc[anc.length - 1]?.id ?? 'A5') + 26); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(AXM, TOP - 28); ctx.lineTo(AXM, yOf(mod[mod.length - 1]?.id ?? 'M6') + 26); ctx.stroke()

  // 「跨越四百年」放谱区下方空白处（古今间的虚线桥已移除）
  ctx.fillStyle = GOLD
  ctx.font = `15px ${SERIF}`
  ctx.fillText('· 跨越四百年 ·', (AXA + AXM) / 2, 944)

  // 边（接触过才点亮）
  for (const e of content.edges) {
    const lit = [states[e.from_id], states[e.to_id]].some((s) => s && s !== 'unseen')
    const strong = [states[e.from_id], states[e.to_id]].some((s) => s === 'verified' || s === 'gap_detected')
    const x1 = xOf(e.from_id), y1 = yOf(e.from_id), x2 = xOf(e.to_id), y2 = yOf(e.to_id)
    const mx = (x1 + x2) / 2
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2)
    ctx.strokeStyle = EDGE_COLOR[e.relation_type] ?? '#777'
    ctx.globalAlpha = lit ? 0.9 : 0.15
    ctx.lineWidth = strong ? 2.6 : 1.4
    ctx.setLineDash(lit ? [] : [3, 5])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  // 节点
  for (const n of [...anc, ...mod]) {
    const cx = xOf(n.id), cy = yOf(n.id)
    const st = states[n.id] ?? 'unseen'
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2)
    ctx.fillStyle = STATE_FILL[st]
    ctx.fill()
    if (st === 'unseen') {
      ctx.strokeStyle = STATE_STROKE[st]; ctx.lineWidth = 1.5; ctx.stroke()
    }
    ctx.fillStyle = STATE_TEXT[st]
    ctx.font = 'bold 13px "Inter","Segoe UI","Microsoft YaHei",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(numLabel(n.id), cx, cy + 5)
    ctx.font = `bold 17px ${SANS}`
    ctx.fillStyle = st === 'unseen' ? '#6a6f76' : INK
    ctx.textAlign = n.era === 'ancient' ? 'right' : 'left'
    ctx.fillText(n.id === 'M6' ? '精深加工' : n.title, n.era === 'ancient' ? cx - 28 : cx + 28, cy + 6)
  }
  ctx.textAlign = 'left'

  // ===== 底部：Logo + 二维码 整体居中 =====
  const FOOT = H - 130
  ctx.strokeStyle = CARD_LINE
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(48, FOOT); ctx.lineTo(W - 48, FOOT); ctx.stroke()
  ctx.font = `bold 30px ${SERIF}`
  const logoSegs = [['开物', INK], ['四百', GOLD], ['年', INK]] as const
  const logoW = logoSegs.reduce((w, [t]) => w + ctx.measureText(t).width, 0)
  const qrSize = 106
  const qrGap = 48
  const groupX = (W - (logoW + qrGap + qrSize)) / 2
  const qrX = groupX + logoW + qrGap
  const qrY = FOOT + 12
  // Logo：上下朱砂线与字两端对齐，块中心与二维码中心齐平
  ctx.strokeStyle = '#b8432c'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(groupX, FOOT + 40); ctx.lineTo(groupX + logoW, FOOT + 40); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(groupX, FOOT + 90); ctx.lineTo(groupX + logoW, FOOT + 90); ctx.stroke()
  ctx.lineWidth = 1
  let logoX = groupX
  for (const [seg, color] of logoSegs) {
    ctx.fillStyle = color
    ctx.fillText(seg, logoX, FOOT + 75)
    logoX += ctx.measureText(seg).width
  }
  ctx.font = `16px ${SANS}`
  const sub = '一块铁 · 近四百年'
  ctx.fillStyle = MUTED
  ctx.fillText(sub, groupX + (logoW - ctx.measureText(sub).width) / 2, FOOT + 118)
  try {
    const qr = await QRCode.toDataURL(shareUrl, {
      width: 220, margin: 1, color: { dark: '#1b1d20', light: '#f5f2ea' },
    })
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = qr })
    ctx.fillStyle = '#f5f2ea'
    roundedRect(ctx, qrX, qrY, qrSize, qrSize, 10)
    ctx.fill()
    ctx.drawImage(img, qrX + 6, qrY + 6, qrSize - 12, qrSize - 12)
  } catch { /* 二维码失败不阻断海报 */ }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
