// Onboarding step 1: Shake-to-talk intro — user must shake to continue
import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { playShakeDetectedHaptic } from '../../services/haptics';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import { useTheme } from '../../theme';

export default function ShakePracticeScreen() {
  const theme = useTheme();
  const [shaken, setShaken] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  // Subtle bob animation for the shake hint
  const bobY = useSharedValue(0);
  useEffect(() => {
    if (!shaken) {
      bobY.value = withRepeat(
        withTiming(-6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [shaken, bobY]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  // Shake detector
  useShakeDetector({
    onShake: () => {
      if (shaken) return;
      playShakeDetectedHaptic();
      setShakeCount((n) => n + 1);
    },
    enabled: !shaken,
    threshold: 1.8,
    debounceMs: 800,
  });

  const handleActivate = () => {
    if (shaken) return;
    playShakeDetectedHaptic();
    setShakeCount((n) => n + 1);
  };

  // After shake or tap — confirm and proceed to welcome
  useEffect(() => {
    if (shakeCount >= 1 && !shaken) {
      setShaken(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Nice! You can shake anytime to talk. Throughout setup, shake and speak your answers.", { rate: 0.9 });
      setTimeout(() => {
        router.push('/onboarding/welcome');
      }, 3000);
    }
  }, [shakeCount, shaken]);

  // Speak the instruction on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      Speech.speak(
        "Welcome! This app is fully voice controlled. Shake your phone to start talking. Try it now!",
        { rate: 0.9 },
      );
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={1} totalSteps={9} />

        <View style={styles.content}>
          {/* Terminal intro card */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={[styles.introCard, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}
          >
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, textAlign: 'center', fontWeight: '700' }}>
              {'── Voice First ──'}
            </Text>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 8, opacity: 0.8, lineHeight: 22 }}>
              {'> this app is fully voice\n  controlled. you can use it\n  without looking at the screen.'}
            </Text>
          </Animated.View>

          {/* Shake hint */}
          {!shaken ? (
            <>
              <Animated.View
                entering={FadeInDown.delay(600).duration(600)}
                style={[styles.hintCard, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}
              >
                <Animated.View style={bobStyle}>
                  <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 32, textAlign: 'center' }}>
                    {'((( )))'}
                  </Text>
                </Animated.View>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 12, opacity: 0.8 }}>
                  {'> shake your phone to begin'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12, textAlign: 'center', marginTop: 4, opacity: 0.5 }}>
                  {'shake activates voice input\nuse it to answer all questions'}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(1000).duration(600)}>
                <Pressable
                  onPress={handleActivate}
                  accessibilityRole="button"
                  accessibilityLabel="Tap to continue instead of shaking"
                  style={({ pressed }) => [
                    styles.tapBtn,
                    {
                      backgroundColor: pressed
                        ? theme.colors.interactive.primaryPressed
                        : theme.colors.interactive.primary,
                      borderRadius: theme.radius.xl,
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 14, fontWeight: '700' }}>
                    or tap here
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={[styles.hintCard, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}
            >
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 28, textAlign: 'center' }}>
                {'[ok]'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 12, opacity: 0.8 }}>
                {'> shake detected!'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12, textAlign: 'center', marginTop: 4, opacity: 0.5 }}>
                {"let's get started..."}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  introCard: {
    padding: 20,
  },
  hintCard: {
    padding: 24,
    alignItems: 'center',
  },
  tapBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
});
