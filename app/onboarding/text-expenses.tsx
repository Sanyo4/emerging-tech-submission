import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useTheme } from '../../theme';

const DEFAULT_EXPENSES = [
  { name: 'Rent', amount: 900 },
  { name: 'Utilities', amount: 120 },
  { name: 'Phone', amount: 35 },
  { name: 'Insurance', amount: 60 },
  { name: 'Transport', amount: 80 },
  { name: 'Other', amount: 0 },
];

interface ExpenseItem {
  name: string;
  amount: number;
  enabled: boolean;
}

export default function TextExpensesScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [expenses, setExpenses] = useState<ExpenseItem[]>(
    data.fixedExpenses.length > 0
      ? data.fixedExpenses.map((expense) => ({ ...expense, enabled: true }))
      : DEFAULT_EXPENSES.map((expense) => ({ ...expense, enabled: expense.amount > 0 })),
  );

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = 'Add your fixed monthly bills. Turn off anything you do not need and adjust the amounts below.';

  const toggleExpense = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpenses((prev) => prev.map((expense, currentIndex) => (
      currentIndex === index ? { ...expense, enabled: !expense.enabled } : expense
    )));
  };

  const updateAmount = (index: number, text: string) => {
    const num = parseFloat(text) || 0;
    setExpenses((prev) => prev.map((expense, currentIndex) => (
      currentIndex === index ? { ...expense, amount: num } : expense
    )));
  };

  const total = expenses
    .filter((expense) => expense.enabled)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fixedExpenses = expenses
      .filter((expense) => expense.enabled && expense.amount > 0)
      .map(({ name, amount }) => ({ name, amount }));
    updateData({ fixedExpenses });
    router.push('/onboarding/text-spending');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
                {'> fixed_expenses.manual_entry'}
              </Text>
              <Text
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                  opacity: 0.7,
                }}
              >
                {`> total active bills: £${total.toFixed(0)}`}
              </Text>
            </View>
          </View>

          <View style={[styles.list, { gap: theme.spacing.sm }]}>
            {expenses.map((expense, index) => (
              <View
                key={`${expense.name}-${index}`}
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.colors.base.surface,
                    borderColor: expense.enabled
                      ? theme.colors.base.border
                      : theme.colors.base.border + '66',
                    borderRadius: theme.radius.lg,
                  },
                  theme.shadows.sm,
                  !expense.enabled && styles.rowDisabled,
                ]}
              >
                <Pressable
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: expense.enabled
                        ? theme.colors.interactive.primary
                        : theme.colors.base.background,
                      borderColor: expense.enabled
                        ? theme.colors.interactive.primary
                        : theme.colors.base.border,
                      borderRadius: theme.radius.sm,
                    },
                  ]}
                  onPress={() => toggleExpense(index)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: expense.enabled }}
                  accessibilityLabel={expense.name}
                >
                  <Text
                    style={{
                      color: expense.enabled
                        ? theme.colors.interactive.primaryText
                        : theme.colors.base.textSecondary,
                      fontFamily: mono,
                      fontSize: theme.typeScale.caption,
                      fontWeight: '700',
                    }}
                  >
                    {expense.enabled ? 'ON' : 'OFF'}
                  </Text>
                </Pressable>

                <Text style={[styles.expenseName, { color: theme.colors.base.textPrimary, fontFamily: heading }]}>
                  {expense.name}
                </Text>

                <View
                  style={[
                    styles.amountField,
                    {
                      borderColor: theme.colors.base.border,
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.base.background,
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: theme.typeScale.bodySmall }}>
                    £
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.base.textPrimary,
                        fontFamily: mono,
                        fontSize: theme.typeScale.bodyLarge,
                      },
                    ]}
                    value={expense.amount > 0 ? expense.amount.toString() : ''}
                    onChangeText={(text) => updateAmount(index, text)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.base.textSecondary}
                    editable={expense.enabled}
                    accessibilityLabel={`${expense.name} amount`}
                  />
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: pressed
                  ? theme.colors.interactive.primaryPressed
                  : theme.colors.interactive.primary,
                borderRadius: theme.radius.xl,
              },
              theme.shadows.md,
            ]}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to flexible spending"
          >
            <Text
              style={{
                color: theme.colors.interactive.primaryText,
                fontFamily: heading,
                fontSize: theme.typeScale.bodyLarge,
                fontWeight: '700',
              }}
            >
              Continue
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  list: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  checkbox: {
    width: 52,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  expenseName: {
    flex: 1,
    fontSize: 16,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  input: {
    minWidth: 44,
    textAlign: 'right',
    padding: 0,
  },
  cta: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
