'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser, loginUser, ApiError } from '@/lib/api'

export default function ProviderRegisterPage() {
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
        role: 'provider',
      })
      await loginUser({ email, password })
      // TODO: once Day 3's provider profile creation form exists, redirect
      // there instead — a provider profile does not exist yet at this point.
      router.push('/dashboard/provider')
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
          <h1 className="mt-4 font-heading text-h3 text-text-primary">Join as a provider</h1>
          <p className="mt-2 text-text-secondary">
            Get discovered by customers looking for your service nearby.
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
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
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
              className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
            />
            <p className="mt-1 text-xs text-text-secondary">At least 8 characters.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create provider account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-secondary hover:text-secondary/80 font-medium">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Looking for a service instead?{' '}
          <Link href="/register" className="text-secondary hover:text-secondary/80 font-medium">
            Sign up as a customer
          </Link>
        </p>
      </div>
    </main>
  )
}