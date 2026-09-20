import { useEffect, useRef } from 'react'

/** 开屏：粒子光效浮现"开物四百年"，播放完进入登录页 */
export default function Splash({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // 尺寸自适应：随时跟随窗口（含手机旋转、软键盘弹出等）
    let W = 0
    let H = 0
    const fit = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // 尺寸变化后把粒子收回可视范围内
      for (const p of parts) {
        if (p.x > W) p.x = Math.random() * W
        if (p.y > H) p.y = H * 0.35 + Math.random() * H * 0.5
      }
    }

    // 粒子：暖金色光尘，缓慢上浮
    const parts: { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number }[] = []
    const seed = () => {
      parts.length = 0
      // 粒子数按屏幕面积缩放，手机上少一点省电
      const n = Math.max(36, Math.min(70, Math.round((W * H) / 16000)))
      for (let i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W,
          y: H * 0.35 + Math.random() * H * 0.5,
          r: Math.random() * 2.2 + 0.6,
          vy: -(Math.random() * 0.35 + 0.08),
          vx: (Math.random() - 0.5) * 0.2,
          a: Math.random() * 0.5 + 0.15,
          tw: Math.random() * Math.PI * 2,
        })
      }
    }
    fit()
    seed()

    let raf = 0
    let stop = false
    const tick = () => {
      if (stop) return
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        p.y += p.vy
        p.x += p.vx
        p.tw += 0.03
        if (p.y < H * 0.2) p.y = H * 0.9
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw))
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        grad.addColorStop(0, `rgba(196,141,58,${alpha})`)
        grad.addColorStop(1, 'rgba(196,141,58,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    window.addEventListener('resize', fit)
    const timer = setTimeout(() => { stop = true; cancelAnimationFrame(raf); onDone() }, 3200)
    return () => {
      stop = true
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('resize', fit)
    }
  }, [onDone])

  return (
    <div className="splash">
      <canvas ref={canvasRef} className="splash-canvas" />
      <div className="splash-brand">
        <div className="splash-title">开物四百年</div>
        <div className="splash-sub">一块铁 · 近四百年</div>
      </div>
    </div>
  )
}
