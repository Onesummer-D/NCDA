import { useEffect, useState } from 'react'
import { api, type TeacherSummary } from '../api'

export default function Teacher() {
  const [data, setData] = useState<TeacherSummary | null>(null)

  useEffect(() => {
    api.teacher().then(setData).catch(() => {})
  }, [])

  return (
    <div className="teacher-page">
      <div className="kicker">教师 / 场馆数据看板</div>
      <h1>这次研学，哪条工艺关系断了？</h1>
      <p className="teacher-sub">只展示可追溯的交互事实，不冒充教育测量。数据来自现场轻互动与观察任务信号。</p>

      {data && (
        <>
          <div className="stat-row">
            <div className="stat-box"><div className="n">{data.sessions}</div><div className="label">研学会话数</div></div>
            <div className="stat-box"><div className="n">{data.tasks.reduce((a, t) => a + t.answered, 0)}</div><div className="label">互动完成人次</div></div>
            <div className="stat-box"><div className="n">{data.qa_count}</div><div className="label">现场追问次数</div></div>
            <div className="stat-box"><div className="n">{data.top_gap_topics[0]?.n ?? 0}</div><div className="label">最高频理解断点人次</div></div>
          </div>

          <div className="advice-box">{data.advice}</div>

          <h2 className="section-title">观察任务一览</h2>
          <table className="ttable">
            <thead>
              <tr>
                <th>任务（节点）</th><th>到达</th><th>完成</th><th>首次正确</th><th>首次常见错误</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((t) => (
                <tr key={t.task_id}>
                  <td>{t.prompt.slice(0, 26)}…（{t.node_id}）</td>
                  <td>{t.reached}</td><td>{t.answered}</td>
                  <td style={{ color: 'var(--ok)' }}>{t.first_correct}</td>
                  <td style={{ color: 'var(--fire)' }}>{t.first_wrong}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="section-title">常见理解断点排行</h2>
          <table className="ttable">
            <thead><tr><th>工艺关系</th><th>出现人次</th></tr></thead>
            <tbody>
              {data.top_gap_topics.length === 0 && (
                <tr><td colSpan={2}>暂无记录</td></tr>
              )}
              {data.top_gap_topics.map((g) => (
                <tr key={g.gap_topic}>
                  <td>{GAP_LABEL[g.gap_topic] ?? g.gap_topic}</td>
                  <td>{g.n}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="note-ethical">
            场馆端用途：依据断点排行优化展陈说明与讲解词；教师端用途：返校讨论聚焦共性断点。
            本看板不输出“班级认知能力提升 X%”之类的无依据结论。
          </p>
        </>
      )}
      {!data && <p>正在读取数据…</p>}
    </div>
  )
}

const GAP_LABEL: Record<string, string> = {
  fe_vs_steel: '炼铁 → 炼钢（高炉产品被误认为最终钢材）',
  why_steelmaking: '为什么炼钢（吹氧降碳的目的）',
  slab_not_product: '钢坯 ≠ 最终产品（连铸后还需轧制）',
  forming_principle: '锻打 ↔ 轧制（塑性成形原理）',
  ancient_iron_quality: '古代铁质改善（锻打提纯）',
  huohou: '火候判断（古代过程控制）',
  knowledge_transfer: '工艺知识传承',
  industry_chain: '产业链整体结构',
  safety: '工业安全与参观边界',
}
