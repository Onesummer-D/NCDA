/* 图片资产与来源（图注挂证据链：每张图可在 Wikimedia Commons 打开核对授权） */
export interface ImgMeta {
  src: string
  credit: string   // 图注：内容描述 + 作者
  license: string  // 授权
  page: string     // 来源页
}

const IMG = (n: string) => `/images/${n}.jpg`
const CP = (title: string) => `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

export const NODE_IMAGES: Record<string, ImgMeta> = {
  A1: { src: IMG('a1'), credit: '《天工开物》明刊本 · 采煤图', license: '公有领域', page: CP('File:Tiangong Kaiwu Coal Mining.gif') },
  A2: { src: IMG('a2'), credit: '《天工开物》明刊本（1637）书影', license: '公有领域', page: CP('File:The Exploitation of the Works of Nature (Tiangong Kaiwu) WDL3021.pdf') },
  A3: { src: IMG('a3'), credit: '《天工开物》明刊本 · 生熟铁炉图', license: '公有领域', page: CP('File:Chinese Fining and Blast Furnace.jpg') },
  A4: { src: IMG('a4'), credit: '《天工开物》明刊本 · 铸鼎铸钟图', license: '公有领域', page: CP('File:Casting a Tripod, Bell, and Statue.jpg') },
  A5: { src: IMG('a5'), credit: '《天工开物》明刊本 · 水碓图', license: '公有领域', page: CP('File:Hydraulic-Powdered Trip Hammers.jpg') },
  M1: { src: IMG('m1'), credit: '露天采矿场 · Geomartin 摄', license: 'CC BY-SA 3.0', page: CP('File:Twincreeksblast.jpg') },
  M2: { src: IMG('m2'), credit: '萨贡托高炉 · Diego Delso 摄', license: 'CC BY-SA 4.0', page: CP('File:Alto Horno, Puerto de Sagunto, España, 2015-01-04, DD 91.JPG') },
  M3: { src: IMG('m3'), credit: '蒂森克虏伯杜伊斯堡钢厂 · Katpatuka 摄', license: 'CC BY-SA 3.0', page: CP('File:ThyssenKrupp Duisburg 016.jpg') },
  M4: { src: IMG('m4'), credit: '迪林根根连铸产线（ECSC 档案）', license: 'CC BY-SA 4.0', page: CP('File:ECSC Financial report 1995 Dillinger Hütte Continuous casting.jpg') },
  M5: { src: IMG('m5'), credit: '两辊可逆热轧机（历史影像）', license: '公有领域 · NARA 541179', page: 'https://commons.wikimedia.org/w/index.php?search=NARA+541179+hot+roll' },
  M6: { src: IMG('m6'), credit: '螺纹钢筋 · ArcelorMittal Kryvyi Rih', license: 'CC BY-SA 4.0', page: CP('File:Арматурный прокат.jpg') },
}

export const HERO_SLIDES: { src: string; eyebrow: string; title: string; tab: 'walk' | 'craft' | 'spectrum'; credit: string; license: string }[] = [
  { src: IMG('hero1'), eyebrow: '研学基地 · 江西新余', title: '一块铁 · 近四百年', tab: 'walk', credit: 'Hoogovens · Jesper Schoen 摄', license: 'CC BY 2.5' },
  { src: IMG('hero2'), eyebrow: '现场 · 出铁时刻', title: '铁水怎样变成钢', tab: 'craft', credit: 'Viktor Mácha 摄', license: 'CC BY-SA 4.0' },
  { src: IMG('hero3'), eyebrow: '《天工开物》· 1637', title: '古今同一道造物题', tab: 'spectrum', credit: '《天工开物》明刊本', license: '公有领域' },
]

export const FALLBACK_IMG: ImgMeta = { src: IMG('m2'), credit: '高炉 · Diego Delso 摄', license: 'CC BY-SA 4.0', page: CP('File:Alto Horno, Puerto de Sagunto, España, 2015-01-04, DD 91.JPG') }
