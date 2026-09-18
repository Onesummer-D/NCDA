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

export default function Teacher() {
  const [data, setData] = useState<TeacherSummary | null>(null)

  useEffect(() => {
    api.teacher().then(setData).catch(() => {})
  }, [])

  return (
    <div className="teacher-page">
      <div className="t-head">
        <div>
          <div className="eyebrow accent">教师 · 场馆</div>
          <h1 style={{ marginTop: 10 }}>理解断点</h1>
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

          {data.advice && <div className="advice-box">{data.advice}</div>}

          <div className="eyebrow section-label">任务数据</div>
          <table className="ttable">
            <thead>
              <tr><th>节点</th><th>到达</th><th>完成</th><th>首答对</th><th>首答错</th></tr>
            </thead>
            <tbody>
              {data.tasks.map((t) => (
                <tr key={t.task_id}>
                  <td>{t.node_id}</td>
                  <td className="num">{t.reached}</td>
                  <td className="num">{t.answered}</td>
                  <td className="num t-pos">{t.first_correct}</td>
                  <td className="num t-neg">{t.first_wrong}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="eyebrow section-label">断点排行</div>
          <table className="ttable">
            <thead><tr><th>工艺关系</th><th>人次</th></tr></thead>
            <tbody>
              {data.top_gap_topics.length === 0 && <tr><td colSpan={2} className="t-note">暂无</td></tr>}
              {data.top_gap_topics.map((g) => (
                <tr key={g.gap_topic}>
                  <td>{GAP_LABEL[g.gap_topic] ?? g.gap_topic}</td>
                  <td className="num">{g.n}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="t-note">示例数据 · 场馆端用于展陈优化，教师端用于返校讨论聚焦</div>
        </>
      )}
      {!data && <div className="t-note">读取中…</div>}
    </div>
  )
}
