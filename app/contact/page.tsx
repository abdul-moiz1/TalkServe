'use client';

import HeroSection from '@/components/HeroSection';
import { HiPhone } from 'react-icons/hi';
import { IoLogoWhatsapp } from 'react-icons/io';
import { useVoiceAgent } from '@/components/VoiceAgentContext';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function ContactPage() {
  const { openDialog } = useVoiceAgent();
  const { t } = useTranslation();
  const phoneNumber = '+18575243646';
  const message = 'hello';
  const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappUrl)}`;
  
  return (
    <>
      <HeroSection
        title={t('contact.title')}
        highlightedText={t('contact.highlighted')}
        description={t('contact.description')}
        imagePath="/images/heroes/Customer_service_communication_3a46d4c0.png"
        imageAlt="Customer service communication"
      >
        <div className="mb-8">
          <button 
            onClick={openDialog}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-all duration-250 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
          >
            <HiPhone className="h-5 w-5" />
            {t('common.talkToUs')}
          </button>
        </div>
      </HeroSection>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-16 sm:py-20">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-40" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              <div className="relative bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
                <div className="relative">
                  <Image
                    src={qrCodeUrl}
                    alt="WhatsApp QR Code"
                    width={300}
                    height={300}
                    className="rounded-lg w-full h-auto"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg ring-2 ring-primary/20">
                      <IoLogoWhatsapp className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 w-64 h-64 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -top-4 -left-4 w-48 h-48 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-3xl -z-10" />
            </div>

            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                Connect on{' '}
                <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  WhatsApp
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Scan the QR code with your phone camera to instantly open WhatsApp and start a conversation with us. Quick, easy, and secure.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <IoLogoWhatsapp className="w-8 h-8 text-primary flex-shrink-0" />
                  <span className="text-xl font-semibold text-slate-900 dark:text-white">{phoneNumber}</span>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-all duration-250 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                >
                  <IoLogoWhatsapp className="h-6 w-6" />
                  Open WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
