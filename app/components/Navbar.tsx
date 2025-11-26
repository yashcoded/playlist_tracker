"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/transfer", label: "Transfer" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/30 dark:border-gray-600/30 bg-gray-900/95 dark:bg-black/95 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-black/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-pink-400 to-purple-500 text-white shadow-xl shadow-cyan-500/30 ring-1 ring-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-105">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight leading-none">
                  Playlist Transfer
                </span>
                <span className="text-xs text-gray-300 font-medium">
                  by <span 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open('https://yashcoded.com', '_blank', 'noopener,noreferrer');
                    }}
                    className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer"
                  >
                    yashcoded.com
                  </span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-6 py-3 text-base font-bold transition-all duration-300 rounded-2xl transform hover:scale-105 ${
                  isActive(item.href)
                    ? "text-white bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-600 shadow-xl shadow-cyan-500/30 scale-105"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-lg hover:shadow-gray-900/50"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {isActive(item.href) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-600 rounded-2xl blur-sm opacity-50 -z-10 animate-pulse" />
                )}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <div className="transform transition-all duration-300 hover:scale-110">
              <ThemeToggle />
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-xl p-3 text-gray-300 hover:bg-gray-800/80 hover:text-white transition-all duration-300 transform hover:scale-105"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700/50 py-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-6 py-4 text-lg font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-cyan-500/25"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/80 hover:shadow-lg"
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
