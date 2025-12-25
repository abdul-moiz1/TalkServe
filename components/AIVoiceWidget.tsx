'use client';

import { useEffect } from 'react';

export default function AIVoiceWidget() {
  useEffect(() => {
    // Widget configuration
    (window as any).AIVoiceWidgetConfig = {
      businessId: "rhplHrWnwFWb9WQaRo5H",
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://talkserve.web.app/widget.js';
    script.async = true;
    script.onError = () => {
      console.warn('Failed to load AI Voice Widget script');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
