import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useVoiceOnboarding } from '../../hooks/useVoiceOnboarding';
import VoiceMicButton from '../../components/VoiceMicButton';
import { useTheme } from '../../theme';

const PERSONAS = [
  {
    key: 'beginner' as const,
    title: 'Keep it simple',
    description: 'No jargon, just clear guidance',
    cue: 'SIMPLE',
  },
  {
    key: 'learner' as const,
    title: 'Explain the basics',
    description: 'Show the why behind the numbers',
    cue: 'GUIDE',
  },
  {
    key: 'pro' as const,
    title: 'Give me the raw data',
    description: 'Use the full detail when it matters',
    cue: 'DATA',
  },
];

export default function PersonaScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<'beginner' | 'learner' | 'pro'>(data.financialPersona);
  const autoContinueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const heading = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const promptText = "How should we talk about money? Say simple, basics, or data.";

  useEffect(() => () => {
    if (autoContinueTimer.current) clearTimeout(autoContinueTimer.current);
  }, []);

  const handleContinue = useCallback(() => {
    updateData({ financialPersona: selected });
    router.push('/onboarding/plan');
  }, [selected, updateData]);

  const handleSelect = useCallback((key: 'beginner' | 'learner' | 'pro') => {
    setSelected(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const persona = PERSONAS.find((entry) => entry.key === key);
    if (persona) {
      Speech.stop();
      Speech.speak(persona.title, { rate: 0.95 });
    }
  }, []);

  const handleVoiceSelect = useCallback((key: 'beginner' | 'learner' | 'pro') => {
    handleSelect(key);
    if (autoContinueTimer.current) clearTimeout(autoContinueTimer.current);
    autoContinueTimer.current = setTimeout(() => {
      updateData({ financialPersona: key });
      router.push('/onboarding/plan');
    }, 1200);
  }, [handleSelect, updateData]);

  const { isListening, transcript, startListening } = useVoiceOnboarding({
    instruction: promptText,
    keywords: {
      simple: () => handleVoiceSelect('beginner'),
      beginner: () => handleVoiceSelect('beginner'),
      basics: () => handleVoiceSelect('learner'),
      learner: () => handleVoiceSelect('learner'),
      guide: () => handleVoiceSelect('learner'),
      data: () => handleVoiceSelect('pro'),
      pro: () => handleVoiceSelect('pro'),
      raw: () => handleVoiceSelect('pro'),
    },
    enabled: true,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={5} totalSteps={9} />

        <PetTerminal petState="happy" petName={data.petName || 'Buddy'} compact />

        <SpeechBubble
          message={promptText}
          autoSpeak={false}
          onTTSDone={startListening}
        />

        <View style={[styles.cards, { gap: theme.spacing.md }]}>
          {PERSONAS.map((persona) => {
            const isSelected = selected === persona.key;
            return (
              <Pressable
                key={persona.key}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.base.surface,
                    borderRadius: theme.radius.lg,
                    borderColor: isSelected
                      ? theme.colors.interactive.primary
                      : theme.colors.base.border,
                  },
                  theme.shadows.sm,
                ]}
                onPress={() => handleSelect(persona.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${persona.title}. ${persona.description}`}
              >
                <View
                  style={[
                    styles.cueBadge,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.interactive.primary
                        : theme.colors.base.background,
                      borderRadius: theme.radius.full,
                      borderColor: isSelected
                        ? theme.colors.interactive.primary
                        : theme.colors.base.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? theme.colors.interactive.primaryText : theme.colors.base.textPrimary,
                      fontFamily: mono,
                      fontSize: theme.typeScale.caption,
                      fontWeight: '700',
                    }}
                  >
                    {persona.cue}
                  </Text>
                </View>

                <View style={styles.cardCopy}>
                  <Text
                    style={{
                      color: theme.colors.base.textPrimary,
                      fontFamily: heading,
                      fontSize: theme.typeScale.titleLarge,
                    }}
                  >
                    {persona.title}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.base.textSecondary,
                      fontSize: theme.typeScale.bodyLarge,
                    }}
                  >
                    {persona.description}
                  </Text>
                </View>

                {isSelected && (
                  <View
                    style={[
                      styles.activeBadge,
                      {
                        backgroundColor: theme.colors.interactive.primary,
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.interactive.primaryText,
                        fontFamily: mono,
                        fontSize: theme.typeScale.caption,
                        fontWeight: '700',
                      }}
                    >
                      ACTIVE
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <VoiceMicButton
          onPress={startListening}
          isListening={isListening}
          transcript={transcript}
        />

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
          accessibilityLabel="Continue to plan selection"
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
  cards: {
    flexGrow: 1,
  },
  card: {
    borderWidth: 2,
    padding: 18,
    gap: 14,
  },
  cueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  cardCopy: {
    gap: 6,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cta: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
