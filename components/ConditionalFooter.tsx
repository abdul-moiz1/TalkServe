'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isHotelPortal = pathname?.includes('/hotel/manager') || pathname?.includes('/hotel/staff');
  const isAuthPortal = pathname?.startsWith('/auth/staff-login');
  
  if (isDashboard || isHotelPortal || isAuthPortal) {
    return null;
  }
  
  return <Footer />;
}
