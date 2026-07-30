'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser, loginUser, ApiError } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await registerUser({
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber || undefined,
        role: 'customer',
      })
      await loginUser({ email, password })
      router.push('/dashboard/customer')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-heading text-h5 text-text-primary">
            Proxli
          </Link>
          <h1 className="mt-4 font-heading text-h3 text-text-primary">Create your account</h1>
          <p className="mt-2 text-text-secondary">
            Find and contact trusted local providers near you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-border rounded-xl p-6 space-y-4 shadow-sm"
        >
          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-text-primary mb-1">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-text-primary mb-1">
              Phone number <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <input
              id="phone_number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <p className="mt-1 text-xs text-text-secondary">At least 8 characters.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Are you a service provider?{' '}
          <Link href="/provider-register" className="text-primary hover:text-primary-hover font-medium">
            Join as a provider
          </Link>
        </p>
      </div>
    </main>
  )
}