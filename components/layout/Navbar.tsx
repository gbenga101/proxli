'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function Navbar() {
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Lock body scroll when mobile menu drawer is active
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMenuOpen])

    // Close on Escape key press
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && isMenuOpen) {
                setIsMenuOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isMenuOpen])

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border transition-all duration-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                <Link
                    href="/"
                    className="font-heading font-extrabold text-xl sm:text-2xl text-primary shrink-0 tracking-tight flex items-center gap-1.5 focus:outline-none rounded-lg py-1 px-0.5"
                >
                    Proxli
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-text-secondary">
                    <Link
                        href="/search"
                        className="hover:text-primary transition-colors duration-200 py-2"
                    >
                        Find a provider
                    </Link>
                    <Link
                        href="/login"
                        className="hover:text-primary transition-colors duration-200 py-2"
                    >
                        Log in
                    </Link>
                </nav>

                <div className="hidden sm:block">
                    <Button variant="primary" size="sm" onClick={() => router.push('/provider-register')}>
                        Join as a provider
                    </Button>
                </div>

                {/* Mobile Menu Toggle Button (>= 44px touch target) */}
                <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="sm:hidden min-h-11 min-w-11 p-2.5 rounded-xl text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center transition-colors"
                    aria-expanded={isMenuOpen}
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMenuOpen ? (
                        <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Drawer Overlay & Panel */}
            {isMenuOpen && (
                <div className="sm:hidden fixed inset-0 z-50 flex flex-col">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200"
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <div className="relative bg-white border-b border-border shadow-xl px-4 pt-4 pb-6 mt-16 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
                        <nav className="flex flex-col gap-1">
                            <Link
                                href="/search"
                                onClick={() => setIsMenuOpen(false)}
                                className="min-h-11 flex items-center px-4 rounded-xl text-base font-semibold text-text-primary hover:bg-surface active:bg-slate-100 transition-colors"
                            >
                                🔍 Find a provider
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setIsMenuOpen(false)}
                                className="min-h-11 flex items-center px-4 rounded-xl text-base font-semibold text-text-primary hover:bg-surface active:bg-slate-100 transition-colors"
                            >
                                🔑 Log in
                            </Link>
                        </nav>

                        <div className="pt-2 border-t border-border">
                            <Button
                                variant="primary"
                                size="md"
                                className="w-full justify-center min-h-12 text-base shadow-sm"
                                onClick={() => {
                                    setIsMenuOpen(false)
                                    router.push('/provider-register')
                                }}
                            >
                                Join as a provider
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}