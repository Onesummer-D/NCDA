import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './store'
import Home from './screens/Home'
import Craft from './screens/Craft'
import Walk from './screens/Walk'
import Spectrum from './screens/Spectrum'
import Qa from './screens/Qa'
import Teacher from './screens/Teacher'
import Login from './screens/Login'
import Doc from './screens/Doc'

type Tab = 'home' | 'craft' | 'walk' | 'spectrum' | 'qa'
type DocKey = 'about' | 'privacy' | 'terms'

const TAB_KEYS: Tab[] = ['home', 'craft', 'walk', 'spectrum', 'qa']
const DOC_KEYS: DocKey[] = ['about', 'privacy', 'terms']
const tabFromHash = (): Tab => {
  const h = window.location.hash.replace(/^#\//, '')
  return (TAB_KEYS as string[]).includes(h) ? (h as Tab) : 'home'
}
const docFromHash = (): DocKey | null => {
  const h = window.location.hash.replace(/^#\//, '')
  return (DOC_KEYS as string[]).includes(h) ? (h as DocKey) : null
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: '溯源', icon: '铁' },
  { key: 'craft', label: '造物问', icon: '问' },
  { key: 'walk', label: '现场', icon: '观' },
  { key: 'spectrum', label: '开物谱', icon: '谱' },
  { key: 'qa', label: '问答', icon: '考' },
]

function Shell() {
  const { session, user } = useApp()
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [mode, setMode] = useState('')

  // hash ↔ 标签页双向同步：页面可分享、可直达（#/walk、#/spectrum…）
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    const want = tab === 'home' ? '#/' : `#/${tab}`
    if (window.location.hash !== want) history.replaceState(null, '', want)
  }, [tab])

  // 模式即主题：选中模式（或会话模式）立即切换全局强调色
  useEffect(() => {
    document.body.dataset.mode = session.id != null ? session.mode : (mode || 'school')
  }, [mode, session.id, session.mode])

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
      {/* 已登录老师：悬浮入口直达教师控制台 */}
      {user?.role === 'teacher' && tab !== 'home' && (
        <a className="teacher-fab" href="#/teacher" title="教师控制台">师</a>
      )}
    </div>
  )
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

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
