import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
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

function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center h-8 w-8 rounded-full"
      >
        <span className="material-symbols-outlined">notifications</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-64 bg-surface-container-lowest border border-outline-variant rounded shadow-none z-50 p-md">
            <p className="text-label-caps text-outline uppercase mb-sm">Notifications</p>
            <p className="text-body-sm text-on-surface-variant">No notifications yet.</p>
          </div>
        </>
      )}
    </div>
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
