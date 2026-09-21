/**
 * 学科简笔图标 —— 「课堂衔接」圆徽用。
 * 纸墨线描风：24×24 视框、1.7 线宽、随 currentColor 变色（圆徽里是钢青）。
 * 未收录的学科回退显示首字，不阻塞内容新增。
 */
import type { ReactNode } from 'react'

const GLYPHS: Record<string, ReactNode> = {
  // 化学 → 锥形试剂瓶（液面 + 气泡）
  chem: (
    <>
      <path d="M8.5 2.8h7" />
      <path d="M10 2.8v7.5a2 2 0 0 1-.21.9l-5.07 8.3a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-8.3a2 2 0 0 1-.21-.9V2.8" />
      <path d="M7 16.6h10" />
      <circle cx="10.4" cy="18.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.2" cy="17.7" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  // 物理 → U形磁铁
  phys: (
    <>
      <path d="M8 5v6a4 4 0 0 0 8 0V5" strokeWidth={2.4} />
      <path d="M6.6 3.4h2.8M14.6 3.4h2.8" strokeWidth={2.4} />
    </>
  ),
  // 地理 → 罗盘（指向针）
  geo: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9" />
    </>
  ),
  // 历史 → 卷轴（线装古籍）
  hist: (
    <>
      <rect x="4.4" y="4.2" width="2.8" height="15.6" rx="1.4" />
      <rect x="16.8" y="4.2" width="2.8" height="15.6" rx="1.4" />
      <path d="M7.2 6.4h9.6v11.2H7.2z" />
      <path d="M9.6 9.8h4.8M9.6 12.2h4.8M9.6 14.6h3" />
    </>
  ),
  // 劳动 / 职业认知 → 扳手
  labor: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  // 数学 → 三角尺
  math: (
    <>
      <path d="M6.5 19V6.8L19.2 19z" />
      <path d="M9.8 19v-4.6l4.4 4.6z" />
    </>
  ),
  // 语文 → 打开的书
  chinese: (
    <>
      <path d="M2.5 4h5.5a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3h-6.5z" />
      <path d="M21.5 4H16a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h6.5z" />
    </>
  ),
  // 英语 → 对话气泡 + A
  english: (
    <>
      <path d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v8a1.5 1.5 0 0 1-1.5 1.5h-9.3L6 20.4v-3.9H4.5A1.5 1.5 0 0 1 3 15V7a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M9.4 13.6 12 7.8l2.6 5.8M10.4 11.7h3.2" />
    </>
  ),
  // 生物 → 叶
  bio: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2.5 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  // 政治 / 道德与法治 → 天平
  politics: (
    <>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </>
  ),
  // 信息技术 → 芯片
  it: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2.5M9 2v2.5M15 19.5V22M9 19.5V22M2 15h2.5M2 9h2.5M19.5 15H22M19.5 9H22" />
    </>
  ),
  // 音乐 → 音符
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  // 美术 → 调色盘
  art: (
    <>
      <circle cx="13.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12s4.25 9.5 9.5 9.5c.92 0 1.64-.74 1.64-1.68 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.12 0-.92.75-1.66 1.67-1.66h1.98c3.03 0 5.09-2.5 5.09-5.53C21.5 6.5 17.25 2.5 12 2.5Z" />
    </>
  ),
  // 体育 → 球
  pe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
      <path d="M5 8.6c2.4 1.5 4.4 4.4 5.1 7.8M19 8.6c-2.4 1.5-4.4 4.4-5.1 7.8" />
    </>
  ),
}

/** 学科名 → 图标 key（按序匹配，先具体后宽泛） */
const MATCHERS: Array<[RegExp, keyof typeof GLYPHS]> = [
  [/劳动|职业|综合实践/, 'labor'],
  [/化学|科学/, 'chem'],
  [/物理/, 'phys'],
  [/地理/, 'geo'],
  [/历史/, 'hist'],
  [/数学/, 'math'],
  [/语文|文学/, 'chinese'],
  [/英语|外语/, 'english'],
  [/生物/, 'bio'],
  [/政治|思想|道德与法治|道法/, 'politics'],
  [/信息/, 'it'],
  [/音乐/, 'music'],
  [/美术|艺术/, 'art'],
  [/体育|健康/, 'pe'],
]

function glyphKey(subject: string): string | null {
  for (const [re, key] of MATCHERS) if (re.test(subject)) return key
  return null
}

export default function SubjectIcon({ subject, size = 27 }: { subject: string; size?: number }) {
  const key = glyphKey(subject)
  if (!key) {
    // 未收录学科：回退为首字（沿用旧样式）
    return <span className="c-badge-fallback">{subject.slice(0, 1)}</span>
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[key]}
    </svg>
  )
}
