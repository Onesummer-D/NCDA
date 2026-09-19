import { useEffect, useRef, useState } from 'react'
import type { ImgMeta } from '../images'

/** 全屏图片查看器：缩放 / 复位 / 下载（参考 NGA 风格） */
export default function Lightbox({ img, onClose }: { img: ImgMeta; onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const zoom = (f: number) => setScale((s) => Math.min(4, Math.max(1, +(s * f).toFixed(2))))
  const reset = () => { setScale(1); scrollerRef.current?.scrollTo({ top: 0, left: 0 }) }

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" aria-label="关闭" onClick={onClose}>×</button>
      <div className="lb-stage" ref={scrollerRef} onClick={(e) => e.stopPropagation()} onDoubleClick={() => (scale > 1 ? reset() : zoom(2))}>
        <img
          src={img.src}
          alt={img.credit}
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>
      <div className="lb-bar" onClick={(e) => e.stopPropagation()}>
        <button className="lb-btn" aria-label="放大" onClick={() => zoom(1.35)}>＋</button>
        <button className="lb-btn" aria-label="缩小" onClick={() => zoom(1 / 1.35)}>－</button>
        <button className="lb-btn" aria-label="复位" onClick={reset}>⤢</button>
        <a className="lb-btn" href={img.src} download={`kaiwu-${img.src.split('/').pop()}`} aria-label="下载图片">↓</a>
      </div>
      <div className="lb-cap" onClick={(e) => e.stopPropagation()}>
        <b>{img.credit}</b>
        <span>{img.license}</span>
      </div>
    </div>
  )
}
