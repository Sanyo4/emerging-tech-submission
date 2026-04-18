// Buy Now Pay Later — interactive scenario coaching game
import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useTheme } from '../../theme';
import { markGameCompleted, updatePetHealth } from '../../services/database';

interface BNPLGameProps {
  visible: boolean;
  onComplete: (carePointsEarned: number) => void;
  onDismiss: () => void;
  /** When true, completion skips DB writes (markGameCompleted + updatePetHealth).
   *  Used by the Demo page so judges can replay without mutating real state. */
  demoMode?: boolean;
}

type Phase = 'intro' | 'choice' | 'reveal' | 'done';

export default function BNPLGame({ visible, onComplete, onDismiss, demoMode = false }: BNPLGameProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const [phase, setPhase] = useState<Phase>('intro');
  const [userChoice, setUserChoice] = useState<'buy' | 'bnpl' | null>(null);

  const ITEM_PRICE = 30;
  const INSTALLMENT_AMOUNT = 12;
  const INSTALLMENTS = 3;
  const BNPL_TOTAL = INSTALLMENT_AMOUNT * INSTALLMENTS; // £36
  const HIDDEN_FEE = BNPL_TOTAL - ITEM_PRICE; // £6

  const startGame = () => {
    Speech.speak('Your pet found some installment payments in your spending. Let me show you how Buy Now Pay Later really works.', { rate: 0.95 });
    setPhase('choice');
  };

  const handleChoice = (choice: 'buy' | 'bnpl') => {
    setUserChoice(choice);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('reveal');
    if (choice === 'bnpl') {
      setTimeout(() => {
        Speech.speak('Surprise! The installments add up to more than the price. Those hidden fees add up fast.', { rate: 0.95 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 500);
    } else {
      setTimeout(() => {
        Speech.speak('Smart choice! Paying upfront means no hidden fees or interest.', { rate: 0.95 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);
    }
  };

  const finishGame = async () => {
    const points = userChoice === 'buy' ? 15 : 10;
    if (!demoMode) {
      await markGameCompleted('bnpl');
      await updatePetHealth(points);
    }
    onComplete(points);
  };

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
              bnpl_challenge
            </Text>
          </View>

          <View style={[styles.body, { backgroundColor: theme.colors.base.terminal }]}>
            {phase === 'intro' && (
              <>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  {'> Your pet found something interesting...'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.8 }}>
                  {'It looks like a small payment now,\nbut it might grow bigger.\nLet\'s see what it really costs.'}
                </Text>
                <Pressable
                  onPress={startGame}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.xl, marginTop: 16 }]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                    Show me
                  </Text>
                </Pressable>
              </>
            )}

            {phase === 'choice' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, marginBottom: 4 }}>
                  {'> You have \u00A360 for the week.'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                  {'> You want a new gadget for \u00A330.'}
                </Text>

                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13, opacity: 0.5, marginBottom: 8 }}>
                  {'How would you pay?'}
                </Text>

                <Pressable
                  onPress={() => handleChoice('buy')}
                  style={[styles.choiceBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.xl }]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 14, fontWeight: '700' }}>
                    {'A: Buy now for \u00A330'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleChoice('bnpl')}
                  style={[styles.choiceBtn, { backgroundColor: theme.colors.interactive.secondary, borderRadius: theme.radius.xl, marginTop: 10 }]}
                >
                  <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14, fontWeight: '700' }}>
                    {`B: BNPL — ${INSTALLMENTS}x \u00A3${INSTALLMENT_AMOUNT}`}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {phase === 'reveal' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.5, marginBottom: 8 }}>
                  {'── the real cost ──'}
                </Text>

                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 24 }}>
                  {`Buy now:    \u00A3${ITEM_PRICE}`}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 24 }}>
                  {`BNPL total: \u00A3${BNPL_TOTAL}`}
                </Text>
                <Text style={{ color: theme.colors.petStates.critical.medium, fontFamily: mono, fontSize: 14, lineHeight: 24, fontWeight: '700' }}>
                  {`Hidden fees: \u00A3${HIDDEN_FEE}!`}
                </Text>

                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.7, marginTop: 12 }}>
                  {userChoice === 'bnpl'
                    ? 'Those small installments add up.\nYou\'d pay \u00A36 extra for the same thing.'
                    : 'Smart! Paying upfront means no\nhidden fees or surprise charges.'}
                </Text>

                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.5, marginTop: 12 }}>
                  {`+${userChoice === 'buy' ? 15 : 10} care points earned!`}
                </Text>

                <Pressable
                  onPress={() => setPhase('done')}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.xl, marginTop: 16 }]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                    Got it!
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {phase === 'done' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                  {'Lesson learned!'}
                </Text>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.7, textAlign: 'center', marginTop: 8 }}>
                  {'Always check the total cost\nbefore choosing installments.'}
                </Text>
                <Pressable
                  onPress={finishGame}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.xl, marginTop: 16 }]}
                >
                  <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                    Done
                  </Text>
                </Pressable>
              </Animated.View>
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
  actionBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  choiceBtn: { paddingVertical: 12, alignItems: 'center', minHeight: 44 },
});
