// Reusable voice onboarding hook — shake to talk + keyword matching.
// Each screen passes an instruction (TTS) and keyword→handler map.
// User hears instruction → ready haptic → auto-mic activates → says keyword → handler fires.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useShakeDetector } from './useShakeDetector';
import {
  playMicActivateHaptic,
  playMicDeactivateHaptic,
  playShakeDetectedHaptic,
} from '../services/haptics';

interface VoiceOnboardingOptions {
  // TTS instruction spoken on mount
  instruction: string;
  // Keyword → handler map. Keys are lowercase phrases to match.
  // Special key '*' matches any input and passes the transcript.
  keywords: Record<string, (transcript?: string) => void>;
  // Delay before speaking instruction (default 600ms)
  speakDelay?: number;
  // Whether the hook is active (default true)
  enabled?: boolean;
  // Whether the hook should speak the instruction automatically on mount
  autoSpeakInstruction?: boolean;
}

interface VoiceOnboardingState {
  isListening: boolean;
  transcript: string;
  // Call to manually re-speak the instruction
  repeatInstruction: () => void;
  // Call to manually start listening (without shake)
  startListening: () => void;
  // Speak feedback text then auto-activate mic when done
  speakWithAutoMic: (text: string, rate?: number) => void;
}

export function useVoiceOnboarding({
  instruction,
  keywords,
  speakDelay = 600,
  enabled = true,
  autoSpeakInstruction = true,
}: VoiceOnboardingOptions): VoiceOnboardingState {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const keywordsRef = useRef(keywords);
  const instructionRef = useRef(instruction);
  const hadFinalResultRef = useRef(false);
  const isListeningRef = useRef(false);
  const isArmingRef = useRef(false);
  const armSequenceRef = useRef(0);

  const wait = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  // Keep refs fresh
  useEffect(() => {
    keywordsRef.current = keywords;
  }, [keywords]);
  useEffect(() => {
    instructionRef.current = instruction;
  }, [instruction]);

  const armListening = useCallback(async (interruptSpeech = false) => {
    if (!enabled || Platform.OS === 'web') return;
    if (isListeningRef.current || isArmingRef.current) return;

    isArmingRef.current = true;
    const armId = armSequenceRef.current + 1;
    armSequenceRef.current = armId;

    try {
      if (interruptSpeech) {
        Speech.stop();
        await wait(80);
      }

      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) return;

      setTranscript('');
      await playMicActivateHaptic();
      await wait(100);

      if (armSequenceRef.current !== armId || isListeningRef.current) return;

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    } finally {
      if (!isListeningRef.current && armSequenceRef.current === armId) {
        isArmingRef.current = false;
      }
    }
  }, [enabled, wait]);

  const startListening = useCallback(() => {
    void armListening(true);
  }, [armListening]);

  // Speak instruction on mount, auto-mic when done
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      if (!autoSpeakInstruction) return;
      Speech.speak(instruction, {
        language: 'en-US',
        rate: 0.9,
        onDone: () => { void armListening(false); },
        onStopped: () => { /* user interrupted — no auto-mic */ },
      });
    }, speakDelay);
    return () => {
      clearTimeout(timer);
      Speech.stop();
      isArmingRef.current = false;
      armSequenceRef.current += 1;
    };
  }, [instruction, speakDelay, enabled, autoSpeakInstruction, armListening]);

  const repeatInstruction = useCallback(() => {
    Speech.stop();
    Speech.speak(instructionRef.current, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => { void armListening(false); },
      onStopped: () => {},
    });
  }, [armListening]);

  const speakWithAutoMic = useCallback((text: string, rate = 0.95) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate,
      onDone: () => { void armListening(false); },
      onStopped: () => {},
    });
  }, [armListening]);

  // Shake to start listening
  useShakeDetector({
    onShake: () => {
      void playShakeDetectedHaptic();
      void armListening(true);
    },
    enabled: enabled && !isListening,
  });

  // Speech recognition events
  useSpeechRecognitionEvent('start', () => {
    hadFinalResultRef.current = false;
    isArmingRef.current = false;
    isListeningRef.current = true;
    setIsListening(true);
  });
  useSpeechRecognitionEvent('end', () => {
    isArmingRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
    if (hadFinalResultRef.current) playMicDeactivateHaptic();
  });
  useSpeechRecognitionEvent('error', () => {
    isArmingRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);

    if (event.isFinal && text.trim()) {
      hadFinalResultRef.current = true;
      const lower = text.toLowerCase().trim();
      setTranscript('');

      // Check keyword matches
      const kws = keywordsRef.current;
      for (const [keyword, handler] of Object.entries(kws)) {
        if (keyword === '*') continue; // wildcard handled last
        if (lower.includes(keyword) || lower === keyword) {
          handler(text);
          return;
        }
      }

      // Wildcard fallback — passes full transcript
      if (kws['*']) {
        kws['*'](text);
      }
    }
  });

  return { isListening, transcript, repeatInstruction, startListening, speakWithAutoMic };
}
