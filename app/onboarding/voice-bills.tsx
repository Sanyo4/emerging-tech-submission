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

function parseBill(text: string): { name: string; amount: number } | null {
  const lower = text.toLowerCase();
  if (lower.includes('done') || lower.includes('finish') || lower.includes("that's it") || lower.includes("that's all")) {
    return null;
  }

  const amountMatch = text.match(/£?\s*(\d[\d,]*\.?\d*)/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  const nameText = text.replace(/£?\s*\d[\d,]*\.?\d*/g, '').trim();
  const name = nameText || 'Bill';
  return { name: name.charAt(0).toUpperCase() + name.slice(1), amount };
}

export default function VoiceBillsScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [bills, setBills] = useState<{ name: string; amount: number }[]>(data.fixedExpenses);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micTrigger, setMicTrigger] = useState(0);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = 'What are your regular bills? Say a bill name and amount, then say done when finished.';
  const totalBills = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.amount, 0),
    [bills],
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
    speakAndAutoMic(promptText, 0.86);
  }, [promptText, speakAndAutoMic]);

  const handleContinue = useCallback(() => {
    updateData({ fixedExpenses: bills });
    router.push('/onboarding/voice-flexible');
  }, [bills, updateData]);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const lower = text.toLowerCase();

    if (lower.includes('done') || lower.includes('finish') || lower.includes("that's it") || lower.includes("that's all")) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.stop();
      Speech.speak(`Got ${bills.length} bill${bills.length === 1 ? '' : 's'}. Moving on.`, {
        rate: 0.95,
        onDone: handleContinue,
        onStopped: () => {},
      });
      setIsProcessing(false);
      return;
    }

    const bill = parseBill(text);
    if (bill) {
      setBills((prev) => [...prev, bill]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speakAndAutoMic(`Added ${bill.name}, £${Math.round(bill.amount)}. Next bill, or say done.`);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      speakAndAutoMic('Say a bill name and amount, like rent 900.');
    }

    setIsProcessing(false);
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
                styles.sectionLabel,
                {
                  color: theme.colors.petStates.happy.light,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                },
              ]}
            >
              {'> bills.capture'}
            </Text>

            {bills.length > 0 ? (
              bills.map((bill, index) => (
                <Text
                  key={`${bill.name}-${index}`}
                  style={[
                    styles.billLine,
                    {
                      color: theme.colors.base.terminalText,
                      fontFamily: mono,
                      fontSize: theme.typeScale.terminalSmall,
                    },
                  ]}
                >
                  {`> ${bill.name.padEnd(18).slice(0, 18)} £${bill.amount.toFixed(0)}`}
                </Text>
              ))
            ) : (
              <Text
                style={[
                  styles.billLine,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: mono,
                    fontSize: theme.typeScale.terminalSmall,
                    opacity: 0.6,
                  },
                ]}
              >
                {'> no bills captured yet'}
              </Text>
            )}

            <Text
              style={[
                styles.totalLine,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                },
              ]}
            >
              {`> total monthly bills: £${totalBills.toFixed(0)}`}
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
          onPress={() => router.replace('/onboarding/text-expenses')}
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
              backgroundColor: pressed
                ? theme.colors.interactive.primaryPressed
                : theme.colors.interactive.primary,
              borderRadius: theme.radius.xl,
            },
            theme.shadows.md,
          ]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel={bills.length > 0 ? 'Continue to flexible budget' : 'Skip to flexible budget'}
        >
          <Text
            style={{
              color: theme.colors.interactive.primaryText,
              fontFamily: heading,
              fontSize: theme.typeScale.bodyLarge,
              fontWeight: '700',
            }}
          >
            {bills.length > 0 ? 'Continue' : 'Skip, no bills'}
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
  sectionLabel: {
    opacity: 0.85,
  },
  billLine: {
    lineHeight: 22,
  },
  totalLine: {
    marginTop: 4,
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
