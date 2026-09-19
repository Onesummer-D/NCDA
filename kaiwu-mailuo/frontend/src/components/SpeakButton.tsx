import { useEffect, useState } from 'react'

/** 语音朗读按钮（浏览器 TTS · 中文） */
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
    <button className={`speak-btn ${dark ? 'dark' : ''}`} onClick={toggle} aria-label={on ? '停止朗读' : '朗读这段内容'}>
      {on ? '■ 停止' : '🔊 朗读'}
    </button>
  )
}
