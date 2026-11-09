import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'
import Avatar from './Avatar.jsx'

const navItems = [
  { to: '/discussions', label: 'Discussions', icon: 'forum' },
  { to: '/news', label: 'News Reel', icon: 'newspaper' },
  { to: '/profile', label: 'My Portfolio', icon: 'account_balance_wallet' },
]

function navLinkClasses({ isActive }) {
  return [
    'flex items-center gap-md px-md py-sm font-body-md transition-colors group border-l-2',
    isActive
      ? 'text-primary border-primary font-bold bg-surface-container-low'
      : 'text-on-surface-variant border-transparent hover:text-primary hover:bg-surface-container',
  ].join(' ')
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setDark((d) => !d)}
      className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center h-8 w-8 rounded-full"
    >
      <span className="material-symbols-outlined">{dark ? 'light_mode' : 'dark_mode'}</span>
    </button>
  )
}

function SearchBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') || '')
  const targetSection = location.pathname.startsWith('/news') ? '/news' : '/discussions'

  useEffect(() => {
    setValue(params.get('q') || '')
  }, [params])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    navigate(trimmed ? `${targetSection}?q=${encodeURIComponent(trimmed)}` : targetSection)
  }

  return (
    <form className="flex-1 max-w-md" onSubmit={handleSubmit}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-0 text-body-sm placeholder:text-outline outline-none h-8"
          placeholder="Search discussions, news, tickers..."
          type="text"
        />
      </div>
    </form>
  )
}

function getNotificationMeta(type) {
  switch (type) {
    case 'market_alert':
      return { icon: 'trending_up', bg: 'bg-error/15 text-error border-error/30' }
    case 'accuracy_call':
      return { icon: 'verified', bg: 'bg-secondary/15 text-secondary border-secondary/30' }
    case 'comment':
      return { icon: 'chat_bubble', bg: 'bg-primary/15 text-primary border-primary/30' }
    case 'community_post':
      return { icon: 'campaign', bg: 'bg-surface-variant text-on-surface-variant border-outline-variant' }
    case 'broadcast':
    default:
      return { icon: 'bolt', bg: 'bg-primary/15 text-primary border-primary/30' }
  }
}

function NotificationsMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [showCompose, setShowCompose] = useState(false)
  const [composeType, setComposeType] = useState('market_alert')
  const [composeTitle, setComposeTitle] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [latestToast, setLatestToast] = useState(null)

  const fetchNotifications = useCallback(async (isPolling = false) => {
    try {
      const data = await api.get('/notifications')
      if (data?.notifications) {
        setNotifications((prev) => {
          if (isPolling && prev && prev.length > 0 && data.notifications.length > 0) {
            const prevIds = new Set(prev.map((n) => n.id))
            const brandNew = data.notifications.find((n) => !prevIds.has(n.id) && !n.read)
            if (brandNew) {
              setLatestToast(brandNew)
              setTimeout(() => setLatestToast(null), 5000)
            }
          }
          return data.notifications
        })
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // Quietly ignore polling failures
    }
  }, [])

  useEffect(() => {
    fetchNotifications(false)
    const timer = setInterval(() => fetchNotifications(true), 15000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  async function handleNotificationClick(n) {
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n.id}/read`)
        setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {}
    }
    setOpen(false)
    if (n.link) {
      navigate(n.link)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.post('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  async function handleSimulateAlert() {
    try {
      const res = await api.post('/notifications/simulate')
      if (res?.id) {
        setNotifications((prev) => [res, ...(prev || [])])
        setUnreadCount((c) => c + 1)
        setLatestToast(res)
        setTimeout(() => setLatestToast(null), 5000)
      }
    } catch (err) {
      console.error('Simulation error:', err)
    }
  }

  async function handlePostLiveAlert(e) {
    e.preventDefault()
    if (!composeTitle.trim() || !composeMessage.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post('/notifications', {
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        type: composeType,
        isGlobal: true,
      })
      if (res?.id) {
        setNotifications((prev) => [res, ...(prev || [])])
        setUnreadCount((c) => c + 1)
        setComposeTitle('')
        setComposeMessage('')
        setShowCompose(false)
      }
    } catch (err) {
      console.error('Failed to post live alert:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredItems = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  return (
    <>
      <div className="relative">
        <button
          aria-label="Notifications"
          onClick={() => setOpen((o) => !o)}
          className="relative text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center h-8 w-8 rounded-full"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-10 w-80 sm:w-96 bg-surface border border-outline-variant rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh] animate-fade-in">
              {/* Header */}
              <div className="p-sm md:p-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <span className="text-label-caps text-on-surface uppercase font-bold text-xs tracking-wider">
                    Live Alerts & Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-xs">
                  <button
                    onClick={() => setShowCompose((c) => !c)}
                    title="Post a live market alert"
                    className="p-1 rounded text-primary hover:bg-surface-container flex items-center gap-0.5 text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_alert</span>
                    <span>Post</span>
                  </button>
                  <button
                    onClick={handleSimulateAlert}
                    title="Simulate incoming live market event"
                    className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      title="Mark all as read"
                      className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Compose Live Alert Form */}
              {showCompose && (
                <form onSubmit={handlePostLiveAlert} className="p-sm bg-surface-container-lowest border-b border-outline-variant flex flex-col gap-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-label-caps text-xs text-primary font-bold">Broadcast Live Alert</span>
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className="text-outline hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <div className="flex gap-xs overflow-x-auto pb-1">
                    {[
                      { key: 'market_alert', label: '🚨 Market Alert' },
                      { key: 'broadcast', label: '⚡ Signal' },
                      { key: 'accuracy_call', label: '🎯 Call' },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.key}
                        onClick={() => setComposeType(t.key)}
                        className={`text-body-xs px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                          composeType === t.key
                            ? 'bg-primary text-on-primary border-primary font-semibold'
                            : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Alert Headline (e.g. NVDA breaks $850)..."
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    className="w-full px-sm py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary"
                  />

                  <textarea
                    required
                    rows={2}
                    placeholder="Alert details or market commentary..."
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    className="w-full px-sm py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary resize-none"
                  />

                  <div className="flex justify-end gap-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className="px-sm py-0.5 text-xs text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !composeTitle.trim() || !composeMessage.trim()}
                      className="px-sm py-0.5 text-xs bg-primary text-on-primary rounded font-semibold hover:bg-opacity-90 disabled:opacity-50"
                    >
                      {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
                    </button>
                  </div>
                </form>
              )}

              {/* Filter tabs */}
              <div className="px-sm py-1 bg-surface-container-lowest border-b border-outline-variant flex gap-sm text-body-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`pb-0.5 border-b-2 font-semibold transition-colors ${
                    filter === 'all'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`pb-0.5 border-b-2 font-semibold transition-colors ${
                    filter === 'unread'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[55vh] divide-y divide-outline-variant">
                {filteredItems.length === 0 ? (
                  <div className="py-xl px-md text-center flex flex-col items-center gap-xs">
                    <span className="material-symbols-outlined text-outline text-3xl">notifications_paused</span>
                    <p className="text-body-sm text-on-surface-variant">No notifications to show.</p>
                    <button
                      onClick={handleSimulateAlert}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      Simulate a live market alert
                    </button>
                  </div>
                ) : (
                  filteredItems.map((n) => {
                    const meta = getNotificationMeta(n.type)
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-sm flex items-start gap-sm cursor-pointer transition-colors hover:bg-surface-container ${
                          !n.read ? 'bg-primary/5' : 'bg-surface'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${meta.bg}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-xs">
                            <span
                              className={`text-body-xs truncate font-bold ${
                                !n.read ? 'text-on-surface' : 'text-on-surface-variant'
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-outline shrink-0 whitespace-nowrap">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-body-xs text-on-surface-variant line-clamp-2 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        </div>

                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Live Toast banner for incoming live alerts */}
      {latestToast && (
        <div
          onClick={() => {
            if (latestToast.link) navigate(latestToast.link)
            setLatestToast(null)
          }}
          className="fixed top-16 right-4 z-50 max-w-sm bg-surface border border-primary/50 text-on-surface p-sm rounded-lg shadow-2xl flex items-start gap-sm cursor-pointer animate-fade-in hover:bg-surface-container"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body-xs font-bold text-on-surface truncate">{latestToast.title}</div>
            <div className="text-body-xs text-on-surface-variant line-clamp-2">{latestToast.message}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLatestToast(null)
            }}
            className="text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </>
  )
}

function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button aria-label="Profile menu" onClick={() => setOpen((o) => !o)} className="flex items-center justify-center rounded-full">
        <Avatar user={user} className="w-8 h-8" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-56 bg-surface-container-lowest border border-outline-variant rounded z-50 py-xs">
            <div className="px-md py-sm border-b border-outline-variant">
              <p className="text-body-md text-on-surface font-bold truncate">{user?.display_name}</p>
              <p className="text-body-sm text-on-surface-variant truncate">@{user?.handle}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false)
                navigate('/profile')
              }}
              className="w-full text-left px-md py-sm text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              View profile
            </button>
            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="w-full text-left px-md py-sm text-body-md text-error hover:bg-surface-container transition-colors"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface-container-lowest border-t border-outline-variant flex z-40 pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center justify-center gap-[2px] py-xs px-[2px] ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
          }
        >
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          <span className="text-[10px] leading-tight text-center">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  return (
    <div>
      <header className="fixed top-0 right-0 left-0 md:left-64 h-14 md:h-16 bg-surface border-b border-outline-variant flex justify-between items-center gap-sm px-sm md:px-lg z-50">
        <Link to="/discussions" className="md:hidden shrink-0 w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-headline-md">
          I
        </Link>
        <SearchBar />
        <div className="flex items-center gap-xs md:gap-md shrink-0">
          <ThemeToggle />
          <NotificationsMenu />
          <ProfileMenu />
        </div>
      </header>

      <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex-col py-lg px-md z-40">
        <Link to="/discussions" className="mb-xl px-sm flex items-center gap-sm hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-headline-md">
            I
          </div>
          <div>
            <div className="text-headline-md font-bold text-primary leading-tight">InvestCircle</div>
            <div className="text-label-caps text-outline">Market Insights</div>
          </div>
        </Link>
        <div className="flex-1 flex flex-col gap-sm">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="md:ml-64 mt-14 md:mt-16 p-md md:p-lg pb-20 md:pb-lg max-w-container-max mx-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
