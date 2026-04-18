import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useTheme } from '../../theme';

const SLIDER_WIDTH = 300;
const KNOB_SIZE = 32;
const MIN = 0;
const MAX = 1000;
const STEP = 25;

export default function TextSpendingScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const totalBills = data.fixedExpenses.reduce((sum, bill) => sum + bill.amount, 0);
  const available = Math.max(0, data.monthlyIncome - totalBills);
  const maxSlider = available > 0 ? Math.min(available, MAX) : MAX;

  const [value, setValue] = useState(
    data.flexibleSpending > 0 ? data.flexibleSpending : Math.round(available * 0.8),
  );

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = 'Set your monthly flexible spending target for groceries, travel, meals, and shopping.';

  const position = useMemo(
    () => ((value - MIN) / Math.max(maxSlider - MIN, 1)) * (SLIDER_WIDTH - KNOB_SIZE),
    [value, maxSlider],
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(position, { duration: 100 }) }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(position + KNOB_SIZE / 2, { duration: 100 }),
  }));

  const adjustValue = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue((prev) => Math.max(MIN, Math.min(maxSlider, prev + delta)));
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ flexibleSpending: value });
    router.push('/onboarding/persona');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={4} totalSteps={9} />

        <PetTerminal petState="neutral" petName={data.petName || 'Buddy'} compact />

        <SpeechBubble message={promptText} autoSpeak={false} />

        <View
          style={[
            styles.terminalCard,
            {
              backgroundColor: theme.colors.base.surface,
              borderRadius: theme.radius.terminal,
              borderColor: theme.colors.petStates.neutral.light,
            },
            theme.shadows.md,
          ]}
        >
          <View
            style={[
              styles.terminalInner,
              {
                backgroundColor: theme.colors.base.terminal,
                borderRadius: theme.radius.terminal - 2,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.petStates.neutral.light,
                fontFamily: mono,
                fontSize: theme.typeScale.terminalSmall,
              }}
            >
              {'> flexible_budget.manual_entry'}
            </Text>
            {available > 0 && (
              <Text
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                  opacity: 0.7,
                }}
              >
                {`> available after bills: £${available.toLocaleString()}`}
              </Text>
            )}
            <Text
              style={{
                color: theme.colors.base.terminalText,
                fontFamily: mono,
                fontSize: theme.typeScale.terminal,
                fontWeight: '700',
              }}
            >
              {`> target: £${value.toLocaleString()}`}
            </Text>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <View
            style={[
              styles.track,
              {
                backgroundColor: theme.colors.base.border,
                borderRadius: theme.radius.full,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: theme.colors.interactive.primary,
                  borderRadius: theme.radius.full,
                },
                fillStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.knob,
                {
                  backgroundColor: theme.colors.interactive.primary,
                  borderColor: theme.colors.base.background,
                },
                knobStyle,
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: theme.typeScale.caption }}>
              £{MIN}
            </Text>
            <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: theme.typeScale.caption }}>
              £{maxSlider}
            </Text>
          </View>
        </View>

        <View style={[styles.adjustRow, { gap: theme.spacing.lg }]}>
          <Pressable
            style={[
              styles.adjustButton,
              {
                backgroundColor: theme.colors.base.surface,
                borderColor: theme.colors.base.border,
                borderRadius: theme.radius.lg,
              },
            ]}
            onPress={() => adjustValue(-STEP)}
            accessibilityRole="button"
            accessibilityLabel={`Decrease by £${STEP}`}
          >
            <Text style={{ color: theme.colors.base.textPrimary, fontFamily: mono, fontSize: theme.typeScale.bodyLarge }}>
              -£{STEP}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.adjustButton,
              {
                backgroundColor: theme.colors.base.surface,
                borderColor: theme.colors.base.border,
                borderRadius: theme.radius.lg,
              },
            ]}
            onPress={() => adjustValue(STEP)}
            accessibilityRole="button"
            accessibilityLabel={`Increase by £${STEP}`}
          >
            <Text style={{ color: theme.colors.base.textPrimary, fontFamily: mono, fontSize: theme.typeScale.bodyLarge }}>
              +£{STEP}
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.includesBox,
            {
              backgroundColor: theme.colors.base.surface,
              borderColor: theme.colors.base.border,
              borderRadius: theme.radius.lg,
            },
            theme.shadows.sm,
          ]}
        >
          <Text style={{ color: theme.colors.base.textPrimary, fontFamily: heading, fontSize: theme.typeScale.bodyLarge }}>
            Included categories
          </Text>
          <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: theme.typeScale.bodySmall }}>
            groceries  transport  meals  shopping
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: value > 0
                ? pressed
                  ? theme.colors.interactive.primaryPressed
                  : theme.colors.interactive.primary
                : theme.colors.interactive.disabled,
              borderRadius: theme.radius.xl,
            },
            value > 0 ? theme.shadows.md : undefined,
          ]}
          onPress={handleContinue}
          disabled={value <= 0}
          accessibilityRole="button"
          accessibilityLabel="Continue to communication style"
        >
          <Text
            style={{
              color: value > 0 ? theme.colors.interactive.primaryText : theme.colors.interactive.disabledText,
              fontFamily: heading,
              fontSize: theme.typeScale.bodyLarge,
              fontWeight: '700',
            }}
          >
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 16,
  },
  terminalCard: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  terminalInner: {
    gap: 10,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    alignSelf: 'center',
    gap: 8,
  },
  track: {
    height: 8,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 8,
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  adjustButton: {
    minWidth: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
  },
  includesBox: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
    borderWidth: 1,
  },
  cta: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
