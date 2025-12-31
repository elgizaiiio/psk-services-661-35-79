import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import SocialProofToast from './SocialProofToast';
import NearMissNotification from './NearMissNotification';
import DecliningOfferNotification from './DecliningOfferNotification';
import ScarcityNotification from './ScarcityNotification';
import MilestoneNotification from './MilestoneNotification';

interface SmartNotificationContextType {
  triggerNearMiss: () => void;
  triggerScarcity: () => void;
  triggerMilestone: (message?: string) => void;
}

const SmartNotificationContext = createContext<SmartNotificationContextType | null>(null);

export const useSmartNotificationContext = () => {
  const context = useContext(SmartNotificationContext);
  if (!context) {
    throw new Error('useSmartNotificationContext must be used within SmartNotificationProvider');
  }
  return context;
};

interface SmartNotificationProviderProps {
  children: React.ReactNode;
}

const SmartNotificationProvider: React.FC<SmartNotificationProviderProps> = ({ children }) => {
  const {
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
  } = useSmartNotifications();

  const [milestoneMessage, setMilestoneMessage] = useState<string | undefined>();

  // Auto-trigger social proof periodically
  useEffect(() => {
    const interval = setInterval(() => {
      triggerSocialProof();
    }, 60000); // Every minute

    // Initial trigger after 30 seconds
    const initialTimeout = setTimeout(() => {
      triggerSocialProof();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [triggerSocialProof]);

  const handleTriggerMilestone = useCallback((message?: string) => {
    setMilestoneMessage(message);
    triggerMilestone();
  }, [triggerMilestone]);

  const contextValue: SmartNotificationContextType = {
    triggerNearMiss,
    triggerScarcity,
    triggerMilestone: handleTriggerMilestone
  };

  return (
    <SmartNotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Social Proof Toast */}
      <SocialProofToast 
        isVisible={showSocialProof} 
        onDismiss={dismissSocialProof} 
      />
      
      {/* Near Miss Notification */}
      <NearMissNotification 
        isOpen={showNearMiss} 
        onClose={dismissNearMiss} 
      />
      
      {/* Declining Offer Notification */}
      <DecliningOfferNotification 
        isOpen={showDecliningOffer} 
        onClose={dismissDecliningOffer} 
      />
      
      {/* Scarcity Notification */}
      <ScarcityNotification 
        isVisible={showScarcity} 
        onDismiss={dismissScarcity} 
      />
      
      {/* Milestone Notification */}
      <MilestoneNotification 
        isOpen={showMilestone} 
        onClose={dismissMilestone}
        message={milestoneMessage}
      />
    </SmartNotificationContext.Provider>
  );
};

export default SmartNotificationProvider;
