'use client';

import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import HeroSection from '@/components/HeroSection';
import { HiCheckCircle, HiX, HiPhone, HiGlobeAlt, HiOutlineLightningBolt, HiDeviceMobile, HiCurrencyDollar } from 'react-icons/hi';
import { useVoiceAgent } from '@/components/VoiceAgentContext';

const challenges = [
  {
    title: 'The Language Gap',
    description: 'Global guests and multilingual staff lead to miscommunication, bad service, and negative reviews.',
    icon: HiGlobeAlt,
    color: 'red'
  },
  {
    title: 'The Operational Bottleneck',
    description: 'Every guest request funnels through the front desk, causing delays and lost messages.',
    icon: HiOutlineLightningBolt,
    color: 'orange'
  },
  {
    title: 'The App Fatigue',
    description: "Guests won't download a hotel app for a short stay, so they clog phone lines instead.",
    icon: HiDeviceMobile,
    color: 'blue'
  },
  {
    title: 'The Commission Trap',
    description: 'Loyal guests re-book through sites like Booking.com, costing you 15-20% in commissions.',
    icon: HiCurrencyDollar,
    color: 'emerald'
  }
];

const solutions = [
  {
    title: 'Break the Language Barrier',
    description: 'The AI acts as a universal translator between guests and staff in over 80 languages.'
  },
  {
    title: 'Automate Your Operations',
    description: 'AI routes requests like "towels" or "AC Broken" directly to the correct department.'
  },
  {
    title: 'Empower Your Staff with "Snap-to-Fix"',
    description: 'Staff can report maintenance issues by sending a photo, which auto-creates a repair ticket.'
  },
  {
    title: 'Recapture Lost Revenue',
    description: 'The AI automatically messages checked-out guests with a direct booking discount for future stays.'
  }
];

export default function HotelIndustryPage() {
  const { openDialog } = useVoiceAgent();
  
  return (
    <>
      <HeroSection
        title="The AI Solution for"
        highlightedText="Modern Hospitality"
        description="Transforming operations and guest experience for hotels with a WhatsApp-based AI Digital Butler, addressing core challenges and boosting direct revenue."
        imagePath="/attached_assets/stock_images/luxury_hotel_lobby_i_9f0374f3.jpg"
        imageAlt="Modern hotel lobby"
      >
        <div className="mb-8">
          <Button 
            onClick={openDialog}
            size="lg" 
            className="gap-2"
          >
            <HiPhone className="h-5 w-5" />
            Talk to Us
          </Button>
        </div>
      </HeroSection>

      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
              The 4 "Silent Killers" of Modern Hospitality
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {challenges.map((challenge, index) => (
              <AnimatedSection key={challenge.title} delay={index * 0.1}>
                <div className={`h-full p-8 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-${challenge.color}-50 dark:bg-${challenge.color}-900/20`}>
                    <challenge.icon className={`w-6 h-6 text-${challenge.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{challenge.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{challenge.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
              The WhatsApp AI Solution
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {solutions.map((solution, index) => (
              <AnimatedSection key={solution.title} delay={index * 0.1}>
                <div className="flex items-start gap-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm h-full">
                  <div className="flex-shrink-0 mt-1">
                    <HiCheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{solution.title}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{solution.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Ready to transform your hotel experience?
            </h2>
            <Button 
              onClick={openDialog}
              variant="secondary"
              size="lg" 
              className="gap-2 bg-white text-primary hover:bg-blue-50"
            >
              <HiPhone className="h-5 w-5" />
              Talk to Us
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
