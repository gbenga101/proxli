'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

    // Computed early (not after the loading/error guards below) so it's safe to
    // use as a dependency for the hooks that follow — Rules of Hooks requires
    // every hook to run on every render, regardless of profile/loading state.
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
            // Refresh the profile too — average_rating/review_count in the
            // summary line above would otherwise go stale after a new review.
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
            // Flagging is a minor, non-blocking action — silent failure is
            // acceptable here rather than surfacing a disruptive error.
        } finally {
            setFlaggingReviewId(null)
        }
    }

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

                <div className="mt-6 bg-white border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="font-heading text-h5 text-text-primary mb-4">Reviews</h2>

                    {isAuthenticated && !isOwnProfile && !hasAlreadyReviewed && (
                        <form onSubmit={handleSubmitReview} className="mb-6 pb-6 border-b border-border">
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Your rating
                            </label>
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setRating(n)}
                                        className={`text-2xl leading-none ${n <= rating ? 'text-accent' : 'text-border'}`}
                                        aria-label={`${n} star${n === 1 ? '' : 's'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Optional comment"
                                rows={3}
                                className="w-full rounded-lg border border-border px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary mb-3"
                            />
                            {submitError && <p className="text-error text-sm mb-3">{submitError}</p>}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
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
                            <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
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
                        <div className="flex flex-col gap-4">
                            {reviews.map((r) => (
                                <div key={r.id} className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-text-primary text-sm">
                                                {r.reviewer.full_name}
                                            </span>
                                            <span className="text-accent text-sm">
                                                {'★'.repeat(r.rating)}
                                                {'☆'.repeat(5 - r.rating)}
                                            </span>
                                        </div>
                                        {r.comment && (
                                            <p className="text-text-secondary text-sm mt-1">{r.comment}</p>
                                        )}
                                    </div>
                                    {isAuthenticated && r.reviewer_id !== currentUser?.id && (
                                        <button
                                            onClick={() => setFlaggingReviewId(r.id)}
                                            className="text-xs text-text-secondary hover:text-error shrink-0"
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