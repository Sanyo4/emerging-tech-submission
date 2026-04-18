import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import VoiceInput from '../../components/VoiceInput';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useTheme } from '../../theme';

function parseAmount(text: string): number | null {
  const match = text.match(/£?\s*(\d[\d,]*\.?\d*)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

export default function VoiceFlexibleScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const totalBills = data.fixedExpenses.reduce((sum, bill) => sum + bill.amount, 0);
  const autoCalc = Math.max(0, data.monthlyIncome - totalBills);
  const [amount, setAmount] = useState<number | null>(autoCalc > 0 ? autoCalc : null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micTrigger, setMicTrigger] = useState(0);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = useMemo(
    () => autoCalc > 0
      ? `After bills, you have about £${Math.round(autoCalc)} left. How much do you want for daily spending?`
      : 'How much do you want for daily spending each month?',
    [autoCalc],
  );

  const queueAutoMic = useCallback(() => {
    setMicTrigger((current) => current + 1);
  }, []);

  const speakAndAutoMic = useCallback((text: string, rate = 0.95) => {
    Speech.stop();
    Speech.speak(text, {
      rate,
      onDone: queueAutoMic,
      onStopped: () => {},
    });
  }, [queueAutoMic]);

  useEffect(() => {
    speakAndAutoMic(promptText, autoCalc > 0 ? 0.86 : 0.9);
  }, [autoCalc, promptText, speakAndAutoMic]);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const parsed = parseAmount(text);

    if (parsed && parsed > 0) {
      setAmount(parsed);
      updateData({ flexibleSpending: parsed });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.stop();
      Speech.speak(`Got it. £${Math.round(parsed)} for flexible spending. Moving on.`, {
        rate: 0.95,
        onDone: () => router.push('/onboarding/persona'),
        onStopped: () => {}, // user interrupted (shake/tap) — stay so they can re-speak
      });
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      speakAndAutoMic('Say an amount, like 500.');
    }

    setIsProcessing(false);
  };

  const handleContinue = () => {
    updateData({ flexibleSpending: amount || autoCalc });
    router.push('/onboarding/persona');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={4} totalSteps={9} />

        <PetTerminal petState="happy" petName={data.petName || 'Buddy'} compact />

        <SpeechBubble
          message={promptText}
          autoSpeak={false}
          onTTSDone={queueAutoMic}
        />

        <View
          style={[
            styles.terminalCard,
            {
              backgroundColor: theme.colors.base.surface,
              borderRadius: theme.radius.terminal,
              borderColor: theme.colors.petStates.happy.light,
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
              style={[
                styles.terminalLine,
                {
                  color: theme.colors.petStates.happy.light,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                },
              ]}
            >
              {'> flexible_budget.capture'}
            </Text>

            {autoCalc > 0 && (
              <>
                <Text
                  style={[
                    styles.summaryLine,
                    {
                      color: theme.colors.base.terminalText,
                      fontFamily: mono,
                      fontSize: theme.typeScale.terminalSmall,
                    },
                  ]}
                >
                  {`> income: £${data.monthlyIncome.toLocaleString()}`}
                </Text>
                <Text
                  style={[
                    styles.summaryLine,
                    {
                      color: theme.colors.base.terminalText,
                      fontFamily: mono,
                      fontSize: theme.typeScale.terminalSmall,
                    },
                  ]}
                >
                  {`> bills:  £${totalBills.toLocaleString()}`}
                </Text>
              </>
            )}

            <Text
              style={[
                styles.valueLine,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminal,
                },
              ]}
            >
              {amount !== null ? `> target: £${amount.toLocaleString()}` : '> target: awaiting amount...'}
            </Text>
          </View>
        </View>

        <VoiceInput
          onTranscript={handleTranscript}
          isProcessing={isProcessing}
          autoStartTrigger={micTrigger}
        />

        <Pressable
          style={styles.linkButton}
          onPress={() => router.replace('/onboarding/text-spending')}
          accessibilityRole="button"
          accessibilityLabel="Type instead"
        >
          <Text
            style={{
              color: theme.colors.base.textSecondary,
              fontFamily: mono,
              fontSize: theme.typeScale.bodySmall,
            }}
          >
            Type instead
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: amount
                ? pressed
                  ? theme.colors.interactive.primaryPressed
                  : theme.colors.interactive.primary
                : theme.colors.interactive.disabled,
              borderRadius: theme.radius.xl,
            },
            amount ? theme.shadows.md : undefined,
          ]}
          onPress={handleContinue}
          disabled={!amount}
          accessibilityRole="button"
          accessibilityLabel="Continue to communication style"
        >
          <Text
            style={{
              color: amount ? theme.colors.interactive.primaryText : theme.colors.interactive.disabledText,
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
  terminalLine: {
    opacity: 0.85,
  },
  summaryLine: {
    lineHeight: 22,
  },
  valueLine: {
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cta: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
