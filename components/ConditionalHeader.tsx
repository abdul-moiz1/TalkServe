'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isHotelPortal = pathname?.includes('/hotel/manager') || pathname?.includes('/hotel/staff');
  const isAuthPortal = pathname?.startsWith('/auth/staff-login');
  
  if (isHotelPortal || isAuthPortal) {
    return null;
  }
  
  return <Header />;
}
