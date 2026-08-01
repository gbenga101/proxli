'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logoutAdmin } from '@/lib/api'

export default function AdminDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleAdminLogout() {
        setLoading(true)
        try {
            await logoutAdmin()
        } finally {
            router.push('/admin/login')
        }
    }

    return (
        <div className="min-h-screen bg-surface">
            {/* Admin Dark Header */}
            <header className="bg-text-primary text-white border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="font-heading text-h5 font-bold text-white">
                            Proxli
                        </Link>
                        <span className="text-xs uppercase tracking-wider bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded font-mono">
                            Admin Console
                        </span>
                    </div>
                    <button
                        onClick={handleAdminLogout}
                        disabled={loading}
                        className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
                    >
                        {loading ? 'Logging out…' : 'Log out'}
                    </button>
                </div>
            </header>

            {/* Main Admin Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white border border-border rounded-xl p-6 mb-8 shadow-sm">
                    <h1 className="font-heading text-h3 text-text-primary mb-1">
                        Platform Management
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Approve providers, manage customers, moderate reviews, and monitor edit requests.
                    </p>
                </div>

                {/* Admin Overview Cards Placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Providers</span>
                        <p className="text-h3 font-heading text-text-primary mt-2">--</p>
                        <p className="text-xs text-text-secondary mt-1">Pending verification</p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Customers</span>
                        <p className="text-h3 font-heading text-text-primary mt-2">--</p>
                        <p className="text-xs text-text-secondary mt-1">Registered accounts</p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Reviews</span>
                        <p className="text-h3 font-heading text-text-primary mt-2">--</p>
                        <p className="text-xs text-text-secondary mt-1">Submitted on platform</p>
                    </div>
                </div>
            </main>
        </div>
    )
}