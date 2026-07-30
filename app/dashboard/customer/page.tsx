'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, logoutUser, AuthUser } from '@/lib/api'

export default function CustomerDashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getCurrentUser()
            .then((data) => {
                setUser(data)
                setLoading(false)
            })
            .catch(() => {
                router.push('/login')
            })
    }, [router])

    async function handleLogout() {
        try {
            await logoutUser()
        } finally {
            router.push('/login')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <p className="text-textSecondary text-sm font-medium animate-pulse">Loading dashboard…</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface">
            {/* Top Navbar */}
            <header className="bg-white border-b border-border sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-heading text-h5 text-textPrimary font-bold">
                        Proxli
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full border border-primary/20">
                            Customer Account
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-textSecondary hover:text-error transition-colors font-medium"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Dashboard Body */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white border border-border rounded-xl p-6 mb-8 shadow-sm">
                    <h1 className="font-heading text-h3 text-textPrimary mb-1">
                        Welcome back, {user?.full_name}!
                    </h1>
                    <p className="text-textSecondary text-sm">
                        Manage your account and search for local service providers near you.
                    </p>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h2 className="font-heading text-h5 text-textPrimary mb-2">Find a Service Provider</h2>
                            <p className="text-textSecondary text-sm mb-4">
                                Search electricians, plumbers, phone repairers, and more in Badagry.
                            </p>
                        </div>
                        <Link
                            href="/search"
                            className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm w-fit"
                        >
                            Browse & Search Providers →
                        </Link>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h2 className="font-heading text-h5 text-textPrimary mb-2">Account Profile</h2>
                            <p className="text-textSecondary text-sm mb-1">
                                <strong>Email:</strong> {user?.email}
                            </p>
                            <p className="text-textSecondary text-sm mb-4">
                                <strong>Phone:</strong> {user?.phone_number || 'Not provided'}
                            </p>
                        </div>
                        <span className="text-xs text-textSecondary bg-surface px-3 py-1.5 rounded-md border border-border w-fit">
                            Roles: {user?.roles.join(', ')}
                        </span>
                    </div>
                </div>
            </main>
        </div>
    )
}