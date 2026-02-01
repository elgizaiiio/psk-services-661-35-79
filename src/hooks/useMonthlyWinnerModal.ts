import { useState, useEffect } from 'react';

const MODAL_SHOWN_KEY = 'monthly_winner_modal_shown_v2';
const PROMO_START_KEY = 'promo_48h_start_time';

// Fixed promotion start time - set to NOW when first deployed
const getPromoStartTime = () => {
  const stored = localStorage.getItem(PROMO_START_KEY);
  if (stored) {
    return parseInt(stored, 10);
  }
  // First time - set start time to now
  const now = Date.now();
  localStorage.setItem(PROMO_START_KEY, now.toString());
  return now;
};

// 48 hours in milliseconds
const PROMO_DURATION = 48 * 60 * 60 * 1000;

export const isPromoActive = () => {
  const startTime = getPromoStartTime();
  const elapsed = Date.now() - startTime;
  return elapsed < PROMO_DURATION;
};

export const getPromoTimeRemaining = () => {
  const startTime = getPromoStartTime();
  const elapsed = Date.now() - startTime;
  const remaining = PROMO_DURATION - elapsed;
  return Math.max(0, remaining);
};

export const useMonthlyWinnerModal = () => {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    // Only show if promo is active
    if (!isPromoActive()) {
      return;
    }

    // Check if modal was already shown this session
    const wasShown = sessionStorage.getItem(MODAL_SHOWN_KEY);
    
    if (!wasShown) {
      // Add a small delay so the page loads first
      const timer = setTimeout(() => {
        setShouldShowModal(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const markAsShown = () => {
    sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
    setShouldShowModal(false);
  };

  return {
    shouldShowModal,
    markAsShown,
    isPromoActive: isPromoActive(),
  };
};
