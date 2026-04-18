// Reusable mic button for voice onboarding screens — tap alternative to shake
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '../theme';

interface VoiceMicButtonProps {
  onPress: () => void;
  isListening: boolean;
  transcript?: string;
  disabled?: boolean;
}

const MIC_SIZE = 56;

export default function VoiceMicButton({ onPress, isListening, transcript, disabled }: VoiceMicButtonProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (isListening) {
      ringScale.value = withRepeat(
        withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1, false,
      );
      ringOpacity.value = withRepeat(
        withTiming(0, { duration: 1200, easing: Easing.in(Easing.ease) }),
        -1, false,
      );
    } else {
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
      ringScale.value = withTiming(1, { duration: 200 });
      ringOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isListening, ringScale, ringOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.micArea}>
        <Animated.View style={[styles.ring, ringStyle, { backgroundColor: theme.colors.interactive.primary + '40' }]} />
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Listening' : 'Shake to speak. Tap if needed.'}
          style={[
            styles.micButton,
            {
              backgroundColor: isListening
                ? theme.colors.interactive.primaryPressed
                : disabled
                  ? theme.colors.interactive.disabled
                  : theme.colors.interactive.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.micIcon,
              {
                color: theme.colors.interactive.primaryText,
                fontFamily: mono,
                fontSize: 12 * fs,
              },
            ]}
          >
            {isListening ? 'REC' : 'MIC'}
          </Text>
        </Pressable>
      </View>
      <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs, textAlign: 'center', minHeight: 18 }}>
        {isListening ? (transcript || 'listening...') : 'Shake to speak. Tap if needed.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  micArea: {
    width: MIC_SIZE * 1.8,
    height: MIC_SIZE * 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  micIcon: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
