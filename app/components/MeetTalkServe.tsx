'use client';

import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import { HiCheckCircle, HiPhone } from 'react-icons/hi';
import { useVoiceAgent } from '@/components/VoiceAgentContext';
import { useTranslation } from 'react-i18next';

export default function MeetTalkServe() {
  const { openDialog } = useVoiceAgent();
  const { t } = useTranslation();

  const features = [
    t('meetTalkServe.feature1'),
    t('meetTalkServe.feature2'),
    t('meetTalkServe.feature3'),
    t('meetTalkServe.feature4'),
    t('meetTalkServe.feature5'),
    t('meetTalkServe.feature6'),
  ];
  
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">
            {t('meetTalkServe.title')}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            {t('meetTalkServe.subtitle')}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <AnimatedSection key={feature} delay={index * 0.1} className="h-full">
              <div className="flex items-start gap-4 bg-white dark:bg-slate-800 rounded-xl p-6 h-full">
                <HiCheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-lg text-slate-700 dark:text-slate-300">{feature}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.6} className="text-center">
          <Button onClick={openDialog} variant="primary" size="lg" className="gap-2">
            <HiPhone className="h-5 w-5" />
            {t('common.talkToUs')}
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
