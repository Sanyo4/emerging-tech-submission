import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { useVoiceOnboarding } from '../../hooks/useVoiceOnboarding';
import VoiceMicButton from '../../components/VoiceMicButton';
import { useTheme } from '../../theme';
import { scorePlans, getTopPlans, type FinancialPlan } from '../../data/plans';

export default function PlanScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();

  const scoredPlans = useMemo(
    () => scorePlans(data.motivationFocuses),
    [data.motivationFocuses],
  );
  const topPlans = useMemo(
    () => getTopPlans(data.motivationFocuses, 2),
    [data.motivationFocuses],
  );

  const recommendedId = scoredPlans[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState<string>(
    data.selectedPlanId || recommendedId,
  );
  const autoContinueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (autoContinueTimer.current) clearTimeout(autoContinueTimer.current);
  }, []);

  const handleSelect = useCallback((plan: FinancialPlan) => {
    setSelectedId(plan.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.speak(plan.title, { rate: 0.95 });
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedId) return;
    updateData({ selectedPlanId: selectedId });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/accessibility');
  }, [selectedId, updateData]);

  const handleVoiceSelectPlan = useCallback((index: number) => {
    const plan = topPlans[index];
    if (!plan) return;
    handleSelect(plan);
    if (autoContinueTimer.current) clearTimeout(autoContinueTimer.current);
    autoContinueTimer.current = setTimeout(() => {
      updateData({ selectedPlanId: plan.id });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/onboarding/accessibility');
    }, 1500);
  }, [topPlans, handleSelect, updateData]);

  // Build voice keywords from plan titles
  const voiceKeywords = useMemo(() => {
    const kw: Record<string, () => void> = {
      'first': () => handleVoiceSelectPlan(0),
      'one': () => handleVoiceSelectPlan(0),
      '1': () => handleVoiceSelectPlan(0),
      'second': () => handleVoiceSelectPlan(1),
      'two': () => handleVoiceSelectPlan(1),
      '2': () => handleVoiceSelectPlan(1),
    };
    // Add keywords from each plan's title words
    topPlans.forEach((plan, index) => {
      plan.title.toLowerCase().split(/\s+/).forEach((word) => {
        if (word.length > 2) {
          kw[word] = () => handleVoiceSelectPlan(index);
        }
      });
    });
    return kw;
  }, [topPlans, handleVoiceSelectPlan]);

  const { isListening, transcript, startListening } = useVoiceOnboarding({
    instruction: `Choose a plan. Say 'first' for ${topPlans[0]?.title}, or 'second' for ${topPlans[1]?.title}.`,
    keywords: voiceKeywords,
    enabled: true,
  });

  const monoFont = theme.fontsLoaded
    ? theme.fonts.monospace
    : theme.fonts.monospaceFallback;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.base.background }]}
    >
      <View style={styles.inner}>
        <OnboardingProgress currentStep={6} totalSteps={9} />

        <Text
          style={[
            styles.title,
            {
              color: theme.colors.base.textPrimary,
              fontFamily: theme.fontsLoaded ? theme.fonts.heading : undefined,
            },
          ]}
          accessibilityRole="header"
        >
          Recommended Plans
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.base.textSecondary }]}
        >
          Based on your goals, we suggest these two:
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {topPlans.map((plan) => {
            const isSelected = selectedId === plan.id;
            const isRecommended = plan.id === recommendedId;

            return (
              <Pressable
                key={plan.id}
                style={[
                  styles.terminalCard,
                  {
                    backgroundColor: theme.colors.base.surface,
                    borderRadius: theme.radius.terminal,
                    borderColor: isSelected
                      ? theme.colors.interactive.primary
                      : theme.colors.base.border,
                  },
                  isSelected && theme.shadows.md,
                ]}
                onPress={() => handleSelect(plan)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${plan.title}. ${plan.description}${isRecommended ? '. Recommended' : ''}`}
              >
                {/* Terminal header bar */}
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
                      styles.terminalTitle,
                      {
                        color: theme.colors.base.terminalText,
                        fontFamily: monoFont,
                      },
                    ]}
                  >
                    {isRecommended ? '* ' : '  '}
                    {plan.title}
                  </Text>
                </View>

                {/* Card body */}
                <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
                  {isRecommended && (
                    <View
                      style={[
                        styles.recommendedBadge,
                        {
                          backgroundColor: theme.colors.petStates.happy.light,
                          borderRadius: theme.radius.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.recommendedText,
                          {
                            color: theme.colors.petStates.happy.dark,
                            fontFamily: monoFont,
                          },
                        ]}
                      >
                        * RECOMMENDED
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.planDesc,
                      { color: theme.colors.base.textSecondary },
                    ]}
                  >
                    {plan.description}
                  </Text>

                  {/* Terminal-style category list */}
                  <View
                    style={[
                      styles.categoryTerminal,
                      {
                        backgroundColor: theme.colors.base.terminal,
                        borderRadius: theme.radius.sm,
                        padding: theme.spacing.md,
                      },
                    ]}
                  >
                    {plan.categories.map((cat) => (
                      <Text
                        key={cat.id}
                        style={[
                          styles.catLine,
                          {
                            color: theme.colors.base.terminalText,
                            fontFamily: monoFont,
                          },
                        ]}
                      >
                        {`[${cat.icon.padEnd(4).slice(0, 4)}] ${cat.name.padEnd(12).slice(0, 12)} ${String(cat.weeklyLimitPercent).padStart(3)}%`}
                      </Text>
                    ))}
                  </View>

                  {/* Selection indicator */}
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedIndicator,
                        {
                          backgroundColor: theme.colors.interactive.primary,
                          borderRadius: theme.radius.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectedText,
                          {
                            color: theme.colors.interactive.primaryText,
                            fontFamily: monoFont,
                          },
                        ]}
                      >
                        SELECTED
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

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
              minHeight: theme.components.button.primary.minHeight,
            },
            !selectedId && {
              backgroundColor: theme.colors.interactive.disabled,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedId}
          accessibilityRole="button"
          accessibilityLabel="Continue with selected plan"
        >
          <Text
            style={[
              styles.ctaText,
              {
                color: selectedId
                  ? theme.colors.interactive.primaryText
                  : theme.colors.interactive.disabledText,
                fontFamily: theme.fontsLoaded ? theme.fonts.headingMedium : undefined,
              },
            ]}
          >
            Continue
          </Text>
        </Pressable>
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
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 16,
    paddingVertical: 8,
  },
  terminalCard: {
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
  terminalTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryTerminal: {
    gap: 2,
  },
  catLine: {
    fontSize: 13,
    lineHeight: 22,
  },
  selectedIndicator: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
});
