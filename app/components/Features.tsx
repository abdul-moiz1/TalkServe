'use client';

import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import { HiGlobe, HiLightningBolt, HiPhone, HiChartBar, HiShieldCheck, HiClock } from 'react-icons/hi';
import { useVoiceAgent } from '@/components/VoiceAgentContext';
import { useTranslation } from 'react-i18next';

export default function Features() {
  const { openDialog } = useVoiceAgent();
  const { t } = useTranslation();

  const features = [
    {
      icon: HiLightningBolt,
      title: 'Natural-sounding voice tuned to your brand',
      description: 'For phone calls — or optional if you only want SMS/WhatsApp.',
    },
    {
      icon: HiPhone,
      title: 'Smart routing and escalation',
      description: 'Direct calls, texts, or WhatsApp messages to the right team member instantly.',
    },
    {
      icon: HiClock,
      title: 'Unlimited simultaneous conversations',
      description: 'Handle unlimited calls, SMS threads, and WhatsApp chats at once.',
    },
    {
      icon: HiChartBar,
      title: 'Real-time analytics dashboard',
      description: 'Track call volumes, message activity, bookings, and customer insights.',
    },
  ];
  
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">
            {t('features.title')}
          </h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <AnimatedSection key={feature.title} delay={index * 0.1} className="h-full">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
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
