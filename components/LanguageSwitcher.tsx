'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentLang = i18n.language;

  const handleLanguageChange = () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={handleLanguageChange}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle language"
      title={currentLang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {currentLang === 'en' ? 'عربي' : 'EN'}
      </span>
    </button>
  );
}
