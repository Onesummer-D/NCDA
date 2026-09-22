import { useEffect, useState } from 'react'

/** 语音朗读按钮（浏览器 TTS · 中文）· 仅喇叭图标 */
export default function SpeakButton({ text, dark }: { text: string; dark?: boolean }) {
  const [on, setOn] = useState(false)

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  const toggle = () => {
    const s = window.speechSynthesis
    if (!s) return
    if (on) { s.cancel(); setOn(false); return }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 0.95
    u.onend = () => setOn(false)
    u.onerror = () => setOn(false)
    s.cancel()
    s.speak(u)
    setOn(true)
  }

  return (
    <button
      className={`speak-btn ${dark ? 'dark' : ''}`}
      onClick={toggle}
      aria-label={on ? '停止朗读' : '朗读这段内容'}
      title={on ? '停止朗读' : '朗读这段内容'}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {on ? (
          <>
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </>
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  )
}

