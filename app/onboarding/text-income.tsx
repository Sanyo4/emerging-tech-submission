import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import NumPad from '../../components/NumPad';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useTheme } from '../../theme';

export default function TextIncomeScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [value, setValue] = useState(data.monthlyIncome > 0 ? data.monthlyIncome.toString() : '');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = 'Type your monthly take-home pay. You can switch between weekly, monthly, and yearly input.';

  const numValue = parseFloat(value) || 0;
  const monthlyValue = useMemo(() => {
    if (frequency === 'weekly') return numValue * 4.3;
    if (frequency === 'yearly') return numValue / 12;
    return numValue;
  }, [frequency, numValue]);

  const handleDigit = (digit: string) => {
    if (digit === '.' && value.includes('.')) return;
    if (value.length >= 8) return;
    setValue((prev) => prev + digit);
  };

  const handleDelete = () => {
    setValue((prev) => prev.slice(0, -1));
  };

  const handleContinue = () => {
    if (monthlyValue <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ monthlyIncome: Math.round(monthlyValue * 100) / 100 });
    router.push('/onboarding/text-expenses');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
        keyboardShouldPersistTaps="handled"
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
              {'> income.manual_entry'}
            </Text>
            <Text
              style={{
                color: theme.colors.base.terminalText,
                fontFamily: mono,
                fontSize: theme.typeScale.terminal,
                fontWeight: '700',
              }}
            >
              {`> £${value || '0'}`}
            </Text>
            {frequency !== 'monthly' && numValue > 0 && (
              <Text
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                  opacity: 0.7,
                }}
              >
                {`> ≈ £${Math.round(monthlyValue).toLocaleString()} / month`}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.frequencyRow, { gap: theme.spacing.sm }]}>
          {(['weekly', 'monthly', 'yearly'] as const).map((option) => {
            const selected = frequency === option;
            return (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.frequencyButton,
                  {
                    backgroundColor: selected
                      ? pressed
                        ? theme.colors.interactive.primaryPressed
                        : theme.colors.interactive.primary
                      : theme.colors.base.surface,
                    borderColor: selected
                      ? theme.colors.interactive.primary
                      : theme.colors.base.border,
                    borderRadius: theme.radius.full,
                  },
                ]}
                onPress={() => setFrequency(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={{
                    color: selected ? theme.colors.interactive.primaryText : theme.colors.base.textPrimary,
                    fontFamily: mono,
                    fontSize: theme.typeScale.bodySmall,
                    fontWeight: '700',
                  }}
                >
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <NumPad onDigit={handleDigit} onDelete={handleDelete} showDecimal />

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: monthlyValue > 0
                ? pressed
                  ? theme.colors.interactive.primaryPressed
                  : theme.colors.interactive.primary
                : theme.colors.interactive.disabled,
              borderRadius: theme.radius.xl,
            },
            monthlyValue > 0 ? theme.shadows.md : undefined,
          ]}
          onPress={handleContinue}
          disabled={monthlyValue <= 0}
          accessibilityRole="button"
          accessibilityLabel="Continue to fixed expenses"
        >
          <Text
            style={{
              color: monthlyValue > 0 ? theme.colors.interactive.primaryText : theme.colors.interactive.disabledText,
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
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  frequencyButton: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  cta: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
