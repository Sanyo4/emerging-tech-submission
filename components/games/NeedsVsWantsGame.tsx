// Needs vs Wants — swipe sorting coaching game
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, PanResponder, Animated as RNAnimated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useTheme } from '../../theme';
import { classifyCategory } from '../../data/needsVsWantsRules';
import { markGameCompleted, updatePetHealth } from '../../services/database';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category_id: string;
}

interface NeedsVsWantsGameProps {
  visible: boolean;
  transactions: Transaction[];
  onComplete: (carePointsEarned: number) => void;
  onDismiss: () => void;
  /** When true, completion skips DB writes (markGameCompleted + updatePetHealth).
   *  Used by the Demo page so judges can replay without mutating real state. */
  demoMode?: boolean;
}

export default function NeedsVsWantsGame({
  visible,
  transactions,
  onComplete,
  onDismiss,
  demoMode = false,
}: NeedsVsWantsGameProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const pan = useRef(new RNAnimated.ValueXY()).current;

  const items = transactions.filter(t => classifyCategory(t.category_id) !== 'unknown').slice(0, 5);
  const current = items[currentIndex];
  const isFinished = currentIndex >= items.length;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!current) return;

    const correct = classifyCategory(current.category_id);
    const userAnswer = direction === 'left' ? 'need' : 'want';

    if (userAnswer === correct) {
      setScore(s => s + 1);
      setFeedback('Correct!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Slide off screen
      RNAnimated.timing(pan, {
        toValue: { x: direction === 'left' ? -300 : 300, y: 0 },
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        setCurrentIndex(i => i + 1);
        setFeedback(null);
      });
    } else {
      setFeedback(`That's a ${correct}!`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Bounce back
      RNAnimated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => setFeedback(null), 800);
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) {
          handleSwipe('right');
        } else if (g.dx < -80) {
          handleSwipe('left');
        } else {
          RNAnimated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const startGame = () => {
    Speech.speak('Let me explain. A Need is something you must have, like food or transport. A Want is something nice to have but not essential. Swipe left for needs, right for wants.', { rate: 0.95 });
    setPhase('playing');
  };

  const finishGame = async () => {
    const points = Math.round((score / items.length) * 15);
    if (!demoMode) {
      await markGameCompleted('needs_vs_wants');
      await updatePetHealth(points);
    }
    onComplete(points);
  };

  useEffect(() => {
    if (visible && items.length === 0) {
      onDismiss();
    }
  }, [visible, items.length, onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.base.surface, borderRadius: theme.radius.terminal }]}>
          {/* Terminal header */}
          <View style={[styles.termBar, { backgroundColor: theme.colors.base.terminal, borderTopLeftRadius: theme.radius.terminal - 2, borderTopRightRadius: theme.radius.terminal - 2 }]}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.dot, { backgroundColor: '#F5C842' }]} />
              <View style={[styles.dot, { backgroundColor: '#6BC5A0' }]} />
            </View>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, fontWeight: '700', flex: 1 }}>
              needs_vs_wants
            </Text>
          </View>

          <View style={[styles.body, { backgroundColor: theme.colors.base.terminal }]}>
            {phase === 'intro' && (
              <>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  {'> Your pet found some spending to sort!'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.8 }}>
                  {'Some of these look like "Needs" and others look like "Wants". Can you sort them?'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.6, marginTop: 8 }}>
                  {'Swipe LEFT = Need\nSwipe RIGHT = Want'}
                </Text>
                <Pressable
                  onPress={startGame}
                  style={[styles.startBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.xl, marginTop: 16 }]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                    Let's sort!
                  </Text>
                </Pressable>
              </>
            )}

            {phase === 'playing' && !isFinished && current && (
              <>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13, opacity: 0.5, marginBottom: 8 }}>
                  {`${currentIndex + 1}/${items.length} | Score: ${score}`}
                </Text>

                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13, opacity: 0.5, textAlign: 'center', marginBottom: 4 }}>
                  {'<< NEED          WANT >>'}
                </Text>

                <RNAnimated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.base.surface, borderRadius: theme.radius.terminal, borderColor: theme.colors.base.border },
                    { transform: [{ translateX: pan.x }] },
                  ]}
                >
                  <Text style={{ color: theme.colors.base.textPrimary, fontFamily: mono, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                    {`\u00A3${current.amount.toFixed(2)}`}
                  </Text>
                  <Text style={{ color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
                    {current.description}
                  </Text>
                </RNAnimated.View>

                {feedback && (
                  <Text style={{ color: feedback === 'Correct!' ? theme.colors.petStates.happy.medium : theme.colors.petStates.critical.medium, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                    {feedback}
                  </Text>
                )}
              </>
            )}

            {(phase === 'playing' && isFinished) && (
              <>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  {'All sorted!'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', opacity: 0.7 }}>
                  {`Score: ${score}/${items.length}`}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', opacity: 0.7, marginTop: 4 }}>
                  {`+${Math.round((score / items.length) * 15)} care points earned!`}
                </Text>
                <Pressable
                  onPress={finishGame}
                  style={[styles.startBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.xl, marginTop: 16 }]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                    Done
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24 },
  container: { overflow: 'hidden' },
  termBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingHorizontal: 16 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  body: { padding: 20, minHeight: 280 },
  card: { padding: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  startBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48 },
});
