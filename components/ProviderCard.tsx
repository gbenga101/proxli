import Link from 'next/link'
import type { PublicProviderProfile } from '@/lib/api'

type ProviderCardProps = {
    provider: PublicProviderProfile
}

export default function ProviderCard({ provider }: ProviderCardProps) {
    const isVerified = provider.verification_status === 'verified'
    const isGuest = provider.whatsapp_number === null && provider.phone_number === null
    const categories = provider.categories ?? []

    return (
        <Link
            href={`/provider/${provider.id}`}
            className="block rounded-xl border border-border bg-white p-5 hover:border-primary hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {provider.profile_photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={provider.profile_photo}
                            alt={provider.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-heading font-semibold text-text-secondary">
                            {provider.full_name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-heading font-semibold text-text-primary truncate">
                            {provider.full_name}
                        </h3>
                        {isVerified ? (
                            <span className="shrink-0 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                                Verified
                            </span>
                        ) : (
                            <span className="shrink-0 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                                Pending Verification
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-text-secondary mt-0.5">{provider.location_area}</p>

                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {categories.map((c) => (
                                <span
                                    key={c.id}
                                    className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                                >
                                    {c.category.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 text-sm flex-wrap">
                        {provider.average_rating !== null ? (
                            <span className="flex items-center gap-1 text-text-primary font-medium">
                                <StarIcon />
                                {provider.average_rating.toFixed(1)}
                                <span className="text-text-secondary font-normal">({provider.review_count})</span>
                            </span>
                        ) : (
                            <span className="text-text-secondary">No reviews yet</span>
                        )}

                        {isGuest && (
                            <span className="text-text-secondary">
                                &middot; <span className="text-primary font-medium">Login to contact</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

function StarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-accent">
            <path d="M12 2.5l2.9 6.1 6.6.8-4.8 4.6 1.2 6.6L12 17.8l-5.9 2.8 1.2-6.6L2.5 9.4l6.6-.8L12 2.5z" />
        </svg>
    )
}