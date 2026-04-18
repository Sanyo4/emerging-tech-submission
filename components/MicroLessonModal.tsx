// Quest Offer Modal — terminal-themed (replaces old lesson modal)
import { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, AccessibilityInfo, findNodeHandle, Platform } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import type { MicroLesson } from '../data/lessons';

interface MicroLessonModalProps {
  visible: boolean;
  lesson: MicroLesson | null | undefined;
  onAcceptChallenge: () => void;
  onDismiss: () => void;
  pendingAction?: 'accept' | 'dismiss' | null;
}

export default function MicroLessonModal({
  visible,
  lesson,
  onAcceptChallenge,
  onDismiss,
  pendingAction = null,
}: MicroLessonModalProps) {
  const theme = useTheme();
  const titleRef = useRef<Text>(null);
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (visible && lesson && titleRef.current) {
      const node = findNodeHandle(titleRef.current);
      if (node) {
        setTimeout(() => AccessibilityInfo.setAccessibilityFocus(node), 300);
      }
    }
  }, [visible, lesson]);

  if (!lesson) return null;

  const ct = lesson.challengeTemplate;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => { if (!pendingAction) onDismiss(); }}
    >
      <View style={styles.overlay}>
          <Animated.View
            entering={SlideInDown.springify().damping(15).stiffness(150)}
            style={[styles.modal, { backgroundColor: theme.colors.base.surface, borderTopLeftRadius: theme.radius.terminal, borderTopRightRadius: theme.radius.terminal }]}
          >
          {/* Terminal header bar */}
          <View style={[styles.terminalBar, { backgroundColor: theme.colors.base.terminal, borderTopLeftRadius: theme.radius.terminal - 2, borderTopRightRadius: theme.radius.terminal - 2 }]}>
            <View style={styles.terminalDots}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.dot, { backgroundColor: '#F5C842' }]} />
              <View style={[styles.dot, { backgroundColor: '#6BC5A0' }]} />
            </View>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, fontWeight: '700', flex: 1 }}>
              new_quest
            </Text>
          </View>

          {/* Terminal body */}
          <View style={[styles.terminalBody, { backgroundColor: theme.colors.base.terminal }]}>
            {/* Quest title */}
            <Text
              ref={titleRef}
              accessibilityRole="header"
              style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, fontWeight: '700', marginBottom: 8 }}
            >
              {'> '}{ct.title}
            </Text>

            {/* Quest description */}
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.8, marginBottom: 12 }}>
              {ct.description}
            </Text>

            {/* Why this matters — lesson insight */}
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.5, marginBottom: 4 }}>
              {'── why this matters ──'}
            </Text>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.7, marginBottom: 12 }}>
              {lesson.insight}
            </Text>

            {/* Quest details */}
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.5, marginBottom: 4 }}>
              {'── quest details ──'}
            </Text>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22 }}>
              {`Duration: ${ct.duration_days} day${ct.duration_days !== 1 ? 's' : ''}`}
            </Text>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
              {`Reward:   +${ct.xp_reward} care points`}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.acceptBtn,
                {
                  backgroundColor: pressed ? theme.colors.interactive.primaryPressed : theme.colors.interactive.primary,
                  borderRadius: theme.radius.xl,
                },
              ]}
              onPress={onAcceptChallenge}
              disabled={Boolean(pendingAction)}
              accessibilityRole="button"
              accessibilityLabel={`Accept quest: ${ct.title}, ${ct.duration_days} days for ${ct.xp_reward} care points`}
            >
              <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                {pendingAction === 'accept' ? 'Accepting...' : 'Accept Quest'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.dismissBtn,
                {
                  backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary,
                  borderRadius: theme.radius.xl,
                },
              ]}
              onPress={onDismiss}
              disabled={Boolean(pendingAction)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss quest"
            >
              <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14, fontWeight: '600' }}>
                {pendingAction === 'dismiss' ? 'Closing...' : 'Maybe Later'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    overflow: 'hidden',
    maxHeight: '85%',
  },
  terminalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    paddingHorizontal: 16,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalBody: {
    padding: 16,
  },
  buttons: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  acceptBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  dismissBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
});
