import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface AIResponseProps {
  text: string;
  visible: boolean;
}

export default function AIResponse({ text, visible }: AIResponseProps) {
  if (!visible || !text) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>AI</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.aiBubble,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.6,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.aiBubble,
    borderRadius: BorderRadius.md,
    borderTopLeftRadius: BorderRadius.sm / 2,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.aiBubbleBorder,
  },
  text: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
});
