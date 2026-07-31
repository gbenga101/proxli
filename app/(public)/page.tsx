'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Navbar from '@/components/layout/Navbar'
import CategoryIcon from '@/components/CategoryIcon'
import { getCategories } from '@/lib/api'
import type { Category } from '@/lib/api'

const STEPS = [
    {
        n: '01',
        title: 'Search',
        body: 'Tell us what you need fixed and where — a phone repairer in Surulere, an electrician nearby.',
    },
    {
        n: '02',
        title: 'View',
        body: 'Compare providers by rating, verification status, and price range before reaching out.',
    },
    {
        n: '03',
        title: 'Contact',
        body: 'Chat on WhatsApp or call directly. No middleman, no waiting on a platform to respond.',
    },
]

export default function LandingPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [category, setCategory] = useState('')
    const [location, setLocation] = useState('')

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]))
            .finally(() => setCategoriesLoading(false))
    }, [])

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        const params = new URLSearchParams()
        if (category) params.set('category', category)
        if (location) params.set('location', location)
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`)
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="bg-surface border-b border-border">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
                    <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
                        Now live in Badagry &middot; Abeokuta coming soon
                    </span>
                    <h1 className="mb-4">The technician near you, finally online.</h1>
                    <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10">
                        Proxli connects you with trusted electricians, phone repairers, plumbers, and
                        other local artisans — searchable, contactable, and rated by real customers.
                    </p>

                    <form
                        onSubmit={handleSearch}
                        className="bg-white border border-border rounded-2xl shadow-sm p-3 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
                    >
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary bg-white"
                        >
                            <option value="">Any category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Location, e.g. Surulere"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-lg border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                        <Button type="submit" size="md" className="shrink-0">
                            Search
                        </Button>
                    </form>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h2 className="text-center mb-12">How it works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {STEPS.map((step) => (
                        <div key={step.n}>
                            <span className="font-heading text-4xl font-bold text-primary/30">{step.n}</span>
                            <h3 className="mt-2 mb-2">{step.title}</h3>
                            <p className="text-text-secondary">{step.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories — always driven by the live API, slugs are never hardcoded here */}
            <section className="bg-surface border-y border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <h2 className="text-center mb-12">Browse by category</h2>

                    {categoriesLoading && (
                        <p className="text-center text-text-secondary">Loading categories…</p>
                    )}

                    {!categoriesLoading && categories.length === 0 && (
                        <p className="text-center text-text-secondary">
                            Categories are unavailable right now — please try again shortly.
                        </p>
                    )}

                    {!categoriesLoading && categories.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/search?category=${encodeURIComponent(c.slug)}`}
                                    className="bg-white border border-border rounded-xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary hover:shadow-md transition-all duration-200"
                                >
                                    <span className="text-primary">
                                        <CategoryIcon name={c.name} className="w-7 h-7" />
                                    </span>
                                    <span className="text-sm font-medium text-text-primary">{c.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Provider CTA */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h2 className="mb-4">Are you a service provider?</h2>
                <p className="text-text-secondary max-w-xl mx-auto mb-8">
                    List your services on Proxli for free and let customers in your area find you —
                    no fees while we&apos;re building out the platform.
                </p>
                <Button size="lg" onClick={() => router.push('/provider-register')}>
                    Join Proxli
                </Button>
            </section>
        </div>
    )
}