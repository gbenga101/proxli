'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
    logoutAdmin,
    getStats,
    getCategories,
    listAdminProviders,
    verifyProvider,
    rejectProvider,
    suspendProvider,
    reactivateProvider,
    deleteProvider,
    createProviderByAdmin,
    listEditRequests,
    reviewEditRequest,
    listAdminCustomers,
    suspendCustomer,
    reactivateCustomer,
    deleteCustomer,
    listAdminReviews,
    deleteReview,
} from '@/lib/api'
import type {
    PlatformStats,
    Category,
    AdminProviderProfile,
    AdminEditRequest,
    AdminCustomer,
    AdminReview,
    ResponseChannel,
} from '@/lib/api'

type Tab = 'providers' | 'edit-requests' | 'customers' | 'reviews'

export default function AdminDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('providers')
    const [stats, setStats] = useState<PlatformStats | null>(null)

    async function handleAdminLogout() {
        setLoading(true)
        try {
            await logoutAdmin()
        } finally {
            router.push('/admin/login')
        }
    }

    const refreshStats = useCallback(() => {
        getStats().then(setStats).catch(() => setStats(null))
    }, [])

    useEffect(() => {
        refreshStats()
    }, [refreshStats])

    const TABS: { key: Tab; label: string }[] = [
        { key: 'providers', label: 'Providers' },
        { key: 'edit-requests', label: 'Edit Requests' },
        { key: 'customers', label: 'Customers' },
        { key: 'reviews', label: 'Reviews' },
    ]

    return (
        <div className="min-h-screen bg-surface">
            <header className="bg-text-primary text-white border-b border-gray-800 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="font-heading text-xl font-extrabold text-white">
                            Proxli
                        </Link>
                        <span className="text-xs uppercase tracking-wider bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                            Admin Console
                        </span>
                    </div>
                    <button
                        onClick={handleAdminLogout}
                        disabled={loading}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm text-gray-300 hover:text-white transition-colors font-semibold"
                    >
                        {loading ? 'Logging out…' : 'Log out'}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xs">
                    <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-primary mb-1">
                        Platform Management
                    </h1>
                    <p className="text-text-secondary text-xs sm:text-sm">
                        Approve providers, manage customers, moderate reviews, and monitor edit requests.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <StatCard label="Providers" value={stats?.total_providers} sublabel="Total registered" />
                    <StatCard label="Customers" value={stats?.total_customers} sublabel="Registered accounts" />
                    <StatCard label="Reviews" value={stats?.total_reviews} sublabel="Submitted on platform" />
                </div>

                {/* Mobile horizontal scroll tab bar */}
                <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto pb-0.5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold border-b-2 shrink-0 transition-colors duration-200 ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'providers' && <ProvidersTab onChange={refreshStats} />}
                {activeTab === 'edit-requests' && <EditRequestsTab />}
                {activeTab === 'customers' && <CustomersTab onChange={refreshStats} />}
                {activeTab === 'reviews' && <ReviewsTab onChange={refreshStats} />}
            </main>
        </div>
    )
}


// -----------------------------
// Shared small pieces
// -----------------------------

function StatCard({ label, value, sublabel }: { label: string; value?: number; sublabel: string }) {
    return (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</span>
            <p className="text-h3 font-heading text-text-primary mt-2">{value ?? '--'}</p>
            <p className="text-xs text-text-secondary mt-1">{sublabel}</p>
        </div>
    )
}

function StatusBadge({ status }: { status: 'pending' | 'verified' | 'rejected' }) {
    const styles: Record<string, string> = {
        verified: 'text-success bg-success/10',
        pending: 'text-warning bg-warning/10',
        rejected: 'text-error bg-error/10',
    }
    const labels: Record<string, string> = {
        verified: 'Verified',
        pending: 'Pending',
        rejected: 'Rejected',
    }
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>{labels[status]}</span>
    )
}

function ActionLink({
    onClick,
    label,
    danger = false,
}: {
    onClick: () => void
    label: string
    danger?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={`text-xs font-medium hover:underline ${danger ? 'text-error' : 'text-primary'}`}
        >
            {label}
        </button>
    )
}

// -----------------------------
// Providers tab
// -----------------------------

type ProviderModalState = { type: 'reject' | 'suspend' | 'delete'; id: string } | null

function ProvidersTab({ onChange }: { onChange: () => void }) {
    const [providers, setProviders] = useState<AdminProviderProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [modal, setModal] = useState<ProviderModalState>(null)

    const load = useCallback(() => {
        setLoading(true)
        listAdminProviders()
            .then(setProviders)
            .catch(() => setActionError('Failed to load providers'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        load()
    }, [load])

    async function handleVerify(id: string) {
        setActionError(null)
        try {
            await verifyProvider(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to verify provider')
        }
    }

    async function handleReactivate(id: string) {
        setActionError(null)
        try {
            await reactivateProvider(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to reactivate provider')
        }
    }

    async function handleReject(id: string, reason: string) {
        setActionError(null)
        try {
            await rejectProvider(id, reason)
            load()
            onChange()
        } catch {
            setActionError('Failed to reject provider')
        }
    }

    async function handleSuspend(id: string) {
        setActionError(null)
        try {
            await suspendProvider(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to suspend provider')
        }
    }

    async function handleDelete(id: string) {
        setActionError(null)
        try {
            await deleteProvider(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to delete provider')
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-h5 font-heading text-text-primary">Providers</h2>
                <Button size="sm" onClick={() => setShowCreateForm((v) => !v)}>
                    {showCreateForm ? 'Cancel' : 'Create Provider'}
                </Button>
            </div>

            {showCreateForm && (
                <CreateProviderForm
                    onCreated={() => {
                        setShowCreateForm(false)
                        load()
                        onChange()
                    }}
                />
            )}

            {actionError && <p className="text-error text-sm mb-4">{actionError}</p>}

            {loading ? (
                <p className="text-text-secondary">Loading providers…</p>
            ) : providers.length === 0 ? (
                <p className="text-text-secondary">No providers yet.</p>
            ) : (
                <div className="bg-white border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface text-text-secondary text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-4 py-3">Name</th>
                                <th className="text-left px-4 py-3">Location</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Account</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map((p) => (
                                <tr key={p.id} className="border-t border-border">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-text-primary">{p.user.full_name}</div>
                                        <div className="text-text-secondary text-xs">{p.user.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">{p.location_area}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={p.verification_status} />
                                        {p.verification_status === 'rejected' && p.rejection_reason && (
                                            <div className="text-xs text-text-secondary mt-1 max-w-[180px]">
                                                {p.rejection_reason}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.user.is_active ? (
                                            <span className="text-xs text-success">Active</span>
                                        ) : (
                                            <span className="text-xs text-error">Suspended</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2 flex-wrap">
                                            {p.verification_status !== 'verified' && (
                                                <ActionLink onClick={() => handleVerify(p.id)} label="Verify" />
                                            )}
                                            {p.verification_status !== 'rejected' && (
                                                <ActionLink
                                                    onClick={() => setModal({ type: 'reject', id: p.id })}
                                                    label="Reject"
                                                />
                                            )}
                                            {p.user.is_active ? (
                                                <ActionLink
                                                    onClick={() => setModal({ type: 'suspend', id: p.id })}
                                                    label="Suspend"
                                                />
                                            ) : (
                                                <ActionLink onClick={() => handleReactivate(p.id)} label="Reactivate" />
                                            )}
                                            <ActionLink
                                                onClick={() => setModal({ type: 'delete', id: p.id })}
                                                label="Delete"
                                                danger
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                open={modal?.type === 'reject'}
                title="Reject provider"
                description="This reason is visible to you in the providers list."
                variant="prompt"
                promptLabel="Reason"
                promptPlaceholder="e.g. Photo doesn't clearly show the workshop"
                confirmLabel="Reject"
                danger
                onConfirm={(reason) => {
                    if (modal && reason) handleReject(modal.id, reason)
                    setModal(null)
                }}
                onCancel={() => setModal(null)}
            />
            <Modal
                open={modal?.type === 'suspend'}
                title="Suspend provider"
                description="Their listing will be hidden from search until you reactivate them."
                confirmLabel="Suspend"
                danger
                onConfirm={() => {
                    if (modal) handleSuspend(modal.id)
                    setModal(null)
                }}
                onCancel={() => setModal(null)}
            />
            <Modal
                open={modal?.type === 'delete'}
                title="Delete provider"
                description="This permanently deletes the provider profile and cannot be undone."
                confirmLabel="Delete"
                danger
                onConfirm={() => {
                    if (modal) handleDelete(modal.id)
                    setModal(null)
                }}
                onCancel={() => setModal(null)}
            />
        </div>
    )
}

function CreateProviderForm({ onCreated }: { onCreated: () => void }) {
    const [categories, setCategories] = useState<Category[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [userPhone, setUserPhone] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [phone, setPhone] = useState('')
    const [bio, setBio] = useState('')
    const [years, setYears] = useState('')
    const [priceRange, setPriceRange] = useState('')
    const [locationArea, setLocationArea] = useState('')
    const [responseChannel, setResponseChannel] = useState<ResponseChannel>('whatsapp')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    useEffect(() => {
        getCategories().then(setCategories).catch(() => setCategories([]))
    }, [])

    function toggleCategory(id: string) {
        setSelectedCategories((prev) => {
            if (prev.includes(id)) return prev.filter((c) => c !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (selectedCategories.length === 0) {
            setError('Select at least 1 category')
            return
        }

        setSubmitting(true)
        try {
            await createProviderByAdmin({
                full_name: fullName,
                email,
                password,
                user_phone_number: userPhone || undefined,
                whatsapp_number: whatsapp,
                phone_number: phone || undefined,
                bio: bio || undefined,
                years_of_experience: years ? Number(years) : undefined,
                price_range: priceRange || undefined,
                location_area: locationArea,
                response_channel: responseChannel,
                category_ids: selectedCategories,
            })
            onCreated()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create provider')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-5 mb-6">
            <h3 className="text-base font-heading font-semibold text-text-primary mb-1">
                Manually create a provider
            </h3>
            <p className="text-xs text-text-secondary mb-4">
                Profile photo upload isn&apos;t wired up on this form yet — the backend endpoint
                supports it, this form just doesn&apos;t send one.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input label="Full name" name="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Input label="Account phone (optional)" name="user_phone_number" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                <Input label="WhatsApp number" name="whatsapp_number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                <Input label="Alternative phone (optional)" name="phone_number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Location area" name="location_area" placeholder="e.g. Surulere, Lagos" value={locationArea} onChange={(e) => setLocationArea(e.target.value)} required />
                <Input label="Years of experience (optional)" name="years_of_experience" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
                <Input label="Price range (optional)" name="price_range" placeholder="e.g. 2,000 - 5,000" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} />
            </div>

            <div className="mb-4">
                <label className="text-sm font-medium text-text-primary block mb-1.5">Response channel</label>
                <select
                    value={responseChannel}
                    onChange={(e) => setResponseChannel(e.target.value as ResponseChannel)}
                    className="w-full sm:w-64 px-4 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary bg-white"
                >
                    <option value="whatsapp">WhatsApp only</option>
                    <option value="call">Call only</option>
                    <option value="both">WhatsApp or Call</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="text-sm font-medium text-text-primary block mb-1.5">Categories (up to 3)</label>
                <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                        <button
                            type="button"
                            key={c.id}
                            onClick={() => toggleCategory(c.id)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                                selectedCategories.includes(c.id)
                                    ? 'bg-primary text-white border-primary'
                                    : 'text-text-secondary border-border hover:border-primary'
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label className="text-sm font-medium text-text-primary block mb-1.5">Bio (optional)</label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:border-primary"
                />
            </div>

            {error && <p className="text-error text-sm mb-4">{error}</p>}

            <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create provider'}
            </Button>
        </form>
    )
}

// -----------------------------
// Edit requests tab
// -----------------------------

function EditRequestsTab() {
    const [requests, setRequests] = useState<AdminEditRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [actionError, setActionError] = useState<string | null>(null)
    const [rejectingId, setRejectingId] = useState<string | null>(null)

    const load = useCallback(() => {
        setLoading(true)
        listEditRequests()
            .then(setRequests)
            .catch(() => setActionError('Failed to load edit requests'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        load()
    }, [load])

    async function handleApprove(id: string) {
        setActionError(null)
        try {
            await reviewEditRequest(id, 'approve')
            load()
        } catch {
            setActionError('Failed to approve edit request')
        }
    }

    async function handleReject(id: string, note?: string) {
        setActionError(null)
        try {
            await reviewEditRequest(id, 'reject', note)
            load()
        } catch {
            setActionError('Failed to reject edit request')
        }
    }

    return (
        <div>
            <h2 className="text-h5 font-heading text-text-primary mb-4">Pending Edit Requests</h2>
            {actionError && <p className="text-error text-sm mb-4">{actionError}</p>}
            {loading ? (
                <p className="text-text-secondary">Loading…</p>
            ) : requests.length === 0 ? (
                <p className="text-text-secondary">No pending edit requests.</p>
            ) : (
                <div className="bg-white border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface text-text-secondary text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-4 py-3">Provider</th>
                                <th className="text-left px-4 py-3">Field</th>
                                <th className="text-left px-4 py-3">Old value</th>
                                <th className="text-left px-4 py-3">New value</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((r) => (
                                <tr key={r.id} className="border-t border-border">
                                    <td className="px-4 py-3 text-text-primary">{r.provider_profile.user.full_name}</td>
                                    <td className="px-4 py-3 text-text-secondary">{r.field_name}</td>
                                    <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate">{r.old_value ?? '—'}</td>
                                    <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate">{r.new_value}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <ActionLink onClick={() => handleApprove(r.id)} label="Approve" />
                                            <ActionLink onClick={() => setRejectingId(r.id)} label="Reject" danger />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                open={rejectingId !== null}
                title="Reject edit request"
                description="Optional note explaining why — visible to you, not sent to the provider yet (email notifications aren't wired up until Day 6)."
                variant="prompt"
                promptLabel="Note (optional)"
                promptPlaceholder="e.g. Location doesn't match verification records"
                confirmLabel="Reject"
                danger
                onConfirm={(note) => {
                    if (rejectingId) handleReject(rejectingId, note || undefined)
                    setRejectingId(null)
                }}
                onCancel={() => setRejectingId(null)}
            />
        </div>
    )
}

// -----------------------------
// Customers tab
// -----------------------------

type CustomerModalState = { type: 'suspend' | 'delete'; id: string } | null

function CustomersTab({ onChange }: { onChange: () => void }) {
    const [customers, setCustomers] = useState<AdminCustomer[]>([])
    const [loading, setLoading] = useState(true)
    const [actionError, setActionError] = useState<string | null>(null)
    const [modal, setModal] = useState<CustomerModalState>(null)

    const load = useCallback(() => {
        setLoading(true)
        listAdminCustomers()
            .then(setCustomers)
            .catch(() => setActionError('Failed to load customers'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        load()
    }, [load])

    async function handleSuspend(id: string) {
        setActionError(null)
        try {
            await suspendCustomer(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to suspend customer')
        }
    }

    async function handleReactivate(id: string) {
        setActionError(null)
        try {
            await reactivateCustomer(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to reactivate customer')
        }
    }

    async function handleDelete(id: string) {
        setActionError(null)
        try {
            await deleteCustomer(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to delete customer')
        }
    }

    return (
        <div>
            <h2 className="text-h5 font-heading text-text-primary mb-4">Customers</h2>
            {actionError && <p className="text-error text-sm mb-4">{actionError}</p>}
            {loading ? (
                <p className="text-text-secondary">Loading…</p>
            ) : customers.length === 0 ? (
                <p className="text-text-secondary">No customers yet.</p>
            ) : (
                <div className="bg-white border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface text-text-secondary text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-4 py-3">Name</th>
                                <th className="text-left px-4 py-3">Roles</th>
                                <th className="text-left px-4 py-3">Account</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.id} className="border-t border-border">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-text-primary">{c.full_name}</div>
                                        <div className="text-text-secondary text-xs">{c.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        {c.roles.map((r) => r.role).join(', ')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.is_active ? (
                                            <span className="text-xs text-success">Active</span>
                                        ) : (
                                            <span className="text-xs text-error">Suspended</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            {c.is_active ? (
                                                <ActionLink
                                                    onClick={() => setModal({ type: 'suspend', id: c.id })}
                                                    label="Suspend"
                                                />
                                            ) : (
                                                <ActionLink onClick={() => handleReactivate(c.id)} label="Reactivate" />
                                            )}
                                            <ActionLink
                                                onClick={() => setModal({ type: 'delete', id: c.id })}
                                                label="Delete"
                                                danger
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                open={modal?.type === 'suspend'}
                title="Suspend customer"
                description="Their account is deactivated until you reactivate it."
                confirmLabel="Suspend"
                danger
                onConfirm={() => {
                    if (modal) handleSuspend(modal.id)
                    setModal(null)
                }}
                onCancel={() => setModal(null)}
            />
            <Modal
                open={modal?.type === 'delete'}
                title="Remove customer"
                description="Their customer role and reviews are removed. If they also have a provider profile, it is left completely untouched."
                confirmLabel="Remove"
                danger
                onConfirm={() => {
                    if (modal) handleDelete(modal.id)
                    setModal(null)
                }}
                onCancel={() => setModal(null)}
            />
        </div>
    )
}

// -----------------------------
// Reviews tab
// -----------------------------

function ReviewsTab({ onChange }: { onChange: () => void }) {
    const [reviews, setReviews] = useState<AdminReview[]>([])
    const [loading, setLoading] = useState(true)
    const [flaggedOnly, setFlaggedOnly] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const load = useCallback(() => {
        setLoading(true)
        listAdminReviews()
            .then(setReviews)
            .catch(() => setActionError('Failed to load reviews'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        load()
    }, [load])

    async function handleDelete(id: string) {
        setActionError(null)
        try {
            await deleteReview(id)
            load()
            onChange()
        } catch {
            setActionError('Failed to delete review')
        }
    }

    const visibleReviews = flaggedOnly ? reviews.filter((r) => r.is_flagged) : reviews

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-h5 font-heading text-text-primary">Reviews</h2>
                <label className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                        type="checkbox"
                        checked={flaggedOnly}
                        onChange={(e) => setFlaggedOnly(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                    />
                    Flagged only
                </label>
            </div>

            {actionError && <p className="text-error text-sm mb-4">{actionError}</p>}

            {loading ? (
                <p className="text-text-secondary">Loading…</p>
            ) : visibleReviews.length === 0 ? (
                <p className="text-text-secondary">No reviews to show.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {visibleReviews.map((r) => (
                        <div key={r.id} className="bg-white border border-border rounded-xl p-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="text-sm font-medium text-text-primary">
                                        {r.reviewer.full_name} → {r.provider_profile.user.full_name}
                                    </div>
                                    <div className="text-xs text-text-secondary mt-0.5">
                                        {r.rating}/5{r.is_deleted ? ' · Deleted' : ''}{r.is_flagged ? ' · Flagged' : ''}
                                    </div>
                                    {r.comment && <p className="text-sm text-text-secondary mt-2">{r.comment}</p>}
                                    {r.is_flagged && r.flag_reason && (
                                        <p className="text-xs text-warning mt-2">Flag reason: {r.flag_reason}</p>
                                    )}
                                </div>
                                {!r.is_deleted && (
                                    <ActionLink onClick={() => setDeletingId(r.id)} label="Delete" danger />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                open={deletingId !== null}
                title="Delete review"
                description="This hides the review from the provider's public profile."
                confirmLabel="Delete"
                danger
                onConfirm={() => {
                    if (deletingId) handleDelete(deletingId)
                    setDeletingId(null)
                }}
                onCancel={() => setDeletingId(null)}
            />
        </div>
    )
}