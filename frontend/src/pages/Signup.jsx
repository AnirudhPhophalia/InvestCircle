import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signup(displayName, email, password)
      navigate('/discussions', { replace: true })
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
          <h1 className="text-headline-md text-on-surface">Create your account</h1>
        </header>
        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-xs">
            <label className="text-body-sm text-on-surface-variant" htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-sm border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface focus:border-primary transition-colors outline-none"
              placeholder="Jane Doe"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-sm border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface focus:border-primary transition-colors outline-none"
              placeholder="At least 6 characters"
            />
          </div>
          {error && <p className="text-body-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 mt-sm bg-primary text-on-primary text-body-md rounded hover:bg-primary-container transition-colors active:opacity-80 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-lg text-body-md text-on-surface-variant text-center">
          Already have an account?{' '}
          <Link className="text-primary hover:text-primary-container transition-colors" to="/login">
            Log in
          </Link>
        </div>
      </main>
    </div>
  )
}
