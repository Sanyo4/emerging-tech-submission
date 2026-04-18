import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import { useOnboarding } from '../../services/onboardingContext';
import { getPetArt } from '../../assets/pet';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useVoiceOnboarding } from '../../hooks/useVoiceOnboarding';
import VoiceMicButton from '../../components/VoiceMicButton';

export default function WelcomeScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [petName, setPetName] = useState(data.petName === 'Buddy' ? '' : data.petName);
  const hasAutoSubmitted = useRef(false);

  const eggLines = getPetArt('egg');
  const monoFont = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const headingFont = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;
  const canContinue = petName.trim().length > 0;

  const handleContinue = useCallback(() => {
    if (petName.trim().length === 0) return;
    updateData({ petName: petName.trim() });
    router.push('/onboarding/questions');
  }, [petName, updateData]);

  const { isListening, transcript, startListening } = useVoiceOnboarding({
    instruction: "Something's hatching! Give it a name. Shake your phone and say a name.",
    keywords: {
      '*': (text?: string) => {
        if (!text) return;
        const firstName = text.trim().split(/\s+/)[0];
        if (firstName && !hasAutoSubmitted.current) {
          hasAutoSubmitted.current = true;
          setPetName(firstName);
          // Auto-continue after a short delay so user sees the name appear
          setTimeout(() => {
            updateData({ petName: firstName });
            router.push('/onboarding/questions');
          }, 600);
        }
      },
    },
    enabled: true,
    autoSpeakInstruction: false,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Egg terminal panel */}
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
              accessibilityLabel="A mysterious egg sits in a terminal panel, waiting to be named"
              style={[
                styles.terminal,
                {
                  backgroundColor: theme.colors.base.terminal,
                  borderRadius: theme.radius.terminal - 2,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              {eggLines.map((line, i) => (
                <Text
                  key={i}
                  style={{
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                    fontSize: theme.typeScale.terminal,
                    lineHeight: theme.typeScale.terminal * theme.lineHeight.relaxed,
                    textAlign: 'center',
                  }}
                >
                  {line}
                </Text>
              ))}
            </View>
          </View>

          {/* Speech bubble */}
          <View style={{ marginTop: theme.spacing.md }}>
            <SpeechBubble
              message="Something's hatching! Give it a name. Shake your phone and say a name."
              onTTSDone={startListening}
            />
          </View>

          {/* Terminal-style name input */}
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: theme.colors.base.terminal,
                borderRadius: theme.radius.terminal,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            <View style={styles.promptRow}>
              <Text
                style={{
                  color: theme.colors.petStates.thriving.light,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminal,
                }}
              >
                {'> Name: '}
              </Text>
              <TextInput
                style={[
                  styles.terminalInput,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                    fontSize: theme.typeScale.terminal,
                  },
                ]}
                value={petName}
                onChangeText={setPetName}
                placeholder="_"
                placeholderTextColor={theme.colors.base.terminalText + '66'}
                autoFocus
                maxLength={16}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                accessibilityLabel="Pet name input"
                accessibilityRole="text"
                accessibilityHint="Type a name for your pet egg"
              />
            </View>
          </View>

          {/* Voice mic button */}
          <View style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
            <VoiceMicButton
              onPress={startListening}
              isListening={isListening}
              transcript={transcript}
            />
          </View>

          {/* Continue button */}
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.interactive.primary,
                borderRadius: theme.radius.xl,
                marginTop: theme.spacing.xl,
              },
              !canContinue && { backgroundColor: theme.colors.interactive.disabled },
              theme.shadows.md,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
            accessibilityState={{ disabled: !canContinue }}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: canContinue
                    ? theme.colors.interactive.primaryText
                    : theme.colors.interactive.disabledText,
                  fontFamily: headingFont,
                  fontSize: theme.typeScale.bodyLarge,
                },
              ]}
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
  inputCard: {
    overflow: 'hidden',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalInput: {
    flex: 1,
    padding: 0,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    fontWeight: '700',
  },
});
