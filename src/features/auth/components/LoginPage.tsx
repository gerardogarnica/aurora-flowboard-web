import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { ApiError } from '@/shared/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/app/store/auth.store'
import { FlowboardLogoMark } from '@/shared/components/FlowboardLogoMark'
import { useLogin } from '../hooks/useLogin'

function AuroraBrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-secondary p-10 text-secondary-foreground lg:flex xl:p-14">
      {/* Dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden="true"
      />

      {/* Aurora blobs */}
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: 'oklch(0.6420 0.1691 38.5815)', animation: 'aurora-drift-1 20s ease-in-out infinite' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full opacity-35 blur-3xl"
        style={{ background: 'oklch(0.78 0.1 205)', animation: 'aurora-drift-2 24s ease-in-out infinite' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/4 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: 'oklch(0.75 0.08 268)', animation: 'aurora-drift-3 26s ease-in-out infinite' }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <FlowboardLogoMark className="h-14" />
        <span className="text-3xl font-semibold tracking-tight">Flowboard</span>
      </div>

      {/* Headline */}
      <div className="relative z-10 max-w-md">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
          Your workflow, in clear view.
        </h1>
        <p className="mt-4 text-base text-secondary-foreground/70">
          Plan projects, track work items, and keep every board moving — all in one calm, focused workspace.
        </p>
      </div>

      {/* Footer tagline */}
      <p className="relative z-10 max-w-sm border-t border-white/10 pt-6 text-sm italic text-secondary-foreground/60">
        "Built for teams who'd rather ship than chase status updates."
      </p>
    </div>
  )
}

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mutate: login, isPending, error } = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function validate(): { email?: string; password?: string } {
    const errors: { email?: string; password?: string } = {}
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!password) {
      errors.password = 'Password is required'
    }
    return errors
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    login({ email, password })
  }

  const bannerError = error instanceof ApiError ? error.message : null

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AuroraBrandPanel />

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo (brand panel hidden below lg) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <FlowboardLogoMark className="h-10 text-foreground" />
            <span className="text-3xl font-semibold tracking-tight text-foreground">Flowboard</span>
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue to your workspace</p>
          </div>

          {bannerError && (
            <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {bannerError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  aria-invalid={!!fieldErrors.email}
                  className="h-11 pl-9"
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  aria-invalid={!!fieldErrors.password}
                  className="h-11 px-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <Button type="submit" className="mt-2 w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
