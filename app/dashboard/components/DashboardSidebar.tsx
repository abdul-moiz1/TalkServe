'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiUsers, FiUserPlus, FiMenu, FiX, FiLogOut, FiMessageSquare, FiLoader } from 'react-icons/fi';

interface SidebarProps {
  onSignOut: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Onboarding', href: '/dashboard/onboarding', icon: FiUserPlus },
  { name: 'Whatsapp', href: '/dashboard/whatsapp/customers', icon: FiUsers },
  { name: 'SMS', href: '/dashboard/sms/customers?type=SMS agent', icon: FiMessageSquare },
];

export default function DashboardSidebar({ onSignOut, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  const isActive = (href: string) => {
    const hrefPath = href.split('?')[0];
    if (hrefPath === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(hrefPath);
  };

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (isActive(href)) return;
    
    setLoadingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  React.useEffect(() => {
    if (!isPending) {
      setLoadingHref(null);
    }
  }, [isPending]);

  const handlePrefetch = (href: string) => {
    router.prefetch(href);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-[68px] left-4 z-40 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg"
      >
        {isMobileMenuOpen ? (
          <FiX className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <FiMenu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed top-[60px] left-0 right-0 bottom-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-[60px] left-0 z-40 h-[calc(100vh-60px)] w-64 
          bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:h-screen
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <Link href="/" className="block">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">TalkServe</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI Voice Agent</p>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isLoading = loadingHref === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  onMouseEnter={() => handlePrefetch(item.href)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${active 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                    ${isLoading ? 'opacity-70' : ''}
                  `}
                >
                  {isLoading ? (
                    <FiLoader className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  )}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userEmail}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="ml-3 p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Sign Out"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
