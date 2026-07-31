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
                <p className="text-text-secondary">Loading…</p>
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

    // Run once on mount using whatever the URL already had (e.g. a category-grid
    // link from the landing page). Deliberately not re-running on every filter
    // keystroke — applyFilters below is what triggers a new search + URL update.
    useEffect(() => {
        runSearch({ category, location, priceRange, responseChannel, minRating, verifiedOnly })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function applyFilters(e: React.FormEvent) {
        e.preventDefault()

        const params = new URLSearchParams()
        if (category) params.set('category', category)
        if (location) params.set('location', location)
        if (priceRange) params.set('price_range', priceRange)
        if (responseChannel) params.set('response_channel', responseChannel)
        if (minRating) params.set('min_rating', minRating)
        if (verifiedOnly) params.set('verified', 'true')

        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`)
        runSearch({ category, location, priceRange, responseChannel, minRating, verifiedOnly })
    }

    return (
        <div className="min-h-screen bg-surface">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="mb-6">Find a service provider</h1>

                <form
                    onSubmit={applyFilters}
                    className="bg-white border border-border rounded-xl p-5 mb-8 flex flex-wrap gap-4 items-end"
                >
                    <div className="w-full sm:w-56">
                        <label className="text-sm font-medium text-text-primary block mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary bg-white"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-56">
                        <Input
                            label="Location"
                            name="location"
                            placeholder="e.g. Surulere"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <Input
                            label="Price range"
                            name="price_range"
                            placeholder="e.g. 2,000 - 5,000"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-44">
                        <label className="text-sm font-medium text-text-primary block mb-1.5">
                            Response
                        </label>
                        <select
                            value={responseChannel}
                            onChange={(e) => setResponseChannel(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary bg-white"
                        >
                            <option value="">Any</option>
                            {RESPONSE_CHANNELS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-36">
                        <label className="text-sm font-medium text-text-primary block mb-1.5">
                            Min rating
                        </label>
                        <select
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary bg-white"
                        >
                            <option value="">Any</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                    {n}+ stars
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pb-2.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                            <input
                                type="checkbox"
                                checked={verifiedOnly}
                                onChange={(e) => setVerifiedOnly(e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            Verified only
                        </label>
                    </div>

                    <div className="pb-0.5">
                        <Button type="submit">Apply filters</Button>
                    </div>
                </form>

                {loading && <p className="text-text-secondary">Loading providers…</p>}

                {!loading && error && <p className="text-error">{error}</p>}

                {!loading && !error && results.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="mb-2">No providers found</h3>
                        <p className="text-text-secondary">Try a different category or location.</p>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {results.map((provider) => (
                            <ProviderCard key={provider.id} provider={provider} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}