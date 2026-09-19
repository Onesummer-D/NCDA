/* 图片资产与来源（图注挂证据链：每张图可在来源页核对授权） */
export interface ImgMeta {
  src: string
  credit: string   // 图注：内容描述 + 作者
  license: string  // 授权
  page: string     // 来源页
}

const IMG = (n: string) => `/images/${n}.jpg`
const CP = (title: string) => `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
const CCTV = 'https://local.cctv.com/2023/10/25/ARTI8dWM4uos18x2iyvJxDal231025.shtml'
const MUSEUM = 'https://www.xysmuseum.com/587.html'

/** 全部图片的元数据表（key = 文件名，不含扩展名） */
export const IMG_META: Record<string, ImgMeta> = {
  a1: { src: IMG('a1'), credit: '《天工开物》明刊本 · 采煤图', license: '公有领域', page: CP('File:Tiangong Kaiwu Coal Mining.gif') },
  a2: { src: IMG('a2'), credit: '《天工开物》明刊本（1637）书影', license: '公有领域', page: CP('File:The Exploitation of the Works of Nature (Tiangong Kaiwu) WDL3021.pdf') },
  a3: { src: IMG('a3'), credit: '《天工开物》明刊本 · 生熟铁炉图', license: '公有领域', page: CP('File:Chinese Fining and Blast Furnace.jpg') },
  a4: { src: IMG('a4'), credit: '《天工开物》明刊本 · 铸鼎铸钟图', license: '公有领域', page: CP('File:Casting a Tripod, Bell, and Statue.jpg') },
  a5: { src: IMG('a5'), credit: '《天工开物》明刊本 · 水碓图', license: '公有领域', page: CP('File:Hydraulic-Powdered Trip Hammers.jpg') },
  m1: { src: IMG('m1'), credit: '露天采矿场（示意）· Geomartin 摄', license: 'CC BY-SA 3.0', page: CP('File:Twincreeksblast.jpg') },
  m2: { src: IMG('m2'), credit: '新钢厂区 · 印象新钢工业旅游（央视网配图）', license: '媒体配图 · 演示用途', page: CCTV },
  m3: { src: IMG('m3'), credit: '转炉炼钢车间（示意）· Katpatuka 摄', license: 'CC BY-SA 3.0', page: CP('File:ThyssenKrupp Duisburg 016.jpg') },
  m4: { src: IMG('m4'), credit: '连铸产线（示意，ECSC 档案）', license: 'CC BY-SA 4.0', page: CP('File:ECSC Financial report 1995 Dillinger Hütte Continuous casting.jpg') },
  m5: { src: IMG('m5'), credit: '两辊可逆热轧机（历史影像）', license: '公有领域 · NARA 541179', page: 'https://commons.wikimedia.org/w/index.php?search=NARA+541179+hot+roll' },
  m6: { src: IMG('m6'), credit: '新钢 · 青花瓷冷却塔（央视网配图）', license: '媒体配图 · 演示用途', page: CCTV },
  site: { src: IMG('site'), credit: '凤凰山铁矿遗址 · 新余市博物馆', license: '官网配图 · 演示用途', page: MUSEUM },
  museum: { src: IMG('museum'), credit: '新余市博物馆', license: '官网配图 · 演示用途', page: MUSEUM },
  hero1: { src: IMG('hero1'), credit: '新钢厂区航拍（央视网配图）', license: '媒体配图 · 演示用途', page: CCTV },
  hero2: { src: IMG('hero2'), credit: '出铁时刻 · Viktor Mácha 摄', license: 'CC BY-SA 4.0', page: CP('File:Práce na martinské peci.jpg') },
  hero3: { src: IMG('hero3'), credit: '《天工开物》明刊本 · 生熟铁炉图', license: '公有领域', page: CP('File:Chinese Fining and Blast Furnace.jpg') },
}

/** 节点 → 配图（现场页头图） */
export const NODE_IMAGES: Record<string, ImgMeta> = {
  A1: IMG_META.a1, A2: IMG_META.a2, A3: IMG_META.a3, A4: IMG_META.a4, A5: IMG_META.a5,
  M1: IMG_META.m1, M2: IMG_META.m2, M3: IMG_META.m3, M4: IMG_META.m4, M5: IMG_META.m5, M6: IMG_META.m6,
}

/** 七个造物问的专属配图（跨步骤不重复） */
export const CRAFT_CARD_IMAGES: Record<string, string> = {
  Q1: 'a1',      // 取材 · 入山取料
  Q2: 'a3',      // 控火 · 生熟铁炉
  Q3: 'm3',      // 提纯 · 转炉
  Q4: 'a4',      // 成形 · 铸鼎铸钟
  Q5: 'a5',      // 控性 · 水碓锻打
  Q6: 'museum',  // 传技 · 新余市博物馆（知识保存）
  Q7: 'm6',      // 善境 · 青花瓷冷却塔
}

/** 造物问 古/今时代面板配图（同题两代不同图，跨题尽量不重复） */
export const CRAFT_PANEL_IMAGES: Record<string, { ancient: string; modern: string }> = {
  Q1: { ancient: 'a1', modern: 'm1' },
  Q2: { ancient: 'a2', modern: 'm2' },
  Q3: { ancient: 'a3', modern: 'm3' },
  Q4: { ancient: 'a4', modern: 'm4' },
  Q5: { ancient: 'a5', modern: 'm5' },
  Q6: { ancient: 'museum', modern: 'm6' },
  Q7: { ancient: 'site', modern: 'hero1' },
}

/** 问答页顶部氛围图 */
export const QA_HERO = IMG_META.hero2
/** 开物谱页配图 */
export const SPECTRUM_HERO = IMG_META.a3

export const HERO_SLIDES: { src: string; eyebrow: string; title: string; tab: 'walk' | 'craft' | 'spectrum' }[] = [
  { src: IMG('hero1'), eyebrow: '研学基地 · 江西新余', title: '一块铁 · 近四百年', tab: 'walk' },
  { src: IMG('hero2'), eyebrow: '现场 · 出铁时刻', title: '铁水怎样变成钢', tab: 'craft' },
  { src: IMG('hero3'), eyebrow: '《天工开物》· 1637', title: '古今同一道造物题', tab: 'spectrum' },
]

export const FALLBACK_IMG: ImgMeta = IMG_META.m2
