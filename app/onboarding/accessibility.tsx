import { useState, useCallback } from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { useVoiceOnboarding } from '../../hooks/useVoiceOnboarding';
import VoiceMicButton from '../../components/VoiceMicButton';
import { useTheme } from '../../theme';

interface AccessibilityPref {
  key: string;
  label: string;
  description: string;
}

const PREFS: AccessibilityPref[] = [
  {
    key: 'highContrast',
    label: 'High contrast mode',
    description: 'Increases colour contrast for better visibility',
  },
  {
    key: 'largerText',
    label: 'Larger text',
    description: 'Increases text size throughout the app',
  },
  {
    key: 'simplifiedLanguage',
    label: 'Simplified language',
    description: 'Uses plainer words and shorter sentences',
  },
  {
    key: 'reducedAnimations',
    label: 'Reduced animations',
    description: 'Minimises motion and transitions',
  },
];

export default function AccessibilityScreen() {
  const theme = useTheme();
  const { data } = useOnboarding();

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    highContrast: false,
    largerText: false,
    simplifiedLanguage: false,
    reducedAnimations: false,
  });

  const togglePref = useCallback((key: string) => {
    setPrefs((prev) => {
      const newValue = !prev[key];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const pref = PREFS.find((p) => p.key === key);
      if (pref) {
        Speech.speak(`${pref.label} ${newValue ? 'on' : 'off'}`, { rate: 1.0 });
      }

      // Apply to theme in real time so the user sees the effect
      if (key === 'highContrast') {
        theme.updateAccessibility({ highContrast: newValue });
      } else if (key === 'largerText') {
        theme.updateAccessibility({ textSize: newValue ? 'large' : 'medium' });
      } else if (key === 'simplifiedLanguage') {
        theme.updateAccessibility({ simplifiedLanguage: newValue });
      } else if (key === 'reducedAnimations') {
        theme.updateAccessibility({ reducedMotion: newValue });
      }

      return { ...prev, [key]: newValue };
    });
  }, [theme]);

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/pin-setup');
  }, []);

  const { isListening, transcript, startListening } = useVoiceOnboarding({
    instruction: "Accessibility settings. Say 'high contrast', 'larger text', 'simple language', or 'reduce motion' to toggle. Say 'continue' when done.",
    keywords: {
      'high contrast': () => togglePref('highContrast'),
      'contrast': () => togglePref('highContrast'),
      'larger text': () => togglePref('largerText'),
      'large text': () => togglePref('largerText'),
      'big text': () => togglePref('largerText'),
      'simple language': () => togglePref('simplifiedLanguage'),
      'simplified': () => togglePref('simplifiedLanguage'),
      'simple': () => togglePref('simplifiedLanguage'),
      'reduce motion': () => togglePref('reducedAnimations'),
      'reduce animations': () => togglePref('reducedAnimations'),
      'less motion': () => togglePref('reducedAnimations'),
      'continue': () => handleContinue(),
      'done': () => handleContinue(),
      'next': () => handleContinue(),
      'skip': () => handleContinue(),
    },
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
        <OnboardingProgress currentStep={7} totalSteps={9} />

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
          Accessibility
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.base.textSecondary }]}
        >
          Adjust these settings to suit your needs
        </Text>

        {/* Terminal-styled preferences panel */}
        <View
          style={[
            styles.terminalOuter,
            {
              backgroundColor: theme.colors.base.surface,
              borderRadius: theme.radius.terminal,
              borderColor: theme.colors.base.border,
            },
            theme.shadows.md,
          ]}
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
                styles.terminalTitleText,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                },
              ]}
            >
              accessibility.conf
            </Text>
          </View>

          {/* Preference toggles */}
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
            {PREFS.map((pref, index) => {
              const isOn = prefs[pref.key];

              return (
                <View key={pref.key}>
                  {index > 0 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.colors.base.border },
                      ]}
                    />
                  )}
                  <View style={styles.prefRow}>
                    <View style={styles.prefInfo}>
                      <Text
                        style={[
                          styles.prefLabel,
                          { color: theme.colors.base.textPrimary },
                        ]}
                      >
                        {pref.label}
                      </Text>
                      <Text
                        style={[
                          styles.prefDesc,
                          { color: theme.colors.base.textSecondary },
                        ]}
                      >
                        {pref.description}
                      </Text>
                    </View>
                    <View style={styles.toggleArea}>
                      <Text
                        style={[
                          styles.toggleLabel,
                          {
                            color: isOn
                              ? theme.colors.petStates.happy.dark
                              : theme.colors.base.textSecondary,
                            fontFamily: monoFont,
                          },
                        ]}
                      >
                        [{isOn ? 'ON' : 'OFF'}]
                      </Text>
                      <Switch
                        value={isOn}
                        onValueChange={() => togglePref(pref.key)}
                        trackColor={{
                          false: theme.colors.interactive.disabled,
                          true: theme.colors.interactive.primary,
                        }}
                        thumbColor={
                          isOn
                            ? theme.colors.interactive.primaryText
                            : theme.colors.base.surface
                        }
                        accessibilityLabel={`${pref.label}, currently ${isOn ? 'on' : 'off'}`}
                        accessibilityRole="switch"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.spacer} />

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
          ]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to PIN setup"
        >
          <Text
            style={[
              styles.ctaText,
              {
                color: theme.colors.interactive.primaryText,
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
  terminalOuter: {
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
  terminalTitleText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  prefInfo: {
    flex: 1,
    gap: 2,
  },
  prefLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  prefDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleArea: {
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  spacer: {
    flex: 1,
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
