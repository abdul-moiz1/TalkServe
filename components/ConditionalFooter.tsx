'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isHotelPortal = pathname?.includes('/hotel/manager') || pathname?.includes('/hotel/staff') || pathname?.includes('/hotel/admin');
  const isAuthPortal = pathname?.startsWith('/auth/staff-login') || pathname?.startsWith('/auth/admin-login');
  
  if (isDashboard || isHotelPortal || isAuthPortal) {
    return null;
  }
  
  return <Footer />;
}
