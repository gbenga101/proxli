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
            className="block rounded-2xl border border-border bg-white p-4 sm:p-5 hover:border-primary hover:shadow-md transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20 group"
        >
            <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {provider.profile_photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={provider.profile_photo}
                            alt={provider.full_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                    ) : (
                        <span className="text-lg font-heading font-extrabold text-text-secondary">
                            {provider.full_name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <h3 className="text-base font-heading font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                            {provider.full_name}
                        </h3>
                        {isVerified ? (
                            <span className="shrink-0 text-xs font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20">
                                Verified
                            </span>
                        ) : (
                            <span className="shrink-0 text-xs font-semibold text-warning bg-warning/10 px-2.5 py-0.5 rounded-full border border-warning/20">
                                Pending
                            </span>
                        )}
                    </div>

                    <p className="text-xs sm:text-sm text-text-secondary mt-0.5 flex items-center gap-1">
                        📍 <span>{provider.location_area}</span>
                    </p>

                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {categories.map((c) => (
                                <span
                                    key={c.id}
                                    className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full"
                                >
                                    {c.category.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm flex-wrap">
                        {provider.average_rating !== null ? (
                            <span className="flex items-center gap-1 text-text-primary font-bold">
                                <StarIcon />
                                {provider.average_rating.toFixed(1)}
                                <span className="text-text-secondary font-normal text-xs">({provider.review_count})</span>
                            </span>
                        ) : (
                            <span className="text-text-secondary text-xs">No reviews yet</span>
                        )}

                        {isGuest && (
                            <span className="text-text-secondary text-xs font-medium">
                                &middot; <span className="text-primary font-semibold hover:underline">Login to contact</span>
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