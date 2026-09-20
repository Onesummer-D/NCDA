import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './store'
import { api } from './api'
import Home from './screens/Home'
import Craft from './screens/Craft'
import Walk from './screens/Walk'
import Spectrum from './screens/Spectrum'
import Qa from './screens/Qa'
import Teacher from './screens/Teacher'
import Login from './screens/Login'
import Doc from './screens/Doc'
import Splash from './screens/Splash'
import AvatarMenu from './components/AvatarMenu'
import { renderPoster } from './poster'

type Tab = 'home' | 'craft' | 'walk' | 'spectrum' | 'qa'

const TAB_KEYS: Tab[] = ['home', 'craft', 'walk', 'spectrum', 'qa']
const DOC_KEYS = ['about', 'privacy', 'terms']
const tabFromHash = (): Tab => {
  const h = window.location.hash.replace(/^#\//, '')
  return (TAB_KEYS as string[]).includes(h) ? (h as Tab) : 'home'
}
const docFromHash = () => {
  const h = window.location.hash.replace(/^#\//, '')
  return (DOC_KEYS as string[]).includes(h) ? (h as 'about' | 'privacy' | 'terms') : null
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: '溯源', icon: '铁' },
  { key: 'craft', label: '造物问', icon: '问' },
  { key: 'walk', label: '现场', icon: '观' },
  { key: 'spectrum', label: '开物谱', icon: '谱' },
  { key: 'qa', label: '问答', icon: '考' },
]

function Shell() {
  const { session, user, content, visitStart } = useApp()
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [mode, setMode] = useState('')
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    const want = tab === 'home' ? '#/' : `#/${tab}`
    if (window.location.hash !== want) history.replaceState(null, '', want)
  }, [tab])

  useEffect(() => {
    document.body.dataset.mode = session.id != null ? session.mode : (mode || 'school')
  }, [mode, session.id, session.mode])

  // —— 分享研学海报：学生/老师可分享；游客提示先登录 ——
  const sharePoster = async () => {
    if (!content) return
    if (!user) {
      setShareMsg('登录后即可生成研学海报')
      setTimeout(() => { setShareMsg(''); location.hash = '#/login' }, 1400)
      return
    }
    let states: Record<string, string> = {}
    if (session.id != null) {
      try { states = (await api.spectrum(session.id)).states } catch { /* 会话失效则用空状态 */ }
    }
    const blob = await renderPoster({
      content, states, visitStart,
      userName: user?.name ?? null,
      shareUrl: `${location.origin}/#/`,
    })
    if (!blob) { setShareMsg('海报生成失败'); setTimeout(() => setShareMsg(''), 2000); return }
    const file = new File([blob], '开物脉络-研学海报.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: '开物脉络 · 我的研学海报', text: '今天在新钢打卡了这些工艺节点，来看看我的开物谱！' })
        setShareMsg('已分享')
      } catch { /* 用户取消了分享面板 */ }
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '开物脉络-研学海报.png'
      a.click()
      URL.revokeObjectURL(a.href)
      setShareMsg('海报已保存，发到群里就能分享')
    }
    setTimeout(() => setShareMsg(''), 2600)
  }

  return (
    <div className="shell">
      {tab === 'home' && <Home mode={mode} onMode={setMode} onEnter={(t) => setTab(t as Tab)} />}
      {tab === 'craft' && <Craft onGoto={(t) => setTab(t)} />}
      {tab === 'walk' && <Walk onGoto={(t) => setTab(t)} />}
      {tab === 'spectrum' && <Spectrum />}
      {tab === 'qa' && <Qa />}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      <AvatarMenu onShare={sharePoster} />
      {shareMsg && <div className="share-toast">{shareMsg}</div>}
    </div>
  )
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  // 每次进入应用都播开屏
  const [splashDone, setSplashDone] = useState(false)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (!splashDone) {
    return (
      <Splash
        onDone={() => {
          try { localStorage.setItem(SPLASH_KEY, today) } catch { /* ignore */ }
          const logged = !!localStorage.getItem('kaiwu_user_v1')
          const target = logged ? (window.location.hash || '#/') : '#/login'
          if (window.location.hash !== target) history.replaceState(null, '', target)
          setHash(target)
          setSplashDone(true)
        }}
      />
    )
  }

  if (hash === '#/teacher') return <Teacher />
  if (hash === '#/login') return <AppProvider><Login /></AppProvider>
  const doc = docFromHash()
  if (doc) return <AppProvider><Doc doc={doc} /></AppProvider>

  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
