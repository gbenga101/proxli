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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-14 sm:pb-20 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full mb-6 max-w-full truncate">
                        ✨ Now live in Badagry &middot; Abeokuta coming soon
                    </span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-text-primary mb-4 leading-[1.2]">
                        The technician near you, <br className="hidden sm:inline" />
                        finally online.
                    </h1>
                    <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
                        Proxli connects you with trusted electricians, phone repairers, plumbers, and
                        other local artisans — searchable, contactable, and rated by real customers.
                    </p>

                    {/* Search Form Card */}
                    <form
                        onSubmit={handleSearch}
                        className="bg-white border border-border rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
                    >
                        <div className="flex-1 min-h-12 flex items-center">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full min-h-12 px-4 py-3 rounded-xl border border-border text-base text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                            >
                                <option value="">Any category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-h-12 flex items-center">
                            <input
                                type="text"
                                placeholder="Location, e.g. Surulere"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full min-h-12 px-4 py-3 rounded-xl border border-border text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="md"
                            className="min-h-12 min-w-30 justify-center text-base font-semibold rounded-xl shrink-0 active:scale-[0.98] transition-transform"
                        >
                            Search
                        </Button>
                    </form>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10 sm:mb-14 text-text-primary">
                    How it works
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
                    {STEPS.map((step) => (
                        <div
                            key={step.n}
                            className="bg-surface sm:bg-transparent border sm:border-0 border-border rounded-2xl p-6 sm:p-0 flex flex-col justify-between"
                        >
                            <div>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-primary/30 tracking-tight">
                                    {step.n}
                                </span>
                                <h3 className="text-xl font-heading font-bold mt-2 mb-2 text-text-primary">
                                    {step.title}
                                </h3>
                                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                                    {step.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="bg-surface border-y border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10 sm:mb-14 text-text-primary">
                        Browse by category
                    </h2>

                    {categoriesLoading && (
                        <p className="text-center text-text-secondary text-sm">Loading categories…</p>
                    )}

                    {!categoriesLoading && categories.length === 0 && (
                        <p className="text-center text-text-secondary text-sm">
                            Categories are unavailable right now — please try again shortly.
                        </p>
                    )}

                    {!categoriesLoading && categories.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {categories.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/search?category=${encodeURIComponent(c.slug)}`}
                                    className="bg-white border border-border rounded-2xl p-4 sm:p-5 min-h-24 flex flex-col items-center justify-center text-center gap-2.5 hover:border-primary hover:shadow-md transition-all duration-200 active:scale-[0.98] group focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <span className="text-primary group-hover:scale-110 transition-transform duration-200">
                                        <CategoryIcon name={c.name} className="w-7 h-7" />
                                    </span>
                                    <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                                        {c.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Provider CTA */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="bg-linear-to-b from-surface to-white border border-border rounded-3xl p-8 sm:p-12 text-center shadow-xs">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary mb-3">
                        Are you a service provider?
                    </h2>
                    <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed">
                        List your services on Proxli for free and let customers in your area find you —
                        no fees while we&apos;re building out the platform.
                    </p>
                    <Button
                        size="lg"
                        className="min-h-12 px-8 text-base font-semibold rounded-xl shadow-sm active:scale-[0.98] transition-transform"
                        onClick={() => router.push('/provider-register')}
                    >
                        Join Proxli
                    </Button>
                </div>
            </section>
        </div>
    )
}