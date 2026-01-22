import React from 'react';
import { motion } from 'framer-motion';
import { Ban } from 'lucide-react';

const BlockedScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Ban className="w-24 h-24 text-red-500 mb-6" />
        </motion.div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Account Blocked
        </h1>
        
        <p className="text-gray-400 text-sm max-w-xs">
          Your account has been permanently blocked for violating our terms of service.
        </p>
      </motion.div>
    </div>
  );
};

export default BlockedScreen;
