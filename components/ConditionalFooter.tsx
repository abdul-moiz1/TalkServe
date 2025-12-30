'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isHotelPortal = pathname?.startsWith('/hotel/manager') || pathname?.startsWith('/hotel/staff');
  
  if (isDashboard || isHotelPortal) {
    return null;
  }
  
  return <Footer />;
}
