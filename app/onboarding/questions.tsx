import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import { useOnboarding } from '../../services/onboardingContext';
import { getPetArt } from '../../assets/pet';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useVoiceOnboarding } from '../../hooks/useVoiceOnboarding';
import VoiceMicButton from '../../components/VoiceMicButton';

interface Question {
  text: string;
  tag: string;
}

const QUESTIONS: Question[] = [
  { text: 'I want to know where my money goes each week', tag: 'expense_tracking' },
  { text: 'I have a specific savings goal right now', tag: 'goal_setting' },
  { text: 'I want to build an emergency fund', tag: 'emergency_fund' },
  { text: "I'm new to budgeting", tag: 'budgeting' },
  { text: 'I want to understand money better', tag: 'literacy' },
];

export default function QuestionsScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(data.motivationFocuses);

  const eggLines = getPetArt('egg');
  const monoFont = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const headingFont = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;

  const isFinished = currentIndex >= QUESTIONS.length;
  const currentQuestion = !isFinished ? QUESTIONS[currentIndex] : null;

  const voiceInstruction = currentQuestion
    ? `Question ${currentIndex + 1} of 5. ${currentQuestion.text}. Say yes or no.`
    : '';

  const handleAnswer = useCallback(
    (answer: 'yes' | 'no') => {
      if (!currentQuestion) return;

      if (answer === 'yes') {
        setSelectedTags((prev) =>
          prev.includes(currentQuestion.tag) ? prev : [...prev, currentQuestion.tag],
        );
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= QUESTIONS.length) {
        // Save and navigate after last question
        const finalTags =
          answer === 'yes' && !selectedTags.includes(currentQuestion.tag)
            ? [...selectedTags, currentQuestion.tag]
            : selectedTags;
        updateData({ motivationFocuses: finalTags.length > 0 ? finalTags : ['budgeting'] });
        setCurrentIndex(nextIndex);
        // Small delay so the user sees the final state before navigating
        setTimeout(() => {
          router.push('/onboarding/voice-income');
        }, 400);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, currentQuestion, selectedTags, updateData],
  );

  const { isListening, transcript, startListening } = useVoiceOnboarding({
    instruction: voiceInstruction,
    keywords: {
      'yes': () => handleAnswer('yes'),
      'yeah': () => handleAnswer('yes'),
      'yep': () => handleAnswer('yes'),
      'no': () => handleAnswer('no'),
      'nope': () => handleAnswer('no'),
      'nah': () => handleAnswer('no'),
    },
    enabled: !isFinished,
    autoSpeakInstruction: false,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact egg terminal */}
        <View
          style={[
            styles.outerCard,
            {
              backgroundColor: theme.colors.base.surface,
              borderRadius: theme.radius.terminal,
              borderColor: theme.colors.petStates.neutral.light,
            },
            theme.shadows.md,
          ]}
        >
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${data.petName} the egg is watching you answer questions`}
            style={[
              styles.terminal,
              {
                backgroundColor: theme.colors.base.terminal,
                borderRadius: theme.radius.terminal - 2,
                padding: theme.spacing.sm,
              },
            ]}
          >
            {eggLines.slice(1, 8).map((line, i) => (
              <Text
                key={i}
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminalSmall,
                  lineHeight: theme.typeScale.terminalSmall * theme.lineHeight.relaxed,
                  textAlign: 'center',
                }}
              >
                {line}
              </Text>
            ))}
            <Text
              style={{
                color: theme.colors.base.terminalText,
                fontFamily: monoFont,
                fontSize: theme.typeScale.terminalSmall,
                textAlign: 'center',
                marginTop: 4,
                opacity: 0.8,
              }}
            >
              {`-- ${data.petName} --`}
            </Text>
          </View>
        </View>

        {/* Question prompt */}
        {!isFinished && currentQuestion ? (
          <>
            <View style={{ marginTop: theme.spacing.md }}>
              <SpeechBubble
                message={voiceInstruction}
                onTTSDone={startListening}
              />
            </View>

            {/* Terminal-style Y/N prompt */}
            <View
              style={[
                styles.promptCard,
                {
                  backgroundColor: theme.colors.base.terminal,
                  borderRadius: theme.radius.terminal,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.colors.petStates.thriving.light,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminalSmall,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {`> Question ${currentIndex + 1} of ${QUESTIONS.length}`}
              </Text>
              <Text
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminal,
                }}
              >
                {'> (Y/N)? _'}
              </Text>
            </View>

            {/* Voice mic button */}
            <View style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
              <VoiceMicButton
                onPress={startListening}
                isListening={isListening}
                transcript={transcript}
                disabled={isFinished}
              />
            </View>

            {/* Y / N buttons */}
            <View style={[styles.buttonRow, { marginTop: theme.spacing.xl }]}>
              <Pressable
                style={[
                  styles.answerButton,
                  {
                    backgroundColor: theme.colors.interactive.primary,
                    borderRadius: theme.radius.xl,
                  },
                  theme.shadows.md,
                ]}
                onPress={() => handleAnswer('yes')}
                accessibilityRole="button"
                accessibilityLabel={`Yes, ${currentQuestion.text}`}
              >
                <Text
                  style={[
                    styles.answerButtonText,
                    {
                      color: theme.colors.interactive.primaryText,
                      fontFamily: headingFont,
                      fontSize: theme.typeScale.bodyLarge,
                    },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.answerButton,
                  {
                    backgroundColor: theme.colors.interactive.secondary,
                    borderRadius: theme.radius.xl,
                  },
                  theme.shadows.sm,
                ]}
                onPress={() => handleAnswer('no')}
                accessibilityRole="button"
                accessibilityLabel={`No, skip ${currentQuestion.text}`}
              >
                <Text
                  style={[
                    styles.answerButtonText,
                    {
                      color: theme.colors.interactive.secondaryText,
                      fontFamily: headingFont,
                      fontSize: theme.typeScale.bodyLarge,
                    },
                  ]}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          /* Finished summary */
          <View style={[styles.finishedCard, { marginTop: theme.spacing.xl }]}>
            <Text
              style={{
                color: theme.colors.base.textPrimary,
                fontFamily: headingFont,
                fontSize: theme.typeScale.titleLarge,
                textAlign: 'center',
              }}
              accessibilityRole="header"
            >
              All set!
            </Text>
            <Text
              style={{
                color: theme.colors.base.textSecondary,
                fontSize: theme.typeScale.bodyLarge,
                textAlign: 'center',
                marginTop: theme.spacing.sm,
              }}
            >
              {selectedTags.length} focus{selectedTags.length !== 1 ? 'es' : ''} selected
            </Text>
          </View>
        )}

        {/* Progress dots */}
        <View
          style={[styles.dotsRow, { marginTop: theme.spacing.xxl }]}
          accessibilityRole="progressbar"
          accessibilityLabel={`Question ${Math.min(currentIndex + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}
        >
          {QUESTIONS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < currentIndex
                      ? theme.colors.interactive.primary
                      : i === currentIndex && !isFinished
                        ? theme.colors.petStates.neutral.medium
                        : theme.colors.base.border,
                  width: i === currentIndex && !isFinished ? 12 : 8,
                  height: i === currentIndex && !isFinished ? 12 : 8,
                  borderRadius: theme.radius.full,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  outerCard: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  terminal: {
    alignItems: 'center',
  },
  promptCard: {
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  answerButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  answerButtonText: {
    fontWeight: '700',
  },
  finishedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    // width, height, borderRadius, backgroundColor set inline
  },
});
