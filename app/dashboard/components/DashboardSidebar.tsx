'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiUsers, FiUserPlus, FiMenu, FiX, FiLogOut, FiMessageSquare, FiLoader, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface SidebarProps {
  onSignOut: () => void;
  userEmail?: string | null;
  userName?: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { 
      name: 'Hotel Team', 
      href: '/dashboard/hotel-admin', 
      icon: FiUsers,
      onClick: (e: React.MouseEvent, router: any) => {
        e.preventDefault();
        const bid = localStorage.getItem('currentBusinessId');
        if (bid) {
          router.push(`/dashboard/hotel-admin?businessId=${bid}`);
        } else {
          router.push('/dashboard');
        }
      }
    },
    { name: 'Onboarding', href: '/dashboard/onboarding', icon: FiUserPlus },
  { name: 'Whatsapp', href: '/dashboard/whatsapp/customers', icon: FiUsers },
  { name: 'SMS', href: '/dashboard/sms/customers?type=SMS agent', icon: FiMessageSquare },
];

export default function DashboardSidebar({ onSignOut, userEmail, userName, isCollapsed, onToggleCollapse }: SidebarProps) {
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

      <button
        onClick={onToggleCollapse}
        className={`
          hidden lg:flex fixed top-[100px] w-8 h-8 bg-blue-600 hover:bg-blue-700 
          border-2 border-white dark:border-slate-700 rounded-full items-center justify-center 
          shadow-lg transition-all duration-300 z-[60]
          ${isCollapsed ? 'left-[64px]' : 'left-[248px]'}
        `}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <FiChevronRight className="w-5 h-5 text-white" />
        ) : (
          <FiChevronLeft className="w-5 h-5 text-white" />
        )}
      </button>

      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-64px)]
          bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
          transform transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64 overflow-y-auto overflow-x-hidden
        `}
      >
        <div className="flex flex-col h-full relative min-h-0">

          <div className={`p-6 border-b border-gray-200 dark:border-slate-700 ${isCollapsed ? 'lg:p-4 lg:text-center' : ''}`}>
            <Link href="/" className="block">
              <h1 className={`text-xl font-bold text-blue-600 dark:text-blue-400 ${isCollapsed ? 'lg:text-sm' : ''}`}>
                {isCollapsed ? 'TS' : 'TalkServe'}
              </h1>
              {!isCollapsed && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden lg:block">AI Voice Agent</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 lg:hidden">AI Voice Agent</p>
            </Link>
          </div>

          <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${isCollapsed ? 'lg:p-2' : ''}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isLoading = loadingHref === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      item.onClick(e, router);
                    } else {
                      handleNavClick(item.href, e);
                    }
                  }}
                  onMouseEnter={() => handlePrefetch(item.href)}
                  title={isCollapsed ? item.name : undefined}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
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
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  )}
                  <span className={`${isCollapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className={`p-4 border-t border-gray-200 dark:border-slate-700 ${isCollapsed ? 'lg:p-2' : ''}`}>
            <div className={`flex items-center justify-between px-4 py-3 ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 hidden lg:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {userEmail}
                  </p>
                </div>
              )}
              <div className="flex-1 min-w-0 lg:hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userEmail}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className={`p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isCollapsed ? '' : 'ml-3'}`}
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
