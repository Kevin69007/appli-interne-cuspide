
import { useState, useEffect } from 'react';

const BANNER_DISMISSAL_KEY = 'promo_banner_dismissed';
const DISMISSAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useBannerDismissal = () => {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const dismissalData = localStorage.getItem(BANNER_DISMISSAL_KEY);
    
    if (dismissalData) {
      try {
        const { timestamp } = JSON.parse(dismissalData);
        const now = Date.now();
        
        // Check if 24 hours have passed
        if (now - timestamp < DISMISSAL_DURATION) {
          setBannerDismissed(true);
        } else {
          // Remove expired dismissal
          localStorage.removeItem(BANNER_DISMISSAL_KEY);
        }
      } catch (error) {
        // Invalid data, remove it
        localStorage.removeItem(BANNER_DISMISSAL_KEY);
      }
    }
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem(BANNER_DISMISSAL_KEY, JSON.stringify({
      timestamp: Date.now()
    }));
  };

  return { bannerDismissed, dismissBanner };
};
