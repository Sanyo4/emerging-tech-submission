import { useCallback, useEffect, useState } from 'react';
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

export default function VoiceIncomeScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [amount, setAmount] = useState<number | null>(data.monthlyIncome || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micTrigger, setMicTrigger] = useState(0);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = "What's your monthly take-home pay? Say an amount in pounds.";

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
    speakAndAutoMic(promptText, 0.9);
  }, [promptText, speakAndAutoMic]);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const parsed = parseAmount(text);

    if (parsed && parsed > 0) {
      setAmount(parsed);
      updateData({ monthlyIncome: parsed });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.stop();
      Speech.speak(`Got it. £${Math.round(parsed)} per month. Moving on.`, {
        rate: 0.95,
        onDone: () => router.push('/onboarding/voice-bills'),
        onStopped: () => {}, // user interrupted (shake/tap) — stay so they can re-speak
      });
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      speakAndAutoMic("I didn't catch an amount. Try saying a number like 2000.");
    }

    setIsProcessing(false);
  };

  const handleContinue = () => {
    if (!amount) return;
    updateData({ monthlyIncome: amount });
    router.push('/onboarding/voice-bills');
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
              {'> income.capture'}
            </Text>
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
              {amount !== null ? `> £${amount.toLocaleString()}` : '> awaiting amount...'}
            </Text>
            <Text
              style={[
                styles.hintLine,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: theme.typeScale.terminalSmall,
                },
              ]}
            >
              {'> say a number or tap the bubble to hear the prompt again'}
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
          onPress={() => router.replace('/onboarding/text-income')}
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
          accessibilityLabel="Continue to bills"
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
  valueLine: {
    fontWeight: '700',
  },
  hintLine: {
    opacity: 0.65,
    lineHeight: 22,
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
