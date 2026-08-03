'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Navbar from '@/components/layout/Navbar'
import ProviderCard from '@/components/ProviderCard'
import { searchProviders, getCategories } from '@/lib/api'
import type { PublicProviderProfile, Category, ResponseChannel } from '@/lib/api'

const RESPONSE_CHANNELS: { value: ResponseChannel; label: string }[] = [
    { value: 'whatsapp', label: 'WhatsApp only' },
    { value: 'call', label: 'Call only' },
    { value: 'both', label: 'WhatsApp or Call' },
]

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageFallback />}>
            <SearchPageContent />
        </Suspense>
    )
}

function SearchPageFallback() {
    return (
        <div className="min-h-screen bg-surface">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <p className="text-text-secondary text-sm">Loading…</p>
            </div>
        </div>
    )
}

function SearchPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [categories, setCategories] = useState<Category[]>([])
    const [results, setResults] = useState<PublicProviderProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [category, setCategory] = useState(searchParams.get('category') ?? '')
    const [location, setLocation] = useState(searchParams.get('location') ?? '')
    const [priceRange, setPriceRange] = useState(searchParams.get('price_range') ?? '')
    const [responseChannel, setResponseChannel] = useState(
        searchParams.get('response_channel') ?? ''
    )
    const [minRating, setMinRating] = useState(searchParams.get('min_rating') ?? '')
    const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true')
    
    // Mobile filter drawer state
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    // Calculate active filters count
    const activeFiltersCount = [
        category,
        location,
        priceRange,
        responseChannel,
        minRating,
        verifiedOnly ? 'verified' : '',
    ].filter(Boolean).length

    // Lock scroll when mobile filter drawer is active
    useEffect(() => {
        if (mobileFiltersOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileFiltersOpen])

    // Close mobile filter drawer on Escape key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && mobileFiltersOpen) {
                setMobileFiltersOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mobileFiltersOpen])

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]))
    }, [])

    const runSearch = useCallback(
        async (filters: {
            category: string
            location: string
            priceRange: string
            responseChannel: string
            minRating: string
            verifiedOnly: boolean
        }) => {
            setLoading(true)
            setError(null)

            try {
                const data = await searchProviders({
                    category: filters.category || undefined,
                    location: filters.location || undefined,
                    price_range: filters.priceRange || undefined,
                    response_channel: (filters.responseChannel || undefined) as
                        | ResponseChannel
                        | undefined,
                    min_rating: filters.minRating ? Number(filters.minRating) : undefined,
                    verified: filters.verifiedOnly ? true : undefined,
                })
                setResults(data)
            } catch {
                setError('Something went wrong loading providers. Please try again.')
            } finally {
                setLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        runSearch({ category, location, priceRange, responseChannel, minRating, verifiedOnly })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function applyFilters(e?: React.FormEvent) {
        if (e) e.preventDefault()

        const params = new URLSearchParams()
        if (category) params.set('category', category)
        if (location) params.set('location', location)
        if (priceRange) params.set('price_range', priceRange)
        if (responseChannel) params.set('response_channel', responseChannel)
        if (minRating) params.set('min_rating', minRating)
        if (verifiedOnly) params.set('verified', 'true')

        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`)
        runSearch({ category, location, priceRange, responseChannel, minRating, verifiedOnly })
        setMobileFiltersOpen(false)
    }

    function resetFilters() {
        setCategory('')
        setLocation('')
        setPriceRange('')
        setResponseChannel('')
        setMinRating('')
        setVerifiedOnly(false)
    }

    return (
        <div className="min-h-screen bg-surface">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary">
                            Find a service provider
                        </h1>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1">
                            {loading ? 'Searching providers…' : `${results.length} provider${results.length === 1 ? '' : 's'} available`}
                        </p>
                    </div>

                    {/* Mobile Filter Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileFiltersOpen(true)}
                        className="md:hidden min-h-11 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-semibold text-text-primary hover:border-primary flex items-center gap-2 shadow-2xs active:scale-[0.98] transition-all"
                    >
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="text-xs bg-primary text-white font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Desktop Filter Form */}
                <form
                    onSubmit={applyFilters}
                    className="hidden md:flex bg-white border border-border rounded-2xl p-5 mb-8 flex-wrap gap-4 items-end shadow-2xs"
                >
                    <div className="w-56">
                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-52">
                        <Input
                            label="Location"
                            name="location"
                            placeholder="e.g. Surulere"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    <div className="w-44">
                        <Input
                            label="Price range"
                            name="price_range"
                            placeholder="e.g. 2,000 - 5,000"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                        />
                    </div>

                    <div className="w-40">
                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                            Response
                        </label>
                        <select
                            value={responseChannel}
                            onChange={(e) => setResponseChannel(e.target.value)}
                            className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                            <option value="">Any channel</option>
                            {RESPONSE_CHANNELS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-32">
                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                            Min rating
                        </label>
                        <select
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                            <option value="">Any rating</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                    {n}+ stars
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pb-2.5 min-h-11">
                        <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={verifiedOnly}
                                onChange={(e) => setVerifiedOnly(e.target.checked)}
                                className="w-4 h-4 accent-primary rounded cursor-pointer"
                            />
                            Verified only
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit" className="min-h-11 px-5 rounded-xl font-semibold">
                            Apply
                        </Button>
                        {activeFiltersCount > 0 && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="min-h-11 px-3 text-xs font-semibold text-text-secondary hover:text-error transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </form>

                {/* Mobile Filter Drawer / Bottom Sheet */}
                {mobileFiltersOpen && (
                    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                            onClick={() => setMobileFiltersOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Sheet Container */}
                        <div className="relative bg-white rounded-t-3xl border-t border-border shadow-2xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
                            <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
                                <div>
                                    <h3 className="text-lg font-heading font-bold text-text-primary">
                                        Filter Providers
                                    </h3>
                                    {activeFiltersCount > 0 && (
                                        <p className="text-xs text-primary font-medium">
                                            {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} applied
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="min-h-11 min-w-11 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={applyFilters} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full min-h-12 px-4 py-3 rounded-xl border border-border text-base text-text-primary focus:outline-none focus:border-primary bg-white"
                                    >
                                        <option value="">All categories</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.slug}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Input
                                        label="Location"
                                        name="location"
                                        placeholder="e.g. Surulere"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Input
                                        label="Price range"
                                        name="price_range"
                                        placeholder="e.g. 2,000 - 5,000"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                                            Response
                                        </label>
                                        <select
                                            value={responseChannel}
                                            onChange={(e) => setResponseChannel(e.target.value)}
                                            className="w-full min-h-12 px-3.5 py-3 rounded-xl border border-border text-base text-text-primary focus:outline-none focus:border-primary bg-white"
                                        >
                                            <option value="">Any channel</option>
                                            {RESPONSE_CHANNELS.map((r) => (
                                                <option key={r.value} value={r.value}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                                            Min rating
                                        </label>
                                        <select
                                            value={minRating}
                                            onChange={(e) => setMinRating(e.target.value)}
                                            className="w-full min-h-12 px-3.5 py-3 rounded-xl border border-border text-base text-text-primary focus:outline-none focus:border-primary bg-white"
                                        >
                                            <option value="">Any rating</option>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <option key={n} value={n}>
                                                    {n}+ stars
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-3 text-base font-medium text-text-primary cursor-pointer min-h-11">
                                        <input
                                            type="checkbox"
                                            checked={verifiedOnly}
                                            onChange={(e) => setVerifiedOnly(e.target.checked)}
                                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                                        />
                                        Verified providers only
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-border flex gap-3">
                                    {activeFiltersCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="min-h-12 px-4 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:text-error transition-colors"
                                        >
                                            Reset
                                        </button>
                                    )}
                                    <Button
                                        type="submit"
                                        className="flex-1 min-h-12 justify-center text-base font-semibold rounded-xl shadow-sm"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Loading / Error States */}
                {loading && (
                    <div className="py-16 text-center">
                        <p className="text-text-secondary text-sm">Loading providers…</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-white border border-error/20 rounded-2xl p-6 text-center shadow-xs">
                        <p className="text-error font-medium">{error}</p>
                    </div>
                )}

                {!loading && !error && results.length === 0 && (
                    <div className="bg-white border border-border rounded-2xl text-center py-16 px-4 shadow-2xs">
                        <div className="w-12 h-12 bg-surface text-text-secondary rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                            🔎
                        </div>
                        <h3 className="text-lg font-heading font-bold text-text-primary mb-1">
                            No providers found
                        </h3>
                        <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
                            We couldn&apos;t find any provider matching your current filters. Try resetting filters or searching another category.
                        </p>
                        {activeFiltersCount > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    resetFilters()
                                    runSearch({
                                        category: '',
                                        location: '',
                                        priceRange: '',
                                        responseChannel: '',
                                        minRating: '',
                                        verifiedOnly: false,
                                    })
                                }}
                                className="inline-flex items-center justify-center min-h-[44px] px-5 bg-primary/10 text-primary font-semibold text-sm rounded-xl hover:bg-primary/20 transition-colors"
                            >
                                Reset all filters
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {results.map((provider) => (
                            <ProviderCard key={provider.id} provider={provider} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}