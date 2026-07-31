type CategoryIconProps = {
    name: string
    className?: string
}

// Matched against the category NAME (which schema.md confirms verbatim), not the
// slug — the real slugs live in seed.ts, which wasn't provided, so this avoids
// guessing at exact slug strings for something purely decorative.
export default function CategoryIcon({ name, className = 'w-6 h-6' }: CategoryIconProps) {
    const key = name.toLowerCase()
    const common = {
        viewBox: '0 0 24 24',
        fill: 'none' as const,
        stroke: 'currentColor',
        strokeWidth: 1.75,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        className,
    }

    if (key.includes('phone')) {
        return (
            <svg {...common}>
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
        )
    }

    if (key.includes('electric')) {
        return (
            <svg {...common}>
                <polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />
            </svg>
        )
    }

    if (key.includes('carpen')) {
        return (
            <svg {...common}>
                <path d="M3 21l6-6" />
                <path d="M13.5 6.5 17 3l4 4-3.5 3.5" />
                <path d="M8 16l8.5-8.5 3 3L11 19l-3-1-1-3z" />
            </svg>
        )
    }

    if (key.includes('hair') || key.includes('barber')) {
        return (
            <svg {...common}>
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.5" y2="15.5" />
                <line x1="8.5" y1="8.5" x2="20" y2="20" />
            </svg>
        )
    }

    if (key.includes('tailor')) {
        return (
            <svg {...common}>
                <circle cx="12" cy="6" r="2" />
                <path d="M12 8c-4 2-4 6-4 10" />
                <path d="M12 8c4 2 4 6 4 10" />
                <path d="M8 18h8" />
            </svg>
        )
    }

    if (key.includes('plumb')) {
        return (
            <svg {...common}>
                <path d="M7 3v6a3 3 0 0 0 3 3v9" />
                <path d="M17 3v6a3 3 0 0 1-3 3" />
                <path d="M7 3h4M17 3h-4" />
            </svg>
        )
    }

    if (key.includes('generator') || key.includes('ac') || key.includes('technician')) {
        return (
            <svg {...common}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
            </svg>
        )
    }

    if (key.includes('paint')) {
        return (
            <svg {...common}>
                <rect x="9" y="2" width="6" height="6" rx="1" />
                <path d="M12 8v4" />
                <path d="M7 12h10l-1.5 9h-7L7 12z" />
            </svg>
        )
    }

    if (key.includes('weld')) {
        return (
            <svg {...common}>
                <path d="M4 20 20 4" />
                <path d="M14 4l2 2M18 8l2 2M3 13l2 2M7 17l2 2" />
            </svg>
        )
    }

    if (key.includes('til') || key.includes('floor')) {
        return (
            <svg {...common}>
                <rect x="3" y="3" width="8" height="8" />
                <rect x="13" y="3" width="8" height="8" />
                <rect x="3" y="13" width="8" height="8" />
                <rect x="13" y="13" width="8" height="8" />
            </svg>
        )
    }

    if (key.includes('tv') || key.includes('electronic')) {
        return (
            <svg {...common}>
                <rect x="3" y="5" width="18" height="12" rx="1" />
                <path d="M9 21h6M12 17v4" />
            </svg>
        )
    }

    if (key.includes('laundry') || key.includes('dry clean')) {
        return (
            <svg {...common}>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <circle cx="12" cy="13" r="4" />
                <circle cx="7" cy="6" r="0.6" fill="currentColor" stroke="none" />
            </svg>
        )
    }

    // Fallback — generic tool glyph for any name that doesn't match a keyword above.
    return (
        <svg {...common}>
            <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4L14.7 6.3z" />
        </svg>
    )
}