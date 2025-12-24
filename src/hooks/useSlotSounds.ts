import { useCallback, useRef } from 'react';

export const useSlotSounds = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Spin sound - rapid clicking/ticking
  const playSpinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    const duration = 0.05;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [enabled, getAudioContext]);

  // Reel stop sound - thunk
  const playStopSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    const duration = 0.15;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [enabled, getAudioContext]);

  // Small win sound - cheerful ding
  const playWinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    const playNote = (freq: number, delay: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.3);
    };
    
    playNote(523, 0);      // C5
    playNote(659, 0.1);    // E5
    playNote(784, 0.2);    // G5
  }, [enabled, getAudioContext]);

  // Jackpot sound - triumphant fanfare
  const playJackpotSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    const playNote = (freq: number, delay: number, duration: number = 0.25) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + delay + duration - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + duration);
    };
    
    // Fanfare melody
    playNote(523, 0, 0.15);      // C5
    playNote(523, 0.15, 0.15);   // C5
    playNote(523, 0.3, 0.15);    // C5
    playNote(659, 0.45, 0.3);    // E5
    playNote(784, 0.75, 0.3);    // G5
    playNote(1047, 1.05, 0.5);   // C6
  }, [enabled, getAudioContext]);

  // No win sound - descending tone
  const playNoWinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    const duration = 0.3;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [enabled, getAudioContext]);

  // Button click sound
  const playClickSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    const duration = 0.08;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [enabled, getAudioContext]);

  return {
    playSpinSound,
    playStopSound,
    playWinSound,
    playJackpotSound,
    playNoWinSound,
    playClickSound,
  };
};
