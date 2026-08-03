'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    getPublicProviderProfile,
    getProviderReviews,
    submitReview,
    flagReview,
    getCurrentUser,
    PublicProviderProfile,
    ProviderReview,
    AuthUser,
    ApiError,
} from '@/lib/api'
import Modal from '@/components/ui/Modal'

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
    const router = useRouter()
    const [profile, setProfile] = useState<PublicProviderProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [reviews, setReviews] = useState<ProviderReview[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null)

    const isAuthenticated = profile
        ? profile.whatsapp_number !== null || profile.phone_number !== null
        : false

    useEffect(() => {
        if (!params.id) return

        getPublicProviderProfile(params.id)
            .then(setProfile)
            .catch((err) => {
                setError(err instanceof ApiError ? err.message : 'Something went wrong')
            })
            .finally(() => setLoading(false))
    }, [params.id])

    const loadReviews = useCallback(() => {
        if (!params.id) return
        setReviewsLoading(true)
        getProviderReviews(params.id)
            .then(setReviews)
            .catch(() => setReviews([]))
            .finally(() => setReviewsLoading(false))
    }, [params.id])

    useEffect(() => {
        loadReviews()
    }, [loadReviews])

    useEffect(() => {
        if (!isAuthenticated) {
            setCurrentUser(null)
            return
        }
        getCurrentUser()
            .then(setCurrentUser)
            .catch(() => setCurrentUser(null))
    }, [isAuthenticated])

    async function handleSubmitReview(e: React.FormEvent) {
        e.preventDefault()
        setSubmitError(null)

        if (rating === 0) {
            setSubmitError('Select a rating from 1 to 5')
            return
        }
        if (!profile) return

        setSubmitting(true)
        try {
            await submitReview({
                provider_profile_id: profile.id,
                rating,
                comment: comment.trim() || undefined,
            })
            setRating(0)
            setComment('')
            loadReviews()
            getPublicProviderProfile(profile.id).then(setProfile).catch(() => {})
        } catch (err) {
            setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleFlagReview(reason: string) {
        if (!flaggingReviewId) return
        try {
            await flagReview(flaggingReviewId, reason)
            loadReviews()
        } catch {
            // Non-blocking action
        } finally {
            setFlaggingReviewId(null)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-surface px-4">
                <p className="text-text-secondary text-sm font-medium">Loading profile…</p>
            </main>
        )
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-surface px-4">
                <div className="text-center bg-white border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xs">
                    <p className="text-text-primary font-bold text-lg mb-2">{error || 'Provider not found'}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center min-h-11 px-4 text-primary hover:text-primary-hover text-sm font-semibold hover:underline"
                    >
                        ← Back to home
                    </Link>
                </div>
            </main>
        )
    }

    const whatsappDigits = profile.whatsapp_number ? digitsOnly(profile.whatsapp_number) : null
    const phoneDigits = profile.phone_number ? digitsOnly(profile.phone_number) : null

    const showWhatsapp =
        isAuthenticated && whatsappDigits && ['whatsapp', 'both'].includes(profile.response_channel)
    const showCall =
        isAuthenticated && phoneDigits && ['call', 'both'].includes(profile.response_channel)

    const isOwnProfile = currentUser ? profile.user_id === currentUser.id : false
    const hasAlreadyReviewed = currentUser
        ? reviews.some((r) => r.reviewer_id === currentUser.id)
        : false

    return (
        <main className="min-h-screen bg-surface">
            <header className="bg-white border-b border-border sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="min-h-11 min-w-11 flex items-center text-text-secondary hover:text-text-primary text-sm font-semibold rounded-xl"
                            aria-label="Go back"
                        >
                            ← Back
                        </button>
                        <Link href="/" className="font-heading text-xl font-extrabold text-text-primary">
                            Proxli
                        </Link>
                    </div>
                    {currentUser && (
                        <Link
                            href={currentUser.roles.includes('provider') ? '/dashboard/provider' : '/dashboard/customer'}
                            className="min-h-11 flex items-center px-3 text-primary hover:text-primary-hover text-sm font-semibold rounded-xl hover:bg-primary/5 transition-colors"
                        >
                            My Dashboard
                        </Link>
                    )}
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
                {/* Main Profile Header Card */}
                <div className="bg-white border border-border rounded-3xl p-5 sm:p-8 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            {profile.profile_photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={profile.profile_photo}
                                    alt={profile.full_name}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-border shadow-2xs shrink-0"
                                />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface border border-border flex items-center justify-center text-2xl font-heading font-extrabold text-text-secondary shrink-0 shadow-2xs">
                                    {profile.full_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary leading-snug">
                                    {profile.full_name}
                                </h1>
                                <p className="text-text-secondary text-sm mt-1 flex items-center gap-1 font-medium">
                                    📍 <span>{profile.location_area}</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {profile.categories?.map((c) => (
                                        <span
                                            key={c.category.id}
                                            className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full"
                                        >
                                            {c.category.name}
                                        </span>
                                    )) || <span className="text-xs text-text-secondary">No categories</span>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <span
                                className={`inline-flex text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[profile.verification_status]}`}
                            >
                                {STATUS_LABEL[profile.verification_status]}
                            </span>
                        </div>
                    </div>

                    {profile.bio && (
                        <p className="mt-5 text-sm sm:text-base text-text-primary leading-relaxed bg-surface/50 border border-border/50 p-4 rounded-2xl">
                            {profile.bio}
                        </p>
                    )}

                    {/* Quick Stats Grid */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {profile.years_of_experience !== null && (
                            <div className="bg-surface rounded-2xl p-3 border border-border text-center">
                                <span className="block text-xs font-medium text-text-secondary uppercase">Experience</span>
                                <span className="text-sm font-bold text-text-primary">{profile.years_of_experience} yrs</span>
                            </div>
                        )}
                        {profile.price_range && (
                            <div className="bg-surface rounded-2xl p-3 border border-border text-center">
                                <span className="block text-xs font-medium text-text-secondary uppercase">Price range</span>
                                <span className="text-sm font-bold text-text-primary">₦{profile.price_range}</span>
                            </div>
                        )}
                        <div className="bg-surface rounded-2xl p-3 border border-border text-center col-span-2 sm:col-span-1">
                            <span className="block text-xs font-medium text-text-secondary uppercase">Rating</span>
                            <span className="text-sm font-bold text-text-primary">
                                {profile.review_count > 0
                                    ? `${profile.average_rating?.toFixed(1)} ★ (${profile.review_count})`
                                    : 'No reviews'}
                            </span>
                        </div>
                    </div>

                    {/* Touch-optimized Contact CTAs */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        {showWhatsapp && (
                            <a
                                href={`https://wa.me/${whatsappDigits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-12 bg-secondary hover:bg-secondary/90 text-white font-semibold text-base rounded-2xl px-5 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-2xs flex-1 text-center"
                            >
                                💬 Chat on WhatsApp
                            </a>
                        )}
                        {showCall && (
                            <a
                                href={`tel:+${phoneDigits}`}
                                className="min-h-12 bg-primary hover:bg-primary-hover text-white font-semibold text-base rounded-2xl px-5 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-2xs flex-1 text-center"
                            >
                                📞 Call Provider
                            </a>
                        )}
                        {!isAuthenticated && (
                            <Link
                                href={`/login?redirect=${encodeURIComponent(`/provider/${params.id}`)}`}
                                className="min-h-12 bg-text-primary hover:opacity-95 text-white font-semibold text-base rounded-2xl px-5 py-3 flex items-center justify-center transition-all active:scale-[0.98] shadow-2xs w-full text-center"
                            >
                                🔑 Login to contact this provider
                            </Link>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white border border-border rounded-3xl p-5 sm:p-8 shadow-2xs">
                    <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Reviews</h2>

                    {isAuthenticated && !isOwnProfile && !hasAlreadyReviewed && (
                        <form onSubmit={handleSubmitReview} className="mb-6 pb-6 border-b border-border">
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Your rating
                            </label>
                            <div className="flex gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setRating(n)}
                                        className={`w-11 h-11 min-w-11 min-h-11 rounded-xl border flex items-center justify-center text-2xl leading-none transition-all active:scale-95 ${
                                            n <= rating
                                                ? 'border-accent bg-accent/10 text-accent font-bold'
                                                : 'border-border text-slate-300 hover:border-slate-400'
                                        }`}
                                        aria-label={`${n} star${n === 1 ? '' : 's'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write your feedback (optional)"
                                rows={3}
                                className="w-full rounded-2xl border border-border px-4 py-3 text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary mb-4"
                            />
                            {submitError && <p className="text-error text-sm mb-3 font-medium">{submitError}</p>}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="min-h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-2xl px-6 py-3 transition-all active:scale-[0.98]"
                            >
                                {submitting ? 'Submitting…' : 'Submit review'}
                            </button>
                        </form>
                    )}

                    {isAuthenticated && isOwnProfile && (
                        <p className="text-text-secondary text-sm mb-6 pb-6 border-b border-border">
                            This is your own profile — providers can&apos;t review themselves.
                        </p>
                    )}

                    {isAuthenticated && !isOwnProfile && hasAlreadyReviewed && (
                        <p className="text-text-secondary text-sm mb-6 pb-6 border-b border-border">
                            You&apos;ve already reviewed this provider.
                        </p>
                    )}

                    {!isAuthenticated && (
                        <p className="text-text-secondary text-sm mb-6 pb-6 border-b border-border">
                            <Link
                                href={`/login?redirect=${encodeURIComponent(`/provider/${params.id}`)}`}
                                className="text-primary hover:text-primary-hover font-semibold underline"
                            >
                                Log in
                            </Link>{' '}
                            to leave a review.
                        </p>
                    )}

                    {reviewsLoading ? (
                        <p className="text-text-secondary text-sm">Loading reviews…</p>
                    ) : reviews.length === 0 ? (
                        <p className="text-text-secondary text-sm">No reviews yet.</p>
                    ) : (
                        <div className="flex flex-col divide-y divide-border">
                            {reviews.map((r) => (
                                <div key={r.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-text-primary text-sm sm:text-base">
                                                {r.reviewer.full_name}
                                            </span>
                                            <span className="text-accent text-sm">
                                                {'★'.repeat(r.rating)}
                                                <span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span>
                                            </span>
                                        </div>
                                        {r.comment && (
                                            <p className="text-text-secondary text-sm mt-1 leading-relaxed">{r.comment}</p>
                                        )}
                                    </div>
                                    {isAuthenticated && r.reviewer_id !== currentUser?.id && (
                                        <button
                                            onClick={() => setFlaggingReviewId(r.id)}
                                            className="min-h-11 px-2 text-xs font-semibold text-text-secondary hover:text-error shrink-0"
                                        >
                                            Flag
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Modal
                    open={flaggingReviewId !== null}
                    title="Flag this review"
                    description="Let an admin know why this review should be looked at."
                    variant="prompt"
                    promptLabel="Reason"
                    promptPlaceholder="e.g. This looks like spam"
                    confirmLabel="Flag"
                    danger
                    onConfirm={(reason) => {
                        if (reason) handleFlagReview(reason)
                    }}
                    onCancel={() => setFlaggingReviewId(null)}
                />
            </div>
        </main>
    )
}