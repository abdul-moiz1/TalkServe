'use client';

import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import { useVoiceAgent } from '@/components/VoiceAgentContext';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { openDialog } = useVoiceAgent();
  const { t } = useTranslation();

  const steps = [
    {
      number: '01',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
    },
    {
      number: '02',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
    },
    {
      number: '03',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
    },
  ];
  
  return (
    <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">
            {t('howItWorks.title')}
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {steps.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.15}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.5} className="text-center">
          <Button onClick={openDialog} variant="primary" size="lg">
            {t('common.talkToUs')}
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
