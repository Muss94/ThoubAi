'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import CreditsDisplay from './CreditsDisplay';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Orders', href: '/orders' },
        { name: 'Capture', href: '/capture' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-4 bg-black/60 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <Link href="/" className="group flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    <span className="font-black tracking-[0.3em] text-white text-xs uppercase group-hover:text-primary transition-colors">Thoub AI</span>
                </Link>

                <div className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-[10px] uppercase tracking-[0.4em] font-black transition-all hover:text-primary ${pathname === link.href ? 'text-primary' : 'text-white/40'}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/capture"
                        className="btn-primary px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase hover:scale-105 transition-transform"
                    >
                        Begin Tailoring
                    </Link>

                    {session ? (
                        <div className="flex items-center gap-6 ml-2 border-l border-white/10 pl-6">
                            <CreditsDisplay />
                            <span className="text-[10px] uppercase tracking-widest text-primary/60 font-black hidden sm:block">
                                {session.user?.name?.split(' ')[0]}
                            </span>
                            <button
                                onClick={() => signOut()}
                                className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors font-black"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all text-white/80"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
