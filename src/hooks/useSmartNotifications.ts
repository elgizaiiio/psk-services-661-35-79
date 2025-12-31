import { useState, useCallback, useEffect } from 'react';

interface NotificationState {
  lastSocialProofTime: number;
  lastNearMissTime: number;
  lastDecliningOfferTime: number;
  lastScarcityTime: number;
  lastMilestoneTime: number;
  hasSeenDecliningOffer: boolean;
  sessionStartTime: number;
}

interface SmartNotificationContext {
  showSocialProof: boolean;
  showNearMiss: boolean;
  showDecliningOffer: boolean;
  showScarcity: boolean;
  showMilestone: boolean;
  triggerSocialProof: () => void;
  triggerNearMiss: () => void;
  triggerDecliningOffer: () => void;
  triggerScarcity: () => void;
  triggerMilestone: () => void;
  dismissSocialProof: () => void;
  dismissNearMiss: () => void;
  dismissDecliningOffer: () => void;
  dismissScarcity: () => void;
  dismissMilestone: () => void;
}

const STORAGE_KEY = 'smart_notifications_state';
const MIN_INTERVAL_MS = 180000; // 3 minutes between notifications
const SOCIAL_PROOF_INTERVAL = 60000; // 1 minute for social proof toasts

const getStoredState = (): NotificationState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load notification state:', e);
  }
  return {
    lastSocialProofTime: 0,
    lastNearMissTime: 0,
    lastDecliningOfferTime: 0,
    lastScarcityTime: 0,
    lastMilestoneTime: 0,
    hasSeenDecliningOffer: false,
    sessionStartTime: Date.now()
  };
};

const saveState = (state: NotificationState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save notification state:', e);
  }
};

export const useSmartNotifications = (): SmartNotificationContext => {
  const [state, setState] = useState<NotificationState>(getStoredState);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [showNearMiss, setShowNearMiss] = useState(false);
  const [showDecliningOffer, setShowDecliningOffer] = useState(false);
  const [showScarcity, setShowScarcity] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  // Check if enough time has passed for a notification
  const canShowNotification = useCallback((lastTime: number, interval = MIN_INTERVAL_MS) => {
    return Date.now() - lastTime > interval;
  }, []);

  // Social Proof Toast - appears periodically
  const triggerSocialProof = useCallback(() => {
    if (canShowNotification(state.lastSocialProofTime, SOCIAL_PROOF_INTERVAL)) {
      setShowSocialProof(true);
      const newState = { ...state, lastSocialProofTime: Date.now() };
      setState(newState);
      saveState(newState);
    }
  }, [state, canShowNotification]);

  // Near Miss - after spin
  const triggerNearMiss = useCallback(() => {
    if (canShowNotification(state.lastNearMissTime)) {
      setShowNearMiss(true);
      const newState = { ...state, lastNearMissTime: Date.now() };
      setState(newState);
      saveState(newState);
    }
  }, [state, canShowNotification]);

  // Declining Offer - for new users
  const triggerDecliningOffer = useCallback(() => {
    if (!state.hasSeenDecliningOffer && canShowNotification(state.lastDecliningOfferTime)) {
      setShowDecliningOffer(true);
      const newState = { 
        ...state, 
        lastDecliningOfferTime: Date.now(),
        hasSeenDecliningOffer: true 
      };
      setState(newState);
      saveState(newState);
    }
  }, [state, canShowNotification]);

  // Scarcity - on purchase pages
  const triggerScarcity = useCallback(() => {
    if (canShowNotification(state.lastScarcityTime)) {
      setShowScarcity(true);
      const newState = { ...state, lastScarcityTime: Date.now() };
      setState(newState);
      saveState(newState);
    }
  }, [state, canShowNotification]);

  // Milestone - when close to achievement
  const triggerMilestone = useCallback(() => {
    if (canShowNotification(state.lastMilestoneTime)) {
      setShowMilestone(true);
      const newState = { ...state, lastMilestoneTime: Date.now() };
      setState(newState);
      saveState(newState);
    }
  }, [state, canShowNotification]);

  // Dismiss handlers
  const dismissSocialProof = useCallback(() => setShowSocialProof(false), []);
  const dismissNearMiss = useCallback(() => setShowNearMiss(false), []);
  const dismissDecliningOffer = useCallback(() => setShowDecliningOffer(false), []);
  const dismissScarcity = useCallback(() => setShowScarcity(false), []);
  const dismissMilestone = useCallback(() => setShowMilestone(false), []);

  // Auto-trigger declining offer for new users after 5 minutes
  useEffect(() => {
    if (!state.hasSeenDecliningOffer) {
      const timeout = setTimeout(() => {
        triggerDecliningOffer();
      }, 300000); // 5 minutes

      return () => clearTimeout(timeout);
    }
  }, [state.hasSeenDecliningOffer, triggerDecliningOffer]);

  return {
    showSocialProof,
    showNearMiss,
    showDecliningOffer,
    showScarcity,
    showMilestone,
    triggerSocialProof,
    triggerNearMiss,
    triggerDecliningOffer,
    triggerScarcity,
    triggerMilestone,
    dismissSocialProof,
    dismissNearMiss,
    dismissDecliningOffer,
    dismissScarcity,
    dismissMilestone
  };
};
