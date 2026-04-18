import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useAuth } from '../../services/authContext';
import { writeOnboardingData } from '../../services/onboardingWriter';
import { useTheme } from '../../theme';
import { getPlanById } from '../../data/plans';

export default function DoneScreen() {
  const theme = useTheme();
  const { data } = useOnboarding();
  const { refresh } = useAuth();
  const [isWriting, setIsWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const petName = data.petName || 'Buddy';
  const plan = getPlanById(data.selectedPlanId);
  const planName = plan?.title ?? 'Foundation Plan';

  const monoFont = theme.fontsLoaded
    ? theme.fonts.monospace
    : theme.fonts.monospaceFallback;

  useEffect(() => {
    const cascade = async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((r) => setTimeout(r, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };
    cascade();
  }, []);

  const handleStart = async () => {
    if (isWriting) return;
    setIsWriting(true);
    setError(null);
    try {
      await writeOnboardingData(data);
      await refresh();
      router.replace('/(tabs)/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to write onboarding data:', msg);
      Speech.speak('Something went wrong. Please try again.', { rate: 1.0 });
      setError(msg);
      setIsWriting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.base.background }]}
    >
      <View style={styles.inner}>
        <OnboardingProgress currentStep={9} totalSteps={9} />

        <View style={styles.content}>
          {/* Pet hatches! */}
          <Animated.View entering={FadeInDown.delay(0).duration(600)}>
            <PetTerminal petState="neutral" petName={petName} />
          </Animated.View>

          {/* Speech bubble greeting */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.bubbleWrap}
          >
            <SpeechBubble
              message={`Hi! I'm ${petName}! Just talk to me \u2014 say things like "spent 5 on coffee" or "how's my budget". I'll handle the rest!`}
            />
          </Animated.View>

          {/* Summary card styled as terminal */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(600)}
            style={[
              styles.summaryOuter,
              {
                backgroundColor: theme.colors.base.surface,
                borderRadius: theme.radius.terminal,
                borderColor: theme.colors.petStates.neutral.light,
              },
              theme.shadows.sm,
            ]}
          >
            {/* Terminal header */}
            <View
              style={[
                styles.terminalHeader,
                {
                  backgroundColor: theme.colors.base.terminal,
                  borderTopLeftRadius: theme.radius.terminal - 2,
                  borderTopRightRadius: theme.radius.terminal - 2,
                  padding: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                },
              ]}
            >
              <View style={styles.terminalDots}>
                <View style={[styles.terminalDot, { backgroundColor: '#FF6B6B' }]} />
                <View style={[styles.terminalDot, { backgroundColor: '#F5C842' }]} />
                <View style={[styles.terminalDot, { backgroundColor: '#6BC5A0' }]} />
              </View>
              <Text
                style={[
                  styles.terminalTitleText,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                  },
                ]}
              >
                summary
              </Text>
            </View>

            {/* Summary body in terminal style */}
            <View
              style={[
                styles.summaryBody,
                {
                  backgroundColor: theme.colors.base.terminal,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryLine,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                  },
                ]}
              >
                {'> '}Your plan: {planName}
              </Text>
              <Text
                style={[
                  styles.summaryLine,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                  },
                ]}
              >
                {'> '}Monthly income: {'\u00A3'}{data.monthlyIncome.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.summaryLine,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                  },
                ]}
              >
                {'> '}Pet name: {petName}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* CTA */}
        <Animated.View
          entering={FadeInDown.delay(1000).duration(600)}
          style={styles.ctaWrap}
        >
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor:
                  isWriting
                    ? theme.colors.interactive.disabled
                    : pressed
                      ? theme.colors.interactive.primaryPressed
                      : theme.colors.interactive.primary,
                borderRadius: theme.radius.xl,
                minHeight: theme.components.button.primary.minHeight,
              },
            ]}
            onPress={handleStart}
            disabled={isWriting}
            accessibilityRole="button"
            accessibilityLabel="Let's go! Finish onboarding and start using the app"
          >
            <Text
              style={[
                styles.ctaText,
                {
                  color: isWriting
                    ? theme.colors.interactive.disabledText
                    : theme.colors.interactive.primaryText,
                  fontFamily: theme.fontsLoaded
                    ? theme.fonts.headingMedium
                    : undefined,
                },
              ]}
            >
              {isWriting ? 'Setting up...' : "Let's go!"}
            </Text>
          </Pressable>
          {error && (
            <Text
              style={[
                styles.errorText,
                {
                  color: theme.colors.petStates.critical?.medium ?? '#FF6B6B',
                  fontFamily: monoFont,
                },
              ]}
            >
              {'> ERR: '}{error}
            </Text>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  bubbleWrap: {
    alignSelf: 'stretch',
  },
  summaryOuter: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
  },
  terminalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitleText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  summaryBody: {
    gap: 6,
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 22,
  },
  ctaWrap: {
    alignSelf: 'stretch',
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 12,
  },
});
