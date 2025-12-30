'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isHotelPortal = pathname?.includes('/hotel/manager') || pathname?.includes('/hotel/staff') || pathname?.includes('/hotel/admin');
  const isAuthPortal = pathname?.startsWith('/auth/staff-login') || pathname?.startsWith('/auth/admin-login');
  
  if (isHotelPortal || isAuthPortal) {
    return null;
  }
  
  return <Header />;
}
