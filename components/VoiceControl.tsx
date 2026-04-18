// Always-visible voice/text input control — fixed at bottom of screen
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import { useTheme } from '../theme';
import {
  playMicActivateHaptic,
  playMicDeactivateHaptic,
  playShakeDetectedHaptic,
} from '../services/haptics';

interface VoiceControlProps {
  onSend: (text: string) => Promise<void>;
  isProcessing: boolean;
  shakeTrigger?: number; // increment to trigger mic from outside (shake-to-talk)
  ttsTrigger?: number; // increment to auto-start mic after TTS finishes
  onModeChange?: (mode: 'voice' | 'text') => void;
}

const MIC_SIZE = 64;
const RING_DURATION = 1500;

export default function VoiceControl({ onSend, isProcessing, shakeTrigger, ttsTrigger, onModeChange }: VoiceControlProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [webSpeechAvailable, setWebSpeechAvailable] = useState(true);
  const prevShakeTrigger = useRef(shakeTrigger ?? 0);
  const prevTTSTrigger = useRef(ttsTrigger ?? 0);
  const hadFinalResultRef = useRef(false);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const available = typeof window !== 'undefined' &&
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
      setWebSpeechAvailable(available);
      if (!available) setMode('text');
    }
  }, []);

  // Pulse ring animations
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (recognizing) {
      ring1Scale.value = withRepeat(
        withTiming(1.8, { duration: RING_DURATION, easing: Easing.out(Easing.ease) }),
        -1, false,
      );
      ring1Opacity.value = withRepeat(
        withTiming(0, { duration: RING_DURATION, easing: Easing.in(Easing.ease) }),
        -1, false,
      );
      ring2Scale.value = withDelay(RING_DURATION / 2,
        withRepeat(withTiming(1.8, { duration: RING_DURATION, easing: Easing.out(Easing.ease) }), -1, false),
      );
      ring2Opacity.value = withDelay(RING_DURATION / 2,
        withRepeat(withTiming(0, { duration: RING_DURATION, easing: Easing.in(Easing.ease) }), -1, false),
      );
    } else {
      cancelAnimation(ring1Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring2Opacity);
      ring1Scale.value = withTiming(1, { duration: 200 });
      ring1Opacity.value = withTiming(0, { duration: 200 });
      ring2Scale.value = withTiming(1, { duration: 200 });
      ring2Opacity.value = withTiming(0, { duration: 200 });
    }
  }, [recognizing, ring1Scale, ring1Opacity, ring2Scale, ring2Opacity]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  useSpeechRecognitionEvent('start', () => {
    hadFinalResultRef.current = false;
    setRecognizing(true);
  });
  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
    if (hadFinalResultRef.current) playMicDeactivateHaptic();
  });
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal && text.trim()) {
      hadFinalResultRef.current = true;
      setTranscript('');
      onSend(text.trim());
    }
  });
  useSpeechRecognitionEvent('error', () => setRecognizing(false));

  // Shake-to-talk: when shakeTrigger increments, auto-start mic
  useEffect(() => {
    if (shakeTrigger !== undefined && shakeTrigger !== prevShakeTrigger.current) {
      prevShakeTrigger.current = shakeTrigger;
      setMode('voice');
      (async () => {
        if (isProcessing || recognizing) return;
        Speech.stop();
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) return;
        setTranscript('');
        playMicActivateHaptic();
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          continuous: false,
        });
      })();
    }
  }, [shakeTrigger, isProcessing, recognizing]);

  // Auto-mic after TTS: when ttsTrigger increments, start mic
  useEffect(() => {
    if (ttsTrigger !== undefined && ttsTrigger !== prevTTSTrigger.current) {
      prevTTSTrigger.current = ttsTrigger;
      (async () => {
        if (isProcessing || recognizing || mode !== 'voice') return;
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) return;
        setTranscript('');
        playMicActivateHaptic();
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          continuous: false,
        });
      })();
    }
  }, [ttsTrigger, isProcessing, recognizing, mode]);

  const handleMicPress = async () => {
    if (isProcessing) return;

    // Interrupt any ongoing TTS
    Speech.stop();

    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) return;

    setTranscript('');
    playMicActivateHaptic();
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  const handleTextSend = () => {
    if (!textInput.trim() || isProcessing) return;
    const text = textInput.trim();
    setTextInput('');
    onSend(text);
  };

  return (
    <View style={[styles.container, { borderTopColor: theme.colors.base.border, backgroundColor: theme.colors.base.background }]}>
      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <Pressable
          onPress={() => { setMode('text'); onModeChange?.('text'); }}
          accessibilityLabel="Text input mode"
          style={[
            styles.modeTab,
            {
              backgroundColor: mode === 'text' ? theme.colors.base.terminal : 'transparent',
              borderRadius: theme.radius.sm,
            },
          ]}
        >
          <Text style={{ color: mode === 'text' ? theme.colors.base.terminalText : theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }}>
            [TEXT]
          </Text>
        </Pressable>
        {webSpeechAvailable && (
          <Pressable
            onPress={() => { setMode('voice'); onModeChange?.('voice'); }}
            accessibilityLabel="Voice input mode"
            style={[
              styles.modeTab,
              {
                backgroundColor: mode === 'voice' ? theme.colors.base.terminal : 'transparent',
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <Text style={{ color: mode === 'voice' ? theme.colors.base.terminalText : theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }}>
              [VOICE]
            </Text>
          </Pressable>
        )}
      </View>

      {mode === 'voice' ? (
        <View style={styles.voiceArea}>
          {/* Mic with pulse rings */}
          <View style={styles.micContainer}>
            <Animated.View style={[styles.ring, ring1Style, { backgroundColor: theme.colors.interactive.primary + '40' }]} />
            <Animated.View style={[styles.ring, ring2Style, { backgroundColor: theme.colors.interactive.primary + '40' }]} />
            <Pressable
              style={[
                styles.micButton,
                {
                  backgroundColor: recognizing
                    ? theme.colors.interactive.primaryPressed
                    : isProcessing
                      ? theme.colors.interactive.disabled
                      : theme.colors.interactive.primary,
                },
              ]}
              onPress={handleMicPress}
              accessibilityRole="button"
              accessibilityLabel={isProcessing ? 'Processing' : recognizing ? 'Stop recording' : 'Start voice input'}
              accessibilityState={{ disabled: isProcessing, busy: isProcessing }}
            >
              <Text style={styles.micIcon}>
                {recognizing ? '\u23F9\uFE0F' : '\uD83C\uDF99\uFE0F'}
              </Text>
            </Pressable>
          </View>
          <Text
            style={[styles.transcript, { color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 13 * fs }]}
            accessibilityLiveRegion="polite"
          >
            {isProcessing ? 'Processing...' : transcript ? transcript : recognizing ? 'Listening...' : 'Shake to speak. Tap if needed.'}
          </Text>
        </View>
      ) : (
        <View style={styles.textArea}>
          <View style={[styles.textInputRow, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.sm }]}>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.5 }}>
              {'> '}
            </Text>
            <TextInput
              style={[styles.textInput, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs }]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="type here..."
              placeholderTextColor={theme.colors.base.terminalText + '44'}
              onSubmitEditing={handleTextSend}
              returnKeyType="send"
              editable={!isProcessing}
              accessibilityLabel="Text input"
            />
            <Pressable
              onPress={handleTextSend}
              disabled={!textInput.trim() || isProcessing}
              accessibilityLabel="Send"
              style={[
                styles.sendBtn,
                {
                  backgroundColor: textInput.trim() ? theme.colors.interactive.primary : 'transparent',
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <Text style={{ color: textInput.trim() ? theme.colors.interactive.primaryText : theme.colors.base.textSecondary, fontFamily: mono, fontSize: 14 * fs, fontWeight: '700' }}>
                {'\u2191'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 28,
    justifyContent: 'center',
  },
  voiceArea: {
    alignItems: 'center',
    gap: 4,
  },
  micContainer: {
    width: MIC_SIZE * 2,
    height: MIC_SIZE * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  micIcon: {
    fontSize: 24,
  },
  transcript: {
    textAlign: 'center',
    minHeight: 20,
  },
  textArea: {
    gap: 8,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    padding: 0,
  },
  sendBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
