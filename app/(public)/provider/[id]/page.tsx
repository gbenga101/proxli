'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getPublicProviderProfile, PublicProviderProfile, ApiError } from '@/lib/api'

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    verified: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-error/10 text-error border-error/20',
}

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending Verification',
    verified: 'Verified',
    rejected: 'Rejected',
}

function digitsOnly(value: string) {
    return value.replace(/\D/g, '')
}

export default function ProviderPublicProfilePage() {
    const params = useParams<{ id: string }>()
    const [profile, setProfile] = useState<PublicProviderProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!params.id) return

        getPublicProviderProfile(params.id)
            .then(setProfile)
            .catch((err) => {
                setError(err instanceof ApiError ? err.message : 'Something went wrong')
            })
            .finally(() => setLoading(false))
    }, [params.id])

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-surface">
                <p className="text-text-secondary text-sm">Loading profile…</p>
            </main>
        )
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-surface px-4">
                <div className="text-center">
                    <p className="text-text-primary font-medium mb-2">{error || 'Provider not found'}</p>
                    <Link href="/" className="text-primary hover:text-primary-hover text-sm font-medium">
                        Back to home
                    </Link>
                </div>
            </main>
        )
    }

    const isAuthenticated = profile.whatsapp_number !== null || profile.phone_number !== null
    const whatsappDigits = profile.whatsapp_number ? digitsOnly(profile.whatsapp_number) : null
    const phoneDigits = profile.phone_number ? digitsOnly(profile.phone_number) : null

    const showWhatsapp =
        isAuthenticated && whatsappDigits && ['whatsapp', 'both'].includes(profile.response_channel)
    const showCall =
        isAuthenticated && phoneDigits && ['call', 'both'].includes(profile.response_channel)

    return (
        <main className="min-h-screen bg-surface">
            <header className="bg-white border-b border-border">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
                    <Link href="/" className="font-heading text-h5 text-text-primary">
                        Proxli
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                            {profile.profile_photo && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={profile.profile_photo}
                                    alt={profile.full_name}
                                    className="w-16 h-16 rounded-full object-cover border border-border"
                                />
                            )}
                            <div>
                                <h1 className="font-heading text-h3 text-text-primary">{profile.full_name}</h1>
                                <p className="text-text-secondary text-sm mt-1">{profile.location_area}</p>
                                <p className="text-text-secondary text-sm">
                                    {profile.categories?.map((c) => c.category.name).join(', ') || 'No categories listed'}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_STYLES[profile.verification_status]}`}
                        >
                            {STATUS_LABEL[profile.verification_status]}
                        </span>
                    </div>

                    {profile.bio && <p className="mt-4 text-text-primary">{profile.bio}</p>}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
                        {profile.years_of_experience !== null && (
                            <span>{profile.years_of_experience} years experience</span>
                        )}
                        {profile.price_range && <span>₦{profile.price_range}</span>}
                        <span>
                            {profile.review_count > 0
                                ? `${profile.average_rating?.toFixed(1)} ★ (${profile.review_count} review${profile.review_count === 1 ? '' : 's'})`
                                : 'No reviews yet'}
                        </span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {showWhatsapp && (
                            <a
                                href={`https://wa.me/${whatsappDigits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                            >
                                Chat on WhatsApp
                            </a>
                        )}
                        {showCall && (
                            <a
                                href={`tel:+${phoneDigits}`}
                                className="bg-primary hover:bg-primary-hover text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                            >
                                Call Provider
                            </a>
                        )}
                        {!isAuthenticated && (
                            <Link
                                href="/login"
                                className="bg-text-primary hover:opacity-90 text-white font-medium rounded-lg px-4 py-2.5 transition-opacity"
                            >
                                Login to contact this provider
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}