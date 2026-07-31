'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function Navbar() {
    const router = useRouter()

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="font-heading font-bold text-xl text-primary shrink-0">
                    Proxli
                </Link>

                <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-text-secondary">
                    <Link href="/search" className="hover:text-primary transition-colors duration-200">
                        Find a provider
                    </Link>
                    <Link href="/login" className="hover:text-primary transition-colors duration-200">
                        Log in
                    </Link>
                </nav>

                <Button variant="primary" size="sm" onClick={() => router.push('/provider-register')}>
                    Join as a provider
                </Button>
            </div>
        </header>
    )
}