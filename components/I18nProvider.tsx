'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize i18n on mount
    if (!i18n.isInitialized) {
      i18n.init();
    }
    
    // Set language attribute
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    document.documentElement.lang = currentLang;
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
