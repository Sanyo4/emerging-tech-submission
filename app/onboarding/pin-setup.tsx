// Onboarding: Security setup — biometric first, PIN fallback
import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import NumPad from '../../components/NumPad';
import SpeechBubble from '../../components/pet/SpeechBubble';
import PetTerminal from '../../components/pet/PetTerminal';
import { useOnboarding } from '../../services/onboardingContext';
import { useAuth } from '../../services/authContext';
import { useTheme } from '../../theme';
import { createAppSettings } from '../../services/database';
import { hashPin } from '../../utils/pin';

const PIN_LENGTH = 4;

type Mode = 'biometric' | 'pin';
type PinPhase = 'create' | 'confirm';

export default function PinSetupScreen() {
  const theme = useTheme();
  const { data } = useOnboarding();
  const { hasBiometrics, biometricType, setupBiometrics } = useAuth();
  const [mode, setMode] = useState<Mode>(hasBiometrics ? 'biometric' : 'pin');
  const [pinPhase, setPinPhase] = useState<PinPhase>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const petName = data.petName || 'Buddy';
  const biometricLabel = biometricType === 'facial' ? 'Face ID' : 'fingerprint';

  // Speak instruction on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'biometric') {
        Speech.speak(
          `Let's secure the app. You can use your ${biometricLabel}. Tap the button or shake to start.`,
          { rate: 0.9 },
        );
      } else {
        Speech.speak('Create a 4 digit PIN to secure your data.', { rate: 0.9 });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [mode, biometricLabel]);

  const handleBiometricSetup = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const success = await setupBiometrics();
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Speech.speak(`${biometricLabel} set up! You're all set.`, { rate: 0.9 });
        // Still create app settings (needed for onboarding flow)
        const pinHash = await hashPin('biometric');
        await createAppSettings(pinHash);
        setTimeout(() => router.push('/onboarding/done'), 1000);
      } else {
        Speech.speak("That didn't work. Try again or switch to PIN.", { rate: 0.95 });
      }
    } catch {
      Speech.speak('Something went wrong. Try PIN instead.', { rate: 0.95 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchToPin = () => {
    setMode('pin');
  };

  const handleDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= PIN_LENGTH) return;
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        if (pinPhase === 'create') {
          setFirstPin(newPin);
          setPin('');
          setPinPhase('confirm');
          Speech.speak('Now confirm your PIN', { rate: 0.95 });
        } else {
          if (newPin === firstPin) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Speech.speak('PIN created', { rate: 0.95 });
            const pinHash = await hashPin(newPin);
            await createAppSettings(pinHash);
            router.push('/onboarding/done');
          } else {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Speech.speak("PINs don't match. Try again.", { rate: 1.0 });
            shakeX.value = withSequence(
              withTiming(-12, { duration: 50 }),
              withTiming(12, { duration: 50 }),
              withTiming(-12, { duration: 50 }),
              withTiming(12, { duration: 50 }),
              withTiming(0, { duration: 50 }),
            );
            setTimeout(() => {
              setPin('');
              setFirstPin('');
              setPinPhase('create');
            }, 300);
          }
        }
      }
    },
    [pin, pinPhase, firstPin, shakeX],
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={8} totalSteps={9} />

        {mode === 'biometric' ? (
          /* Biometric setup */
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.duration(600)}>
              <PetTerminal petState="happy" petName={petName} compact />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <SpeechBubble
                message={`Let's keep things secure! You can use your ${biometricLabel} \u2014 just tap below.`}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.biometricArea}>
              {/* Biometric button */}
              <Pressable
                onPress={handleBiometricSetup}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel={`Set up ${biometricLabel}`}
                style={({ pressed }) => [
                  styles.biometricBtn,
                  {
                    backgroundColor: pressed
                      ? theme.colors.interactive.primaryPressed
                      : theme.colors.interactive.primary,
                    borderRadius: theme.radius.xl,
                    opacity: isProcessing ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                  {isProcessing ? 'Authenticating...' : `Use ${biometricLabel}`}
                </Text>
              </Pressable>

              {/* Switch to PIN */}
              <Pressable
                onPress={handleSwitchToPin}
                accessibilityRole="button"
                accessibilityLabel="Use PIN instead"
                style={styles.switchBtn}
              >
                <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 13 }}>
                  Use PIN instead
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          /* PIN setup (original flow) */
          <View style={styles.content}>
            <View
              style={[
                styles.pinTerminal,
                {
                  backgroundColor: theme.colors.base.terminal,
                  borderRadius: theme.radius.terminal,
                },
              ]}
            >
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
                {'> '}{pinPhase === 'create' ? 'Enter new PIN:' : 'Confirm PIN:'}
              </Text>

              <Animated.View style={[styles.dotsRow, shakeStyle]}>
                {Array.from({ length: PIN_LENGTH }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        borderColor: theme.colors.interactive.primary,
                        backgroundColor: i < pin.length ? theme.colors.interactive.primary : 'transparent',
                      },
                    ]}
                    accessibilityLabel={i < pin.length ? `Digit ${i + 1} entered` : `Digit ${i + 1} empty`}
                  />
                ))}
              </Animated.View>

              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                {pin.length}/{PIN_LENGTH} digits
              </Text>
            </View>

            <NumPad
              onDigit={handleDigit}
              onDelete={handleDelete}
              currentLength={pin.length}
              maxLength={PIN_LENGTH}
            />

            {/* Switch back to biometric if available */}
            {hasBiometrics && (
              <Pressable
                onPress={() => setMode('biometric')}
                accessibilityRole="button"
                accessibilityLabel={`Use ${biometricLabel} instead`}
                style={styles.switchBtn}
              >
                <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 13 }}>
                  Use {biometricLabel} instead
                </Text>
              </Pressable>
            )}
          </View>
        )}
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
  biometricArea: {
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  biometricBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 52,
    width: '100%',
  },
  switchBtn: {
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
  },
  pinTerminal: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
});
