// Brief 02 — Animal Crossing-style speech bubble with typewriter animation
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useTheme, getTypewriterSpeed } from '../../theme';

interface SpeechBubbleProps {
  message: string;
  onAnimationComplete?: () => void;
  onTTSDone?: () => void;
  autoSpeak?: boolean;
}

export default function SpeechBubble({
  message,
  onAnimationComplete,
  onTTSDone,
  autoSpeak = true,
}: SpeechBubbleProps) {
  const theme = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);
  const onTTSDoneRef = useRef(onTTSDone);
  const autoSpeakRef = useRef(autoSpeak);

  useEffect(() => { onTTSDoneRef.current = onTTSDone; }, [onTTSDone]);
  useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);

  const reducedMotion = theme.accessibility.reducedMotion;
  const speed = getTypewriterSpeed(theme.accessibility.ttsSpeed);

  const speakMessage = useCallback(async (text: string) => {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) await Speech.stop();

      const rateMap = { slow: 0.8, normal: 0.95, fast: 1.15 };
      Speech.speak(text, {
        language: 'en-US',
        rate: rateMap[theme.accessibility.ttsSpeed],
        onDone: () => onTTSDoneRef.current?.(),
        onStopped: () => { /* user interrupted — no auto-mic */ },
      });
    } catch {
      // TTS may not be available on all platforms
    }
  }, [theme.accessibility.ttsSpeed]);

  // Start typewriter animation when message changes
  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      return;
    }

    if (reducedMotion) {
      // Show full text immediately in reduced motion mode
      setDisplayedText(message);
      if (autoSpeak) {
        speakMessage(message);
      }
      onAnimationComplete?.();
      return;
    }

    // Reset and start typewriter
    setDisplayedText('');
    indexRef.current = 0;
    setIsAnimating(true);

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= message.length) {
        setDisplayedText(message);
        setIsAnimating(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (autoSpeakRef.current) {
          speakMessage(message);
        }
        onAnimationComplete?.();
      } else {
        setDisplayedText(message.slice(0, indexRef.current));
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [message, reducedMotion, speed, autoSpeak, speakMessage, onAnimationComplete]);

  const handleBubblePress = useCallback(() => {
    if (isAnimating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(message);
      setIsAnimating(false);
      speakMessage(message);
      onAnimationComplete?.();
      return;
    }

    speakMessage(message);
  }, [isAnimating, message, speakMessage, onAnimationComplete]);

  if (!message) return null;

  return (
    <View style={styles.container}>
      {/* Tail pointing up toward terminal */}
      <View
        style={[
          styles.tail,
          { borderBottomColor: theme.colors.base.terminal },
        ]}
      />

      <Pressable
        onPress={handleBubblePress}
        accessible
        accessibilityRole="text"
        accessibilityLabel={message}
        accessibilityHint={isAnimating ? 'Tap to skip animation' : 'Tap to hear again'}
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.base.terminal,
            borderRadius: theme.radius.terminal,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.base.terminalText,
              fontFamily: theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback,
              fontSize: theme.typeScale.terminal,
              lineHeight: theme.typeScale.terminal * theme.lineHeight.relaxed,
            },
          ]}
        >
          {'> '}
          {displayedText}
          {isAnimating && <Text style={styles.cursor}>_</Text>}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  bubble: {
    width: '100%',
  },
  text: {
    textAlign: 'left',
  },
  cursor: {
    opacity: 0.5,
  },
});
