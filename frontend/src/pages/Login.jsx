import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    <div className="bg-background min-h-screen flex flex-col items-center justify-center p-md">
      <main className="w-full max-w-[380px] bg-surface-container-lowest border border-outline-variant rounded-lg p-xl flex flex-col">
        <header className="flex flex-col items-center mb-xl">
          <div className="flex items-center gap-xs mb-sm">
            <span className="material-symbols-outlined text-primary text-[28px]">monitoring</span>
            <span className="text-headline-md text-primary tracking-tight">InvestCircle</span>
          </div>
          <h1 className="text-headline-md text-on-surface">Log in to your account</h1>
        </header>
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
  )
}
