import { useEffect, useState } from 'react'
import { api, type TeacherSummary } from '../api'

const GAP_LABEL: Record<string, string> = {
  fe_vs_steel: '炼铁 → 炼钢',
  why_steelmaking: '为什么炼钢',
  slab_not_product: '钢坯 ≠ 产品',
  forming_principle: '锻打 ↔ 轧制',
  ancient_iron_quality: '古代提纯',
  huohou: '火候判断',
  knowledge_transfer: '知识传承',
  industry_chain: '产业链结构',
  safety: '安全边界',
}

const NODE_TITLES: Record<string, string> = {
  A1: '山中取矿', A2: '烧炭备薪', A3: '筑炉冶炼', A4: '浇铸成器', A5: '锻打精制',
  M1: '铁矿石采选', M2: '高炉炼铁', M3: '转炉炼钢', M4: '连铸成坯', M5: '轧制成材', M6: '精深加工与新材料',
}

export default function Teacher() {
  const [data, setData] = useState<TeacherSummary | null>(null)
  const [updatedAt, setUpdatedAt] = useState('')

  const load = () => {
    api.teacher().then((d) => {
      setData(d)
      setUpdatedAt(new Date().toLocaleTimeString('zh-CN'))
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)   // 每 15 秒自动刷新，数据始终是活的
    return () => clearInterval(iv)
  }, [])

  const maxGap = data ? Math.max(1, ...data.top_gap_topics.map((g) => g.n)) : 1

  return (
    <div className="teacher-page">
      <div className="t-head">
        <div>
          <h1>理解断点</h1>
          <div className="t-live">
            <span className="t-live-dot" />实时数据{updatedAt && ` · 更新于 ${updatedAt}`}
            <button className="t-refresh" onClick={load}>刷新</button>
          </div>
        </div>
        <div className="t-fine">《开物脉络》</div>
      </div>

      {data && (
        <>
          <div className="stat-row">
            <div className="stat-box"><div className="n">{data.sessions}</div><div className="label">会话</div></div>
            <div className="stat-box"><div className="n">{data.tasks.reduce((a, t) => a + t.answered, 0)}</div><div className="label">互动</div></div>
            <div className="stat-box"><div className="n">{data.qa_count}</div><div className="label">追问</div></div>
            <div className="stat-box"><div className="n">{data.top_gap_topics[0]?.n ?? 0}</div><div className="label">最高断点</div></div>
          </div>

          {data.advice && (
            <p className="advice-plain">
              <b>{data.advice_source === 'ai' ? 'AI 建议' : '建议'}</b>　{data.advice.replace(/^建议：/, '')}
              {data.advice_pending && <span className="advice-pending">（AI 正在结合最新数据生成…）</span>}
            </p>
          )}

          <h3 className="t-section">任务数据</h3>
          <table className="ttable">
            <thead>
              <tr><th>节点</th><th>到达</th><th>完成</th><th>首答对</th><th style={{ width: '30%' }}>完成率</th></tr>
            </thead>
            <tbody>
              {data.tasks.map((t) => {
                const ratio = t.reached > 0 ? t.answered / t.reached : 0
                return (
                  <tr key={t.task_id}>
                    <td>{NODE_TITLES[t.node_id] ?? t.node_id}</td>
                    <td className="num">{t.reached}</td>
                    <td className="num">{t.answered}</td>
                    <td className="num t-pos">{t.first_correct}</td>
                    <td className="bar-cell">
                      {Math.round(ratio * 100)}%
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${ratio * 100}%` }} /></div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h3 className="t-section">断点排行</h3>
          <table className="ttable">
            <thead><tr><th>工艺关系</th><th style={{ width: '45%' }}>人次</th></tr></thead>
            <tbody>
              {data.top_gap_topics.length === 0 && <tr><td colSpan={2} className="t-note">暂无</td></tr>}
              {data.top_gap_topics.map((g) => (
                <tr key={g.gap_topic}>
                  <td>{GAP_LABEL[g.gap_topic] ?? g.gap_topic}</td>
                  <td className="bar-cell">
                    <span className="num">{g.n}</span>
                    <div className="bar-track"><div className="bar-fill hot" style={{ width: `${(g.n / maxGap) * 100}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {!data && <div className="t-note">读取中…</div>}
    </div>
  )
}
