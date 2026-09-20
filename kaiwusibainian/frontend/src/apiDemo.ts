import type { RecoResponse } from './api'

/** 静态演示模式的「补一环」推荐：直接从内置内容库按节点关联挑选，规则从简 */
let rawCache: Promise<Record<string, any>> | null = null
const loadRaw = () => (rawCache ??= fetch(`${import.meta.env.BASE_URL}content.json`).then((r) => r.json()))

export async function demoRecommend(nodeId?: string): Promise<RecoResponse> {
  const raw = await loadRaw()
  const expls: any[] = raw.explanations ?? []
  const pool = nodeId
    ? expls.filter((x) => (x.node_ids ?? []).includes(nodeId))
    : expls
  const depthOrder: Record<string, number> = { core: 0, intro: 1, deep: 2 }
  const picked = [...pool]
    .sort((a, b) => (depthOrder[a.depth] ?? 3) - (depthOrder[b.depth] ?? 3))
    .slice(0, 2)
    .map((x) => ({
      id: x.id, title: x.title, body: x.body, depth: x.depth,
      node_ids: x.node_ids ?? [], source_refs: x.source_refs ?? [],
      score: 1, reasons: ['演示模式：按当前节点关联推荐'],
    }))
  // 下一步：今列链式推进
  let next_node: string | null = null
  if (nodeId && nodeId.startsWith('M')) {
    const mod = (raw.process_nodes ?? []).filter((n: any) => n.era === 'modern').map((n: any) => n.id).sort()
    const i = mod.indexOf(nodeId)
    if (i >= 0 && i + 1 < mod.length) next_node = mod[i + 1]
  }
  return { variant: 'adaptive', unresolved_gaps: [], resolved_gaps: [], recommendations: picked, next_node }
}
