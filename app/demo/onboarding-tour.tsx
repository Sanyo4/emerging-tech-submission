// Self-contained onboarding tour for the /demo showcase.
//
// Deliberately does NOT route into /onboarding/* and does NOT import
// services/onboardingContext or services/onboardingWriter. That avoids:
//   - AuthGate redirecting away (user is already onboarded)
//   - welcome.tsx auto-starting the mic via useVoiceOnboarding
//   - done.tsx calling writeOnboardingData() and overwriting real data.
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PetTerminal from '../../components/pet/PetTerminal';
import { getPetArt } from '../../assets/pet';
import { useTheme } from '../../theme';

interface Slide {
  title: string;
  body: string;
  /** What visual to render on this slide. */
  visual: 'egg' | 'pet-happy' | 'pet-thriving' | 'terminal-only';
  /** Terminal-styled lines (shown in a panel on terminal-only slides). */
  terminalLines?: string[];
}

const SLIDES: Slide[] = [
  {
    title: 'Welcome',
    body: 'Meet your egg. A tiny financial companion that grows as you build better money habits.',
    visual: 'egg',
  },
  {
    title: 'Voice or text',
    body: 'Choose how to talk to your pet. Voice-first for hands-free logging, or type if you prefer.',
    visual: 'terminal-only',
    terminalLines: [
      '> How would you like to log?',
      '',
      '  [ Voice ]   speak naturally',
      '  [ Text  ]   type it out',
    ],
  },
  {
    title: 'Set a budget',
    body: 'Tell us your income and fixed bills. We\u2019ll split the rest into weekly categories your pet watches.',
    visual: 'terminal-only',
    terminalLines: [
      '> Monthly income:  \u00A32,400',
      '> Fixed bills:     \u00A3  850',
      '> Flexible budget: \u00A31,550',
      '',
      '  Groceries  \u00A3400/wk',
      '  Transport  \u00A3 80/wk',
      '  Dining     \u00A3 60/wk',
    ],
  },
  {
    title: 'Pick a persona',
    body: 'Beginner, Learner, or Pro. We adjust the lesson pace and language to match.',
    visual: 'terminal-only',
    terminalLines: [
      '  [ Beginner ]  gentle coaching',
      '  [ Learner  ]  steady challenges',
      '  [ Pro      ]  fast feedback',
    ],
  },
  {
    title: 'Hatched!',
    body: 'Your pet is born. Every log, lesson, and quest you complete shapes who they become.',
    visual: 'pet-happy',
  },
];

export default function OnboardingTour() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const isFirst = index === 0;

  const goNext = () => {
    if (isLast) {
      router.back();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (isFirst) return;
    setIndex((i) => i - 1);
  };

  const exit = () => router.back();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: theme.spacing.md }]}>
        <Pressable
          onPress={exit}
          accessibilityLabel="Exit onboarding tour"
          accessibilityRole="button"
          style={styles.exitBtn}
        >
          <Text style={[styles.exitText, { color: theme.colors.interactive.primary }]}>{'<- Exit tour'}</Text>
        </Pressable>
        <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }}>
          {`${index + 1} / ${SLIDES.length}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        {/* Slide title */}
        <Text
          style={[
            styles.slideTitle,
            { color: theme.colors.base.textPrimary, fontFamily: mono, fontSize: 22 * fs },
          ]}
        >
          {slide.title}
        </Text>

        {/* Visual */}
        {slide.visual === 'egg' && (
          <EggVisual mono={mono} fs={fs} theme={theme} />
        )}
        {slide.visual === 'pet-happy' && (
          <PetTerminal petState="happy" petName="Buddy" healthPoints={80} />
        )}
        {slide.visual === 'pet-thriving' && (
          <PetTerminal petState="thriving" petName="Buddy" healthPoints={95} />
        )}
        {slide.visual === 'terminal-only' && slide.terminalLines && (
          <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
            {slide.terminalLines.map((line, i) => (
              <Text
                key={i}
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: mono,
                  fontSize: 14 * fs,
                  lineHeight: 22 * fs,
                }}
              >
                {line || ' '}
              </Text>
            ))}
          </View>
        )}

        {/* Body copy */}
        <Text
          style={{
            color: theme.colors.base.textPrimary,
            fontFamily: mono,
            fontSize: 14 * fs,
            lineHeight: 22 * fs,
            marginTop: 8,
          }}
        >
          {slide.body}
        </Text>
      </ScrollView>

      {/* Nav buttons */}
      <View style={[styles.navRow, { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Pressable
          onPress={goPrev}
          disabled={isFirst}
          accessibilityLabel="Previous slide"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.navBtn,
            {
              backgroundColor: isFirst
                ? theme.colors.interactive.disabled
                : pressed
                ? theme.colors.interactive.secondaryPressed
                : theme.colors.interactive.secondary,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          <Text
            style={{
              color: isFirst ? theme.colors.interactive.disabledText : theme.colors.interactive.secondaryText,
              fontSize: 15 * fs,
              fontWeight: '600',
            }}
          >
            Back
          </Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          accessibilityLabel={isLast ? 'Finish tour' : 'Next slide'}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.navBtn,
            {
              backgroundColor: pressed ? theme.colors.interactive.primaryPressed : theme.colors.interactive.primary,
              borderRadius: theme.radius.xl,
              flex: 1.5,
            },
          ]}
        >
          <Text style={{ color: theme.colors.interactive.primaryText, fontSize: 15 * fs, fontWeight: '600' }}>
            {isLast ? 'Done' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** Lightweight egg renderer — PetTerminal only accepts PetMood, not 'egg',
 *  so we inline the terminal+art for the first slide. */
function EggVisual({ mono, fs, theme }: { mono: string | undefined; fs: number; theme: ReturnType<typeof useTheme> }) {
  const lines = getPetArt('egg');
  const artFontSize = theme.typeScale.terminal;
  return (
    <View
      style={[
        styles.eggOuter,
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
          styles.eggInner,
          {
            backgroundColor: theme.colors.base.terminal,
            borderRadius: theme.radius.terminal - 2,
            padding: theme.spacing.lg,
          },
        ]}
      >
        {lines.map((line, i) => (
          <Text
            key={i}
            style={{
              color: theme.colors.base.terminalText,
              fontFamily: mono,
              fontSize: artFontSize,
              lineHeight: artFontSize * theme.lineHeight.relaxed,
              textAlign: 'center',
            }}
          >
            {line}
          </Text>
        ))}
        <Text
          style={{
            color: theme.colors.base.terminalText,
            fontFamily: mono,
            fontSize: theme.typeScale.terminalSmall * fs,
            textAlign: 'center',
            marginTop: 8,
            opacity: 0.8,
          }}
        >
          {'── waiting to hatch ──'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  exitBtn: { paddingVertical: 8, minHeight: 48, justifyContent: 'center' },
  exitText: { fontSize: 16, fontWeight: '600' },
  content: { flexGrow: 1, gap: 16 },
  slideTitle: { fontWeight: '700' },
  terminal: { padding: 16 },
  navRow: { flexDirection: 'row' },
  navBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  eggOuter: { borderWidth: 2, overflow: 'hidden' },
  eggInner: { alignItems: 'center' },
});
