import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { api, type SpectrumResponse } from '../api'

const STATE_LABEL: Record<string, string> = {
  unseen: '未接触', exposed: '已接触', verified: '已验证', gap_detected: '出现过断点',
}

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
    const fresh = await api.spectrum(sid)
    setData(fresh)
  }

  return (
    <div className="page">
      <div className="kicker">参观结束 · 不是数字纪念章</div>
      <h2 className="craft-title" style={{ fontSize: 24 }}>我的开物谱</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 6 }}>
        只使用真实交互信号：未接触 / 已接触 / 已验证 / 出现过断点。不显示“掌握度 87.4%”这类没有测量依据的数字。
      </p>

      {sid == null && <p style={{ marginTop: 16, fontSize: 13 }}>还没有开始研学会话——回到「溯源」页开始后，这里会记录你的工艺脉络。</p>}

      {data && (
        <div style={{ marginTop: 12 }}>
          {data.nodes.map((n) => (
            <div key={n.id} className="spec-node">
              <span className={`spec-state ${data.states[n.id]}`}>{STATE_LABEL[data.states[n.id]]}</span>
              <span className="spec-name">{n.title}</span>
              <span className="spec-era">{n.era === 'ancient' ? '古代线' : '现代线'} · {n.stage}</span>
            </div>
          ))}
        </div>
      )}

      {data && data.key_changes.length > 0 && (
        <div className="key-change">
          <div className="kc-kicker">今日理解的关键变化</div>
          {data.key_changes.map((k, i) => <div key={i}>{k}</div>)}
        </div>
      )}

      {sid != null && (
        <button className="btn-primary" style={{ letterSpacing: '0.2em', textIndent: 0 }} onClick={finish}>
          结束研学并生成开物谱
        </button>
      )}
      <p className="note-ethical">
        你的带队教师会在教师端看到同类汇总：哪条工艺关系最容易断，下一节课值得补什么——只展示事实，不冒充教育测量。
      </p>
    </div>
  )
}
