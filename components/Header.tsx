'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiMenu, HiX, HiMoon, HiSun } from 'react-icons/hi';
import { useTheme } from './DarkModeProvider';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from './auth/UserProfile';
import LogoIcon from './LogoIcon';
import clsx from 'clsx';

const navigation = [
  { 
    name: 'Industries', 
    items: [
      { name: 'Dental Clinics', href: '/dental' },
      { name: 'Restaurants', href: '/restaurants' },
      { name: 'Service Businesses', href: '/services' },
    ]
  },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Security', href: '/security' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();

  const isDashboard = pathname?.startsWith('/dashboard');
  const isHotelPortal = pathname?.includes('/hotel/manager') || pathname?.includes('/hotel/staff');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      
      if (isDashboard || isHotelPortal) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isDashboard, isHotelPortal]);

  if (isHotelPortal) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-8 h-8 text-primary" />
              <span className="text-xl font-display font-bold text-primary">
                TalkServe
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Powered by TalkServe
              </span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <HiSun className="h-5 w-5 text-slate-300" />
                ) : (
                  <HiMoon className="h-5 w-5 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm'
          : 'bg-transparent',
        visible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <LogoIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              <span className="text-2xl sm:text-3xl font-display font-bold text-primary">
                TalkServe
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-x-8">
            {navigation.map((item) => (
              item.items ? (
                <div key={item.name} className="relative group">
                  <button className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    {item.name}
                  </button>
                  <div className="absolute left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5 py-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={clsx(
                            'block px-4 py-2 text-sm transition-colors',
                            pathname === subItem.href
                              ? 'text-primary bg-blue-50 dark:bg-blue-900/20'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={clsx(
                    'text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary'
                  )}
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <HiSun className="h-5 w-5 text-slate-300" />
              ) : (
                <HiMoon className="h-5 w-5 text-slate-700" />
              )}
            </button>

            {loading ? (
              <div className="hidden md:block w-8 h-8 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            ) : user ? (
              <div className="hidden md:block">
                <UserProfile />
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <HiX className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              ) : (
                <HiMenu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 bg-white dark:bg-slate-900 shadow-lg rounded-lg mt-2 border border-slate-200 dark:border-slate-700">
            {navigation.map((item) => (
              item.items ? (
                <div key={item.name}>
                  <div className="px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {item.name}
                  </div>
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        'block px-6 py-2 text-sm',
                        pathname === subItem.href
                          ? 'text-primary bg-blue-50 dark:bg-blue-900/20'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href!}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'block px-3 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  {item.name}
                </Link>
              )
            ))}
            <div className="px-3 mt-4 space-y-2">
              {loading ? (
                <div className="w-full h-10 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ) : user ? (
                <UserProfile />
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary text-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
