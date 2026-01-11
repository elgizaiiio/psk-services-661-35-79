import { useState, useEffect } from 'react';

const MODAL_SHOWN_KEY = 'limited_offer_modal_shown';
const MODAL_SHOWN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useLimitedOfferModal = () => {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    const checkIfShouldShow = () => {
      try {
        const stored = localStorage.getItem(MODAL_SHOWN_KEY);
        if (stored) {
          const { timestamp } = JSON.parse(stored);
          if (Date.now() - timestamp < MODAL_SHOWN_EXPIRY) {
            return false;
          }
        }
        return true;
      } catch {
        return true;
      }
    };

    // Delay showing modal by 2 seconds after page load
    const timer = setTimeout(() => {
      if (checkIfShouldShow()) {
        setShouldShowModal(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const markAsShown = () => {
    try {
      localStorage.setItem(MODAL_SHOWN_KEY, JSON.stringify({ timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving modal shown state:', error);
    }
    setShouldShowModal(false);
  };

  return {
    shouldShowModal,
    markAsShown,
  };
};

export default useLimitedOfferModal;
