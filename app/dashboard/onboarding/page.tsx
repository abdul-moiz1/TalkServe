'use client';

import OnboardingForm from './OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Business Onboarding
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Tell us about your business so we can customize TalkServe AI receptionist to meet your needs
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
