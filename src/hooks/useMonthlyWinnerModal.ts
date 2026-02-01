import { useState, useEffect } from 'react';
import { usePromoSettings, isPromoActiveSync, getPromoTimeRemainingSync } from './usePromoSettings';

const MODAL_SHOWN_KEY = 'monthly_winner_modal_shown_v2';

// Export functions that work with backend data
export const isPromoActive = isPromoActiveSync;
export const getPromoTimeRemaining = getPromoTimeRemainingSync;

export const useMonthlyWinnerModal = () => {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const { isPromoActive: promoActive, loading, timeRemaining, refetch } = usePromoSettings();

  useEffect(() => {
    // Wait for data to load
    if (loading) return;
    
    // Only show if promo is active
    if (!promoActive) {
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
  }, [promoActive, loading]);

  const markAsShown = () => {
    sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
    setShouldShowModal(false);
  };

  return {
    shouldShowModal,
    markAsShown,
    isPromoActive: promoActive,
    timeRemaining,
    loading,
    refetch,
  };
};
