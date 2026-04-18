import { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { announceForScreenReader, getAccessibleTimeout } from '../utils/accessibility';
import { playSuccessHaptic } from '../services/haptics';

export type BannerType = 'success' | 'warning' | 'info' | 'error';

interface ConfirmationBannerProps {
  message: string;
  type: BannerType;
  visible: boolean;
  onDismiss: () => void;
}

const BORDER_COLORS: Record<BannerType, string> = {
  success: Colors.success,
  warning: Colors.warning,
  info: Colors.primary,
  error: Colors.danger,
};

const BG_COLORS: Record<BannerType, string> = {
  success: Colors.successLight,
  warning: Colors.warningLight,
  info: Colors.aiBubble,
  error: Colors.dangerLight,
};

export default function ConfirmationBanner({
  message,
  type,
  visible,
  onDismiss,
}: ConfirmationBannerProps) {
  useEffect(() => {
    if (!visible) return;

    announceForScreenReader(message);
    playSuccessHaptic();

    let timer: ReturnType<typeof setTimeout>;
    getAccessibleTimeout(8000).then((timeout) => {
      timer = setTimeout(onDismiss, timeout);
    });
    return () => clearTimeout(timer);
  }, [visible, message, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOut.duration(200)}
      accessibilityLiveRegion="polite"
    >
      <TouchableOpacity
        style={[
          styles.container,
          { borderLeftColor: BORDER_COLORS[type], backgroundColor: BG_COLORS[type] },
        ]}
        onPress={onDismiss}
        activeOpacity={0.8}
        accessibilityRole="alert"
        accessibilityHint="Double tap to dismiss"
      >
        <Text style={styles.message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  message: {
    fontSize: FontSize.lg,
    color: Colors.text,
    lineHeight: 20,
  },
});
