import QRCode from 'qrcode'
import type { ContentBundle } from './api'
import logoUrl from './assets/logo-emblem.png'

export interface PosterInput {
  content: ContentBundle
  states: Record<string, string>
  visitStart: number | null
  userName?: string | null
  shareUrl: string
  /** 会话模式：课堂衔接知识点仅 school 模式触发（与平台口径一致） */
  mode?: string | null
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

/* ===== 学科简笔图标（与 SubjectIcon.tsx 同一套线描，canvas 用 Path2D 复刻）===== */
interface SubjectGlyph { d: string; w?: number; dots?: Array<[number, number, number]> }
const SUBJECT_GLYPHS: Array<[RegExp, SubjectGlyph]> = [
  [/劳动|职业|综合实践/, { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' }],
  [/化学|科学/, { d: 'M8.5 2.8h7 M10 2.8v7.5a2 2 0 0 1-.21.9l-5.07 8.3a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-8.3a2 2 0 0 1-.21-.9V2.8 M7 16.6h10', dots: [[10.4, 18.6, 0.9], [13.2, 17.7, 0.6]] }],
  [/物理/, { d: 'M8 5v6a4 4 0 0 0 8 0V5 M6.6 3.4h2.8 M14.6 3.4h2.8', w: 2.4 }],
  [/地理/, { d: 'M12 2.8a9.2 9.2 0 1 0 0 18.4a9.2 9.2 0 1 0 0-18.4 M16.2 7.8L14.1 14.1L7.8 16.2L9.9 9.9z' }],
  [/历史/, { d: 'M4.4 4.2h2.8v15.6H4.4z M16.8 4.2h2.8v15.6h-2.8z M7.2 6.4h9.6v11.2H7.2z M9.6 9.8h4.8 M9.6 12.2h4.8 M9.6 14.6h3' }],
]

/** 在 (cx,cy) 画 size 见方的学科线描图标（米白圆底由调用方画）；未收录学科回退首字 */
function drawSubjectIcon(ctx: CanvasRenderingContext2D, subject: string, cx: number, cy: number, size: number, strokeW?: number) {
  const hit = SUBJECT_GLYPHS.find(([re]) => re.test(subject))
  ctx.save()
  if (!hit) {
    ctx.fillStyle = '#3e4a57'
    ctx.font = `bold ${Math.round(size * 0.5)}px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(subject.slice(0, 1), cx, cy)
    ctx.restore()
    return
  }
  const [, g] = hit
  const s = size / 24
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(s, s)
  ctx.strokeStyle = '#3e4a57'
  ctx.fillStyle = '#3e4a57'
  ctx.lineWidth = strokeW ?? g.w ?? 1.7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(g.d))
  if (g.dots) for (const [x, y, r] of g.dots) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() }
  ctx.restore()
}

/** 超宽截断加省略号 */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

/** 按最大宽度折行，最多 maxLines 行，末行超宽用省略号截断 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const lines: string[] = []
  let rest = text
  while (rest.length) {
    if (lines.length === maxLines - 1) { lines.push(fitText(ctx, rest, maxW)); break }
    let n = rest.length
    while (n > 1 && ctx.measureText(rest.slice(0, n)).width > maxW) n--
    lines.push(rest.slice(0, n))
    rest = rest.slice(n)
  }
  return lines
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
  const { content, states, visitStart, userName, shareUrl, mode } = input

  // 触发的课堂衔接：仅 school 模式，且节点接触过（非 unseen）才算触发
  const triggered = mode === 'school'
    ? content.curriculum.filter((c) => {
        const st = states[c.node_id]
        return !!st && st !== 'unseen'
      })
    : []
  const triggeredByNode: Record<string, typeof triggered> = {}
  for (const c of triggered) {
    if (!triggeredByNode[c.node_id]) triggeredByNode[c.node_id] = []
    triggeredByNode[c.node_id].push(c)
  }

  // 版面：谱图整体下移给「我的开物谱」标题让位；有触发知识点时清单区向下加长画布
  const BRIDGE_Y = triggered.length ? 992 : 978
  const ROW_H = 112
  const kbRowStart = BRIDGE_Y + 100
  const H = (triggered.length ? kbRowStart + triggered.length * ROW_H + 4 : BRIDGE_Y + 26) + 26 + 130
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const W = 720
  // 2x 渲染导出：720px 在手机高分屏上被拉伸、再经微信压缩后明显发糊，物理分辨率翻倍保清晰
  const S = 2
  canvas.width = W * S; canvas.height = H * S
  ctx.scale(S, S)

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
  ctx.fillText('新余工业研学', 48, 138)
  const date = new Date().toLocaleDateString('zh-CN')
  ctx.font = `15px ${SANS}`
  ctx.fillText(date, 48, 168)
  ctx.textAlign = 'left'

  // 项目 Logo（开物四百年 · 熔铁炉徽章，右上角圆角标）
  try {
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = logoUrl })
    if (img.width) {
      const LS = 124, LX = W - 48 - LS, LY = 56
      ctx.save()
      roundedRect(ctx, LX, LY, LS, LS, 14)
      ctx.clip()
      ctx.drawImage(img, LX, LY, LS, LS)
      ctx.restore()
      ctx.strokeStyle = 'rgba(240,235,224,0.22)'
      ctx.lineWidth = 1
      roundedRect(ctx, LX + 0.5, LY + 0.5, LS - 1, LS - 1, 14)
      ctx.stroke()
    }
  } catch { /* logo 加载失败不阻断海报 */ }

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
  const TOP = 622
  const GA = 76, GM = 62
  const yOf = (id: string) => TOP + (id.startsWith('A')
    ? anc.findIndex((n) => n.id === id) * GA
    : mod.findIndex((n) => n.id === id) * GM)
  const xOf = (id: string) => (id.startsWith('A') ? AXA : AXM)

  // 谱区小标题（与下方「我带走的知识」同款式样、同一左缘）
  ctx.textAlign = 'left'
  ctx.font = `bold 22px ${SERIF}`
  ctx.fillStyle = COPPER
  ctx.fillText('我的开物谱', 48, 542)

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
  ctx.fillText('· 跨越四百年 ·', (AXA + AXM) / 2, BRIDGE_Y)

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

    // 触发了知识点的节点 → 左上角挂学科小徽章（与下方清单呼应）
    const tLinks = triggeredByNode[n.id]
    if (tLinks) {
      const offs: Array<[number, number]> = [[-14, -14], [14, -14], [0, -21]]
      tLinks.slice(0, 3).forEach((c, k) => {
        const bx = cx + offs[k][0], by = cy + offs[k][1]
        ctx.beginPath(); ctx.arc(bx, by, 8.5, 0, Math.PI * 2)
        ctx.fillStyle = '#f2ecdf'; ctx.fill()
        ctx.strokeStyle = COPPER; ctx.lineWidth = 1.2; ctx.stroke()
        drawSubjectIcon(ctx, c.subject, bx, by, 10, 2.4)
      })
    }
  }
  ctx.textAlign = 'left'

  // ===== 课堂衔接清单：我带走的知识（有触发才出现）=====
  if (triggered.length) {
    const kbTop = BRIDGE_Y + 32
    ctx.strokeStyle = CARD_LINE
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.beginPath(); ctx.moveTo(48, kbTop); ctx.lineTo(W - 48, kbTop); ctx.stroke()
    ctx.setLineDash([])
    ctx.textAlign = 'left'
    ctx.font = `bold 24px ${SERIF}`
    ctx.fillStyle = COPPER
    ctx.fillText('我带走的知识', 48, kbTop + 46)
    triggered.forEach((c, i) => {
      const rowY = kbRowStart + i * ROW_H
      // 学科圆徽（与平台「课堂衔接」同款：米白圆底 + 钢青线描图标）
      ctx.beginPath(); ctx.arc(71, rowY + 24, 23, 0, Math.PI * 2)
      ctx.fillStyle = '#f2ecdf'; ctx.fill()
      ctx.strokeStyle = 'rgba(62,74,87,0.25)'; ctx.lineWidth = 1; ctx.stroke()
      drawSubjectIcon(ctx, c.subject, 71, rowY + 24, 26)
      // 学科标签
      ctx.font = `bold 15px ${SANS}`
      const tagW = ctx.measureText(c.subject).width + 16
      ctx.fillStyle = '#f2ecdf'
      roundedRect(ctx, 110, rowY + 4, tagW, 24, 4)
      ctx.fill()
      ctx.fillStyle = '#3e4a57'
      ctx.fillText(c.subject, 118, rowY + 21)
      // 概念
      ctx.font = `bold 21px ${SANS}`
      ctx.fillStyle = INK
      ctx.fillText(fitText(ctx, c.concept, W - 48 - (110 + tagW + 10)), 110 + tagW + 10, rowY + 22)
      // 知识讲解（自动折行，最多三行；行距 23px ≈ 1.35 倍，标题与讲解再留 4px 呼吸感）
      ctx.font = `17px ${SANS}`
      ctx.fillStyle = MUTED
      wrapLines(ctx, c.hook, W - 48 - 110, 3).forEach((line, li) => {
        ctx.fillText(line, 110, rowY + 46 + li * 23)
      })
      if (i < triggered.length - 1) {
        ctx.strokeStyle = '#26282c'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(110, rowY + 104); ctx.lineTo(W - 48, rowY + 104); ctx.stroke()
      }
    })
  }

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
