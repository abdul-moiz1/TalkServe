'use client';

import Button from '@/components/Button';
import HeroSection from '@/components/HeroSection';
import { HiPhone } from 'react-icons/hi';
import { useVoiceAgent } from '@/components/VoiceAgentContext';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { openDialog } = useVoiceAgent();
  const { t } = useTranslation();
  
  return (
    <HeroSection
      title={t('hero.title')}
      highlightedText={t('hero.highlighted')}
      description={t('hero.description')}
      imagePath="/images/heroes/Modern_AI_reception_workspace_d599f705.png"
      imageAlt="Modern AI-powered reception workspace"
    >
      <div className="mb-8">
        <Button 
          onClick={openDialog}
          size="lg" 
          className="gap-2"
        >
          <HiPhone className="h-5 w-5" />
          {t('common.talkToUs')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          {t('hero.coverage24')}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          {t('hero.worksSystems')}
        </div>
      </div>
    </HeroSection>
  );
}
