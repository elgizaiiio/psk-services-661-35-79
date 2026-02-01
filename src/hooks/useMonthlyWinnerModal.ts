import { useState, useEffect } from 'react';

const MODAL_SHOWN_KEY = 'monthly_winner_modal_shown_v2';

export const useMonthlyWinnerModal = () => {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
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
  };
};
