import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/context/AuthContext.jsx'
import Reveal from '../../shared/components/Reveal.jsx'
import { useTypewriter } from '../../shared/lib/useTypewriter.js'

const PHRASES = [
  'Discuss stocks with real investors.',
  'React to market news with your voice.',
  'Track your portfolio, live.',
]

const FEATURES = [
  {
    icon: 'forum',
    title: 'Discussions',
    text: 'A Reddit-style board for every ticker — post a call, upvote the good ones, argue it out in the comments.',
  },
  {
    icon: 'podcasts',
    title: 'News Reel',
    text: "Swipe through market news like a feed. Record a real voice take — bullish or bearish — and see what others said, with a trust-tier glow around the names that have earned it.",
  },
  {
    icon: 'account_balance_wallet',
    title: 'Portfolio',
    text: 'Track your holdings with live P&L, per-currency summaries, and fundamentals for every company you follow.',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const typed = useTypewriter(PHRASES)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(location.state?.from || '/discussions', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero + login, both visible above the fold on desktop */}
      <section className="lg:min-h-screen grid lg:grid-cols-2">
        {/* Marketing side */}
        <div className="flex flex-col justify-center px-lg md:px-xl py-xl lg:py-0 order-2 lg:order-1 border-r-0 lg:border-r border-outline-variant">
          <div className="max-w-[520px] mx-auto lg:mx-0 lg:ml-auto lg:mr-xl">
            <div className="flex items-center gap-xs mb-lg">
              <span className="material-symbols-outlined text-primary text-[28px]">monitoring</span>
              <span className="font-display text-headline-md text-primary tracking-tight">InvestCircle</span>
            </div>

            <h1 className="font-display text-[34px] md:text-[44px] leading-[1.08] tracking-tight text-on-surface font-bold">
              Where retail investors
              <br />
              actually talk shop.
            </h1>

            <p className="mt-md text-body-lg text-on-surface-variant h-[28px]">
              {typed}
              <span className="inline-block w-[2px] h-[18px] bg-primary align-middle ml-[2px] animate-blink" />
            </p>

            <div className="mt-xl flex flex-col gap-sm">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-[2px]">{f.icon}</span>
                  <div>
                    <span className="text-body-md font-semibold text-on-surface">{f.title}</span>
                    <span className="text-body-sm text-on-surface-variant"> — {f.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="flex items-center justify-center p-md md:p-xl order-1 lg:order-2">
          <main className="w-full max-w-[380px] bg-surface-container-lowest border border-outline-variant rounded-lg p-xl flex flex-col">
            <header className="flex flex-col items-center mb-xl lg:hidden">
              <div className="flex items-center gap-xs mb-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">monitoring</span>
                <span className="font-display text-headline-md text-primary tracking-tight">InvestCircle</span>
              </div>
            </header>
            <h2 className="text-headline-md text-on-surface mb-lg">Log in to your account</h2>
            <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-xs">
                <label className="text-body-sm text-on-surface-variant" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-sm border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface focus:border-primary transition-colors outline-none"
                  placeholder="name@example.com"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-body-sm text-on-surface-variant" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-sm border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface focus:border-primary transition-colors outline-none"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-body-sm text-error">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 mt-sm bg-primary text-on-primary text-body-md rounded hover:bg-primary-container transition-colors active:opacity-80 disabled:opacity-60"
              >
                {submitting ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <div className="mt-lg text-body-md text-on-surface-variant text-center">
              New here?{' '}
              <Link className="text-primary hover:text-primary-container transition-colors" to="/signup">
                Sign up
              </Link>
            </div>
          </main>
        </div>
      </section>

      {/* Below the fold — scroll-revealed feature detail */}
      <section className="max-w-[1000px] mx-auto px-lg md:px-xl py-xl md:py-[80px]">
        <Reveal as="h2" className="font-display text-headline-lg md:text-[28px] text-on-surface text-center">
          Built for people who actually hold positions.
        </Reveal>
        <Reveal
          as="p"
          delay={80}
          className="mt-sm text-body-lg text-on-surface-variant text-center max-w-[560px] mx-auto"
        >
          Three screens, one app — discuss, follow the news, and watch your own portfolio move.
        </Reveal>

        <div className="mt-xl grid md:grid-cols-3 gap-lg">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120} className="border border-outline-variant rounded-lg p-lg bg-surface-container-lowest">
              <span className="material-symbols-outlined text-primary text-[32px]">{f.icon}</span>
              <h3 className="mt-sm text-headline-md text-on-surface">{f.title}</h3>
              <p className="mt-xs text-body-md text-on-surface-variant">{f.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-xl border-t border-outline-variant pt-lg flex flex-col items-center gap-sm">
          <p className="text-body-md text-on-surface-variant text-center">
            Ready to see what the street's saying?
          </p>
          <Link
            to="/signup"
            className="px-lg h-10 flex items-center bg-primary text-on-primary text-body-md rounded hover:bg-primary-container transition-colors"
          >
            Create your account
          </Link>
        </Reveal>
      </section>
    </div>
  )
}
