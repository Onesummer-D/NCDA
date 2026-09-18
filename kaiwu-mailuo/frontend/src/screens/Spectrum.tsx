import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { api, type SpectrumResponse } from '../api'

const LEGEND: { key: string; label: string; color: string }[] = [
  { key: 'unseen', label: '未接触', color: 'transparent' },
  { key: 'exposed', label: '已接触', color: 'var(--steel)' },
  { key: 'verified', label: '已验证', color: 'var(--ok)' },
  { key: 'gap_detected', label: '出现过断点', color: 'var(--accent)' },
]

export default function Spectrum() {
  const { session } = useApp()
  const [data, setData] = useState<SpectrumResponse | null>(null)
  const sid = session.id

  useEffect(() => {
    if (sid == null) return
    api.spectrum(sid).then(setData).catch(() => {})
  }, [sid])

  const finish = async () => {
    if (sid == null) return
    await api.finish(sid)
    setData(await api.spectrum(sid))
  }

  return (
    <div className="page">
      <div className="eyebrow accent">参观结束</div>
      <h2 className="h-page" style={{ marginTop: 12 }}>我的开物谱</h2>

      {sid == null && (
        <div className="card quiet" style={{ marginTop: 20 }}>
          <div className="t-small">尚未开始研学。回到「溯源」页进入后，这里会记录你的工艺脉络。</div>
        </div>
      )}

      {data && (
        <>
          <div className="legend">
            {LEGEND.map((l) => (
              <span key={l.key}><i style={{ background: l.color, border: l.color === 'transparent' ? '1px solid var(--hairline)' : 'none' }} />{l.label}</span>
            ))}
          </div>
          <div className="spec-list">
            {data.nodes.map((n) => (
              <div key={n.id} className="spec-row">
                <span className={`s-dot ${data.states[n.id]}`} />
                <span className="s-name">{n.title}</span>
                <span className="s-era">{n.era === 'ancient' ? '古' : '今'} · {n.stage}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {data && data.key_changes.length > 0 && (
        <div className="key-change">
          <div className="kc-title">关键变化</div>
          {data.key_changes.map((k, i) => <div key={i} className="kc-item">{k}</div>)}
        </div>
      )}

      {sid != null && (
        <button className="btn-primary" style={{ marginTop: 26 }} onClick={finish}>
          结束研学
        </button>
      )}
    </div>
  )
}
