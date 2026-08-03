'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    getCurrentUser,
    logoutUser,
    getCategories,
    getMyProviderProfile,
    createProviderProfile,
    updateFreeFields,
    submitEditRequest,
    assignCategories,
    getProviderReviews,
    AuthUser,
    Category,
    ProviderProfile,
    ProviderReview,
    ResponseChannel,
    ApiError,
} from '@/lib/api'

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

const EDIT_REQUEST_FIELDS = [
    { value: 'profile_photo', label: 'Profile photo' },
    { value: 'phone_number', label: 'Phone number' },
    { value: 'whatsapp_number', label: 'WhatsApp number' },
    { value: 'location_area', label: 'Location area' },
] as const

export default function ProviderDashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [profile, setProfile] = useState<ProviderProfile | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [view, setView] = useState<'loading' | 'create' | 'dashboard' | 'error'>('loading')

    useEffect(() => {
        getCurrentUser()
            .then((data) => {
                if (!data.roles.includes('provider')) {
                    router.push('/dashboard/customer')
                    return
                }
                setUser(data)
                return Promise.all([getMyProviderProfile(), getCategories()])
                    .then(([profileData, categoriesData]) => {
                        setProfile(profileData)
                        setCategories(categoriesData)
                        setView('dashboard')
                    })
                    .catch((err) => {
                        if (err instanceof ApiError && err.status === 404) {
                            getCategories().then(setCategories)
                            setView('create')
                        } else {
                            setView('error')
                        }
                    })
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

    if (view === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <p className="text-text-secondary text-sm font-medium">Loading provider dashboard…</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface">
            <header className="bg-white border-b border-border sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-heading text-h5 text-text-primary font-bold">
                        Proxli
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-xs bg-secondary/10 text-secondary font-medium px-2.5 py-1 rounded-full border border-secondary/20">
                            Provider Account
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-text-secondary hover:text-error transition-colors font-medium"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {view === 'error' && (
                    <div className="bg-white border border-border rounded-xl p-6 text-center text-text-secondary">
                        Something went wrong loading your profile. Please refresh the page.
                    </div>
                )}

                {view === 'create' && user && (
                    <CreateProfileForm
                        fullName={user.full_name}
                        categories={categories}
                        onCreated={(newProfile) => {
                            setProfile(newProfile)
                            setView('dashboard')
                        }}
                    />
                )}

                {view === 'dashboard' && profile && (
                    <ProviderDashboardContent
                        user={user}
                        profile={profile}
                        categories={categories}
                        onProfileUpdate={setProfile}
                    />
                )}
            </main>
        </div>
    )
}

function CreateProfileForm({
    fullName,
    categories,
    onCreated,
}: {
    fullName: string
    categories: Category[]
    onCreated: (profile: ProviderProfile) => void
}) {
    const [whatsappNumber, setWhatsappNumber] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [bio, setBio] = useState('')
    const [yearsOfExperience, setYearsOfExperience] = useState('')
    const [priceRange, setPriceRange] = useState('')
    const [locationArea, setLocationArea] = useState('')
    const [responseChannel, setResponseChannel] = useState<ResponseChannel>('whatsapp')
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function toggleCategory(id: string) {
        setSelectedCategoryIds((prev) => {
            if (prev.includes(id)) return prev.filter((c) => c !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const created = await createProviderProfile({
                whatsapp_number: whatsappNumber,
                phone_number: phoneNumber || undefined,
                bio: bio || undefined,
                years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
                price_range: priceRange || undefined,
                location_area: locationArea,
                response_channel: responseChannel,
                profile_photo: photoFile || undefined,
            })

            if (selectedCategoryIds.length > 0) {
                try {
                    await assignCategories(selectedCategoryIds)
                } catch {
                    // Profile was created successfully even if this step fails — the
                    // dashboard's category section below lets them retry.
                }
            }

            onCreated(created)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h1 className="font-heading text-h3 text-text-primary mb-1">
                Welcome, {fullName}!
            </h1>
            <p className="text-text-secondary text-sm mb-6">
                Complete your profile to appear in customer searches.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Profile photo <span className="text-text-secondary font-normal">(optional)</span>
                    </label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:text-white file:px-3 file:py-2 file:text-sm file:font-medium"
                    />
                    <p className="mt-1 text-xs text-text-secondary">JPEG, PNG, or WebP. Max 2MB.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        WhatsApp number
                    </label>
                    <input
                        type="tel"
                        required
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="234801234xxxx"
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Phone number <span className="text-text-secondary font-normal">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Location area</label>
                    <input
                        type="text"
                        required
                        value={locationArea}
                        onChange={(e) => setLocationArea(e.target.value)}
                        placeholder="e.g. Surulere, Lagos"
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Bio <span className="text-text-secondary font-normal">(optional)</span>
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        placeholder="e.g. I fix phones, 5 years experience"
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Years of experience <span className="text-text-secondary font-normal">(optional)</span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={yearsOfExperience}
                            onChange={(e) => setYearsOfExperience(e.target.value)}
                            className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Price range <span className="text-text-secondary font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            placeholder="2,000 - 5,000"
                            className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Response channel
                    </label>
                    <select
                        value={responseChannel}
                        onChange={(e) => setResponseChannel(e.target.value as ResponseChannel)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                    >
                        <option value="whatsapp">WhatsApp only</option>
                        <option value="call">Call only</option>
                        <option value="both">Both</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Categories <span className="text-text-secondary font-normal">(choose up to 3)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => {
                            const checked = selectedCategoryIds.includes(cat.id)
                            const disabled = !checked && selectedCategoryIds.length >= 3
                            return (
                                <label
                                    key={cat.id}
                                    className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer ${checked ? 'border-secondary bg-secondary/5' : 'border-border'
                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => toggleCategory(cat.id)}
                                    />
                                    {cat.name}
                                </label>
                            )
                        })}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                    {submitting ? 'Creating profile…' : 'Create profile'}
                </button>
            </form>
        </div>
    )
}

function ProviderDashboardContent({
    user,
    profile,
    categories,
    onProfileUpdate,
}: {
    user: AuthUser | null
    profile: ProviderProfile
    categories: Category[]
    onProfileUpdate: (profile: ProviderProfile) => void
}) {
    const [reviews, setReviews] = useState<ProviderReview[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(true)

    useEffect(() => {
        getProviderReviews(profile.id)
            .then(setReviews)
            .catch(() => setReviews([]))
            .finally(() => setReviewsLoading(false))
    }, [profile.id])

    return (
        <div className="space-y-6">
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-h3 text-text-primary mb-1">
                            Welcome, {user?.full_name}!
                        </h1>
                        <p className="text-text-secondary text-sm">
                            Manage your business profile below.
                        </p>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border w-fit ${STATUS_STYLES[profile.verification_status]}`}
                    >
                        {STATUS_LABEL[profile.verification_status]}
                    </span>
                </div>
                <Link
                    href={`/provider/${profile.id}`}
                    className="inline-block mt-4 text-sm text-primary hover:text-primary-hover font-medium"
                >
                    View public profile →
                </Link>
            </div>

            <FreeFieldsForm profile={profile} onUpdate={onProfileUpdate} />
            <CategoriesForm profile={profile} categories={categories} onUpdate={onProfileUpdate} />
            <EditRequestForm profile={profile} />

            {/* Reviews received — read-only view, no submit or flag actions */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <h2 className="font-heading text-h5 text-text-primary mb-1">Your reviews</h2>
                <p className="text-text-secondary text-sm mb-4">
                    Reviews customers have left on your profile.
                </p>
                {reviewsLoading ? (
                    <p className="text-text-secondary text-sm">Loading reviews…</p>
                ) : reviews.length === 0 ? (
                    <p className="text-text-secondary text-sm">No reviews yet.</p>
                ) : (
                    <div className="flex flex-col divide-y divide-border">
                        {reviews.map((r) => (
                            <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-text-primary text-sm">
                                        {r.reviewer.full_name}
                                    </span>
                                    <span className="text-accent text-sm" aria-label={`${r.rating} out of 5 stars`}>
                                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                    </span>
                                </div>
                                {r.comment && (
                                    <p className="text-text-secondary text-sm">{r.comment}</p>
                                )}
                                <p className="text-xs text-text-secondary mt-1">
                                    {new Date(r.created_at).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function FreeFieldsForm({
    profile,
    onUpdate,
}: {
    profile: ProviderProfile
    onUpdate: (profile: ProviderProfile) => void
}) {
    const [bio, setBio] = useState(profile.bio || '')
    const [priceRange, setPriceRange] = useState(profile.price_range || '')
    const [yearsOfExperience, setYearsOfExperience] = useState(
        profile.years_of_experience?.toString() || ''
    )
    const [responseChannel, setResponseChannel] = useState<ResponseChannel>(profile.response_channel)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const updated = await updateFreeFields({
                bio: bio || undefined,
                price_range: priceRange || undefined,
                years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
                response_channel: responseChannel,
            })
            onUpdate(updated)
            setMessage('Saved.')
        } catch (err) {
            setMessage(err instanceof ApiError ? err.message : 'Something went wrong.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-h5 text-text-primary mb-1">Profile details</h2>
            <p className="text-text-secondary text-sm mb-4">
                These update instantly — no admin approval needed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {message && <p className="text-sm text-text-secondary">{message}</p>}

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Years of experience
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={yearsOfExperience}
                            onChange={(e) => setYearsOfExperience(e.target.value)}
                            className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Price range
                        </label>
                        <input
                            type="text"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Response channel
                    </label>
                    <select
                        value={responseChannel}
                        onChange={(e) => setResponseChannel(e.target.value as ResponseChannel)}
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="whatsapp">WhatsApp only</option>
                        <option value="call">Call only</option>
                        <option value="both">Both</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
            </form>
        </div>
    )
}

function CategoriesForm({
    profile,
    categories,
    onUpdate,
}: {
    profile: ProviderProfile
    categories: Category[]
    onUpdate: (profile: ProviderProfile) => void
}) {
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
        profile.categories?.map((c) => c.category_id) || []
    )
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    function toggleCategory(id: string) {
        setSelectedCategoryIds((prev) => {
            if (prev.includes(id)) return prev.filter((c) => c !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const links = await assignCategories(selectedCategoryIds)
            onUpdate({ ...profile, categories: links })
            setMessage('Categories updated.')
        } catch (err) {
            setMessage(err instanceof ApiError ? err.message : 'Something went wrong.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-h5 text-text-primary mb-1">Service categories</h2>
            <p className="text-text-secondary text-sm mb-4">Choose up to 3 categories.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {message && <p className="text-sm text-text-secondary">{message}</p>}

                <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                        const checked = selectedCategoryIds.includes(cat.id)
                        const disabled = !checked && selectedCategoryIds.length >= 3
                        return (
                            <label
                                key={cat.id}
                                className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer ${checked ? 'border-primary bg-primary/5' : 'border-border'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggleCategory(cat.id)}
                                />
                                {cat.name}
                            </label>
                        )
                    })}
                </div>

                <button
                    type="submit"
                    disabled={saving || selectedCategoryIds.length === 0}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                    {saving ? 'Saving…' : 'Save categories'}
                </button>
            </form>
        </div>
    )
}

function EditRequestForm({ profile }: { profile: ProviderProfile }) {
    const [fieldName, setFieldName] = useState<(typeof EDIT_REQUEST_FIELDS)[number]['value']>(
        'phone_number'
    )
    const [newValue, setNewValue] = useState('')
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const currentValue = (profile as unknown as Record<string, string | null>)[fieldName]
    const isPhotoField = fieldName === 'profile_photo'

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setMessage(null)

        try {
            await submitEditRequest(
                isPhotoField
                    ? { field_name: fieldName, photo: photoFile || undefined }
                    : { field_name: fieldName, new_value: newValue }
            )
            setMessage('Submitted for admin review. It will apply once approved.')
            setNewValue('')
            setPhotoFile(null)
        } catch (err) {
            setMessage(err instanceof ApiError ? err.message : 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-h5 text-text-primary mb-1">Request a sensitive change</h2>
            <p className="text-text-secondary text-sm mb-4">
                These changes require admin approval before they go live: photo, phone, WhatsApp, or
                location.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {message && <p className="text-sm text-text-secondary">{message}</p>}

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Field</label>
                    <select
                        value={fieldName}
                        onChange={(e) =>
                            setFieldName(e.target.value as (typeof EDIT_REQUEST_FIELDS)[number]['value'])
                        }
                        className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        {EDIT_REQUEST_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                    {currentValue && !isPhotoField && (
                        <p className="mt-1 text-xs text-text-secondary">Current: {currentValue}</p>
                    )}
                </div>

                {isPhotoField ? (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">New photo</label>
                        <input
                            type="file"
                            required
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:px-3 file:py-2 file:text-sm file:font-medium"
                        />
                        <p className="mt-1 text-xs text-text-secondary">JPEG, PNG, or WebP. Max 2MB.</p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">New value</label>
                        <input
                            type="text"
                            required
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="w-full rounded-lg border border-border px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                    {submitting ? 'Submitting…' : 'Submit for review'}
                </button>
            </form>
        </div>
    )
}