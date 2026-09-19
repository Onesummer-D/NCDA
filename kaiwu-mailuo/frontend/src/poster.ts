import QRCode from 'qrcode'
import type { ContentBundle } from './api'

export interface PosterInput {
  content: ContentBundle
  states: Record<string, string>
  visitStart: number | null
  userName?: string | null
  shareUrl: string
}

const STATE_COLOR: Record<string, string> = {
  unseen: '#d8d4cb', exposed: '#3e4a57', verified: '#55704a', gap_detected: '#b8432c',
}
const STATE_LABEL: Record<string, string> = {
  unseen: '未接触', exposed: '已接触', verified: '已验证', gap_detected: '出现断点',
}

/** 研学分享海报：今天打卡了哪里 · 学到了什么 · 游览时长 + 分享二维码 */
export async function renderPoster(input: PosterInput): Promise<Blob | null> {
  const { content, states, visitStart, userName, shareUrl } = input
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const W = 720, H = 1080
  canvas.width = W; canvas.height = H

  // 底
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#b8432c'; ctx.fillRect(0, 0, W, 10)

  // 抬头
  ctx.fillStyle = '#1c1915'
  ctx.font = 'bold 52px "Microsoft YaHei", sans-serif'
  ctx.fillText('开物脉络', 48, 108)
  ctx.fillStyle = '#857e6e'
  ctx.font = '21px "Microsoft YaHei", sans-serif'
  const sub = userName ? `${userName} 的开物谱 · 新余工业研学` : '新余工业研学 · 我的开物谱'
  ctx.fillText(sub, 48, 146)
  const date = new Date().toLocaleDateString('zh-CN')
  ctx.fillText(date, W - 48 - ctx.measureText(date).width, 108)

  // 打卡统计
  const count = (s: string) => Object.values(states).filter((x) => x === s).length
  ctx.fillStyle = '#b8432c'
  ctx.font = 'bold 30px "Microsoft YaHei", sans-serif'
  ctx.fillText('今天打卡', 48, 216)
  ctx.fillStyle = '#4f4a42'
  ctx.font = '24px "Microsoft YaHei", sans-serif'
  ctx.fillText(`已验证 ${count('verified')} · 出现断点 ${count('gap_detected')} · 已接触 ${count('exposed')}`, 48, 254)

  // 游览时长
  let duration = '—'
  if (visitStart) {
    const mins = Math.max(1, Math.round((Date.now() - visitStart) / 60000))
    duration = mins >= 60 ? `${Math.floor(mins / 60)} 小时 ${mins % 60} 分` : `${mins} 分钟`
  }
  ctx.fillText(`游览时长 ${duration}`, 48, 292)

  // 学到了什么（关键变化 / 已验证节点）
  const verifiedTitles = content.nodes
    .filter((n) => states[n.id] === 'verified')
    .map((n) => n.title)
  let learnY = 344
  if (verifiedTitles.length) {
    ctx.fillStyle = '#b8432c'
    ctx.font = 'bold 26px "Microsoft YaHei", sans-serif'
    ctx.fillText('学到了什么', 48, learnY)
    ctx.fillStyle = '#4f4a42'
    ctx.font = '22px "Microsoft YaHei", sans-serif'
    const text = verifiedTitles.join(' · ')
    let line = '', yy = learnY + 36
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > W - 96) { ctx.fillText(line, 48, yy); yy += 32; line = ch }
      else line += ch
    }
    if (line) { ctx.fillText(line, 48, yy); yy += 32 }
    learnY = yy + 8
  }

  // 打卡足迹（节点两列点阵）
  ctx.strokeStyle = 'rgba(28,25,21,.12)'
  ctx.beginPath(); ctx.moveTo(48, learnY); ctx.lineTo(W - 48, learnY); ctx.stroke()
  ctx.fillStyle = '#b8432c'
  ctx.font = 'bold 26px "Microsoft YaHei", sans-serif'
  ctx.fillText('打卡足迹', 48, learnY + 44)
  const items = [...content.nodes].sort((a, b) => (a.era === b.era ? a.id.localeCompare(b.id) : a.era === 'ancient' ? -1 : 1))
  ctx.font = '20px "Microsoft YaHei", sans-serif'
  items.forEach((nd, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 60 + col * 330, y = learnY + 92 + row * 56
    const st = states[nd.id] ?? 'unseen'
    ctx.beginPath()
    ctx.arc(x + 8, y - 7, 9, 0, Math.PI * 2)
    if (st === 'unseen') { ctx.strokeStyle = 'rgba(28,25,21,.3)'; ctx.lineWidth = 1.5; ctx.stroke() }
    else { ctx.fillStyle = STATE_COLOR[st]; ctx.fill() }
    ctx.fillStyle = '#1c1915'
    ctx.fillText(nd.title, x + 26, y)
    ctx.fillStyle = '#857e6e'
    ctx.font = '15px "Microsoft YaHei", sans-serif'
    ctx.fillText(STATE_LABEL[st] ?? '未接触', x + 26, y + 22)
    ctx.font = '20px "Microsoft YaHei", sans-serif'
  })

  // 底部：品牌 + 二维码
  ctx.strokeStyle = 'rgba(28,25,21,.12)'
  ctx.beginPath(); ctx.moveTo(48, H - 150); ctx.lineTo(W - 48, H - 150); ctx.stroke()
  ctx.fillStyle = '#1c1915'
  ctx.font = 'bold 26px "Microsoft YaHei", sans-serif'
  ctx.fillText('一块铁 · 近四百年', 48, H - 96)
  ctx.fillStyle = '#857e6e'
  ctx.font = '17px "Microsoft YaHei", sans-serif'
  ctx.fillText('扫码打开我的开物谱', 48, H - 62)
  try {
    const qr = await QRCode.toDataURL(shareUrl, { width: 200, margin: 0, color: { dark: '#1c1915', light: '#ffffff' } })
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = qr })
    ctx.drawImage(img, W - 48 - 110, H - 130, 110, 110)
  } catch { /* 二维码失败不阻断海报 */ }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
