import { useCallback, useRef, useEffect } from 'react';

export const useSlotSounds = (enabled: boolean = true, musicEnabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinCountRef = useRef(0);
  const musicNodesRef = useRef<{
    oscillators: OscillatorNode[];
    gains: GainNode[];
    masterGain: GainNode | null;
  }>({ oscillators: [], gains: [], masterGain: null });
  const musicPlayingRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const unlockAudio = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }, [getAudioContext]);

  // Stop background music
  const stopMusic = useCallback(() => {
    const { oscillators, gains, masterGain } = musicNodesRef.current;
    
    if (masterGain) {
      const ctx = getAudioContext();
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    
    setTimeout(() => {
      oscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      musicNodesRef.current = { oscillators: [], gains: [], masterGain: null };
      musicPlayingRef.current = false;
    }, 600);
  }, [getAudioContext]);

  // Play ambient casino background music
  const startMusic = useCallback(() => {
    if (musicPlayingRef.current || !musicEnabled) return;
    
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;
    
    musicPlayingRef.current = true;
    
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1);
    
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    // Deep bass drone
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const bassFilter = ctx.createBiquadFilter();
    bass.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(masterGain);
    bass.type = 'sine';
    bass.frequency.setValueAtTime(55, ctx.currentTime);
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(100, ctx.currentTime);
    bassGain.gain.setValueAtTime(0.4, ctx.currentTime);
    bass.start();
    oscillators.push(bass);
    gains.push(bassGain);
    
    // Slow modulating pad
    const pad1 = ctx.createOscillator();
    const pad1Gain = ctx.createGain();
    const pad1Filter = ctx.createBiquadFilter();
    pad1.connect(pad1Filter);
    pad1Filter.connect(pad1Gain);
    pad1Gain.connect(masterGain);
    pad1.type = 'triangle';
    pad1.frequency.setValueAtTime(110, ctx.currentTime);
    pad1Filter.type = 'lowpass';
    pad1Filter.frequency.setValueAtTime(400, ctx.currentTime);
    pad1Gain.gain.setValueAtTime(0.15, ctx.currentTime);
    pad1.start();
    oscillators.push(pad1);
    gains.push(pad1Gain);
    
    // Higher harmonic pad
    const pad2 = ctx.createOscillator();
    const pad2Gain = ctx.createGain();
    pad2.connect(pad2Gain);
    pad2Gain.connect(masterGain);
    pad2.type = 'sine';
    pad2.frequency.setValueAtTime(220, ctx.currentTime);
    pad2Gain.gain.setValueAtTime(0.08, ctx.currentTime);
    pad2.start();
    oscillators.push(pad2);
    gains.push(pad2Gain);
    
    // Subtle shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    const shimmerLfo = ctx.createOscillator();
    const shimmerLfoGain = ctx.createGain();
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmerGain.gain);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(440, ctx.currentTime);
    shimmerGain.gain.setValueAtTime(0.03, ctx.currentTime);
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.setValueAtTime(0.5, ctx.currentTime);
    shimmerLfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
    shimmer.start();
    shimmerLfo.start();
    oscillators.push(shimmer, shimmerLfo);
    gains.push(shimmerGain);
    
    musicNodesRef.current = { oscillators, gains, masterGain };
  }, [musicEnabled, getAudioContext]);

  // Handle music enable/disable
  useEffect(() => {
    if (musicEnabled) {
      // Music will start when audio is unlocked
    } else {
      stopMusic();
    }
    
    return () => {
      stopMusic();
    };
  }, [musicEnabled, stopMusic]);

  // Unlock and start music
  const unlockAndStartMusic = useCallback(async () => {
    await unlockAudio();
    if (musicEnabled && !musicPlayingRef.current) {
      startMusic();
    }
  }, [unlockAudio, musicEnabled, startMusic]);

  // Spin sound - casino slot machine tick with variation
  const playSpinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    const duration = 0.04;
    spinCountRef.current++;
    
    // Vary the frequency slightly for more realistic sound
    const baseFreq = 600 + (spinCountRef.current % 3) * 100;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + duration);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [enabled, getAudioContext]);

  // Reel stop sound - satisfying mechanical thunk with resonance
  const playStopSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    // Main thunk
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);
    
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    
    // Click layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);
    
    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.05);
  }, [enabled, getAudioContext]);

  // Win sound - exciting coin cascade with harmonics
  const playWinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    const playChime = (freq: number, delay: number, pan: number = 0) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const panner = ctx.createStereoPanner();
      
      oscillator.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      panner.pan.setValueAtTime(pan, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.4);
      
      // Add harmonic
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      
      harmonic.connect(harmonicGain);
      harmonicGain.connect(panner);
      
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, ctx.currentTime + delay);
      
      harmonicGain.gain.setValueAtTime(0, ctx.currentTime + delay);
      harmonicGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.01);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      
      harmonic.start(ctx.currentTime + delay);
      harmonic.stop(ctx.currentTime + delay + 0.25);
    };
    
    // Ascending coin sounds
    playChime(880, 0, -0.3);      // A5
    playChime(1047, 0.08, 0);     // C6
    playChime(1319, 0.16, 0.3);   // E6
    playChime(1568, 0.24, 0);     // G6
    playChime(2093, 0.32, 0);     // C7
  }, [enabled, getAudioContext]);

  // Jackpot sound - epic celebration fanfare
  const playJackpotSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    const playNote = (freq: number, delay: number, duration: number = 0.3, volume: number = 0.25) => {
      // Main tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
      gainNode.gain.setValueAtTime(volume * 0.8, ctx.currentTime + delay + duration - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + duration);
      
      // Octave layer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime + delay);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain2.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + delay + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration * 0.7);
      
      osc2.start(ctx.currentTime + delay);
      osc2.stop(ctx.currentTime + delay + duration * 0.7);
    };
    
    // Fanfare with shimmer
    const playShimmer = (delay: number) => {
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 2000, ctx.currentTime + delay + i * 0.03);
        
        panner.pan.setValueAtTime(-1 + Math.random() * 2, ctx.currentTime + delay + i * 0.03);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime + delay + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + i * 0.03 + 0.15);
        
        osc.start(ctx.currentTime + delay + i * 0.03);
        osc.stop(ctx.currentTime + delay + i * 0.03 + 0.15);
      }
    };
    
    // Epic fanfare melody
    playNote(392, 0, 0.12);       // G4
    playNote(392, 0.12, 0.12);    // G4
    playNote(392, 0.24, 0.12);    // G4
    playNote(523, 0.36, 0.25);    // C5
    playNote(659, 0.61, 0.25);    // E5
    playNote(784, 0.86, 0.35);    // G5
    playNote(1047, 1.21, 0.6);    // C6
    
    playShimmer(0.4);
    playShimmer(1.0);
    
    // Final chord
    setTimeout(() => {
      if (!enabled) return;
      const chordFreqs = [523, 659, 784, 1047]; // C major
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      });
    }, 1400);
  }, [enabled, getAudioContext]);

  // No win sound - subtle whoosh (not sad)
  const playNoWinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    // White noise whoosh
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
    filter.Q.setValueAtTime(1, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.3);
  }, [enabled, getAudioContext]);

  // Button click sound - satisfying pop
  const playClickSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    // Pop sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
    
    // Click layer
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    
    click.type = 'square';
    click.frequency.setValueAtTime(2000, ctx.currentTime);
    
    clickGain.gain.setValueAtTime(0.05, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    
    click.start(ctx.currentTime);
    click.stop(ctx.currentTime + 0.02);
  }, [enabled, getAudioContext]);

  // Coin collect sound
  const playCoinSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }, [enabled, getAudioContext]);

  return {
    unlockAudio,
    unlockAndStartMusic,
    playSpinSound,
    playStopSound,
    playWinSound,
    playJackpotSound,
    playNoWinSound,
    playClickSound,
    playCoinSound,
  };
};
