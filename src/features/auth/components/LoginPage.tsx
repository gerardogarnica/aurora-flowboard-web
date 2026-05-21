import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/app/store/auth.store'
import { useLogin } from '../hooks/useLogin'

function AuroraLogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="oklch(0.205 0 0)" />
      <path
        d="M8 22 Q11 12 16 15 Q21 18 26 9"
        stroke="oklch(0.78 0.1 205)"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8 27 Q12 19 16 21.5 Q20 24 26 16"
        stroke="oklch(0.75 0.08 268)"
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
    </svg>
  )
}

const AURORA_BACKGROUND = [
  'radial-gradient(ellipse at 22% 65%, oklch(0.88 0.07 210 / 0.42) 0%, transparent 52%)',
  'radial-gradient(ellipse at 78% 22%, oklch(0.86 0.05 272 / 0.34) 0%, transparent 48%)',
  'oklch(0.985 0 0)',
].join(', ')

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mutate: login, isPending, error } = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const axiosError = error as AxiosError | null
  const bannerError = axiosError
    ? axiosError.response?.status === 401
      ? 'Invalid email or password'
      : 'Something went wrong. Please try again.'
    : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: AURORA_BACKGROUND }}>
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="items-center text-center gap-3 pb-2">
          <AuroraLogoMark />
          <CardTitle className="text-xl tracking-tight">Aurora Flowboard</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {bannerError && (
            <div className="mb-5 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {bannerError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isPending}>
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
        </CardContent>
      </Card>
    </div>
  )
}
