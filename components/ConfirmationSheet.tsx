// Transaction confirmation sheet — editable, terminal-themed
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import type { PendingTransaction } from '../services/ai';

export type { PendingTransaction } from '../services/ai';

interface CategoryOption {
  id: string;
  name: string;
}

interface ConfirmationSheetProps {
  visible: boolean;
  transaction: PendingTransaction | null;
  categories: CategoryOption[];
  onConfirm: (edited: PendingTransaction) => void;
  onCancel: () => void;
}

export default function ConfirmationSheet({
  visible,
  transaction,
  categories,
  onConfirm,
  onCancel,
}: ConfirmationSheetProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

  // Sync local state when transaction changes
  useEffect(() => {
    if (transaction) {
      setEditAmount(transaction.amount.toFixed(2));
      setEditDesc(transaction.description);
      setEditCatId(transaction.category);
      setShowCatPicker(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const selectedCat = categories.find(c => c.id === editCatId);
  const catName = selectedCat?.name || transaction.categoryName;
  const parsedAmount = parseFloat(editAmount) || 0;
  const newSpent = transaction.budgetSpent + parsedAmount;
  const budgetLimit = transaction.budgetLimit;
  const pct = budgetLimit > 0 ? Math.round((newSpent / budgetLimit) * 100) : 0;

  const handleConfirm = () => {
    onConfirm({
      ...transaction,
      amount: parsedAmount,
      description: editDesc.trim() || transaction.description,
      category: editCatId,
      categoryName: catName,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(150)}
          style={[styles.sheet, { backgroundColor: theme.colors.base.surface, borderTopLeftRadius: theme.radius.terminal, borderTopRightRadius: theme.radius.terminal }]}
        >
          {/* Terminal header */}
          <View style={[styles.termBar, { backgroundColor: theme.colors.base.terminal, borderTopLeftRadius: theme.radius.terminal - 2, borderTopRightRadius: theme.radius.terminal - 2 }]}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.dot, { backgroundColor: '#F5C842' }]} />
              <View style={[styles.dot, { backgroundColor: '#6BC5A0' }]} />
            </View>
            <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, fontWeight: '700', flex: 1 }}>
              confirm_transaction
            </Text>
          </View>

          {/* Editable terminal body */}
          <View style={[styles.termBody, { backgroundColor: theme.colors.base.terminal }]}>
            {/* Amount */}
            <View style={styles.fieldRow}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.6 }}>
                {'> amount: \u00A3'}
              </Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16, borderBottomColor: theme.colors.base.terminalText }]}
                accessibilityLabel="Edit amount"
                selectTextOnFocus
              />
            </View>

            {/* Description */}
            <View style={styles.fieldRow}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.6 }}>
                {'> what: '}
              </Text>
              <TextInput
                value={editDesc}
                onChangeText={setEditDesc}
                style={[styles.input, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, borderBottomColor: theme.colors.base.terminalText, flex: 1 }]}
                accessibilityLabel="Edit description"
              />
            </View>

            {/* Category — tap to change */}
            <Pressable onPress={() => setShowCatPicker(!showCatPicker)} style={styles.fieldRow}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, opacity: 0.6 }}>
                {'> category: '}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textDecorationLine: 'underline' }}>
                {catName}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12, opacity: 0.4, marginLeft: 8 }}>
                {'[tap to change]'}
              </Text>
            </Pressable>

            {/* Category picker */}
            {showCatPicker && (
              <ScrollView style={styles.catPicker} horizontal={false} nestedScrollEnabled>
                {categories.map(cat => (
                  <Pressable
                    key={cat.id}
                    onPress={() => { setEditCatId(cat.id); setShowCatPicker(false); }}
                    style={[styles.catOption, {
                      backgroundColor: cat.id === editCatId ? theme.colors.interactive.primary : 'transparent',
                      borderRadius: theme.radius.sm,
                    }]}
                  >
                    <Text style={{
                      color: cat.id === editCatId ? theme.colors.interactive.primaryText : theme.colors.base.terminalText,
                      fontFamily: mono, fontSize: 13,
                    }}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Budget impact */}
            {budgetLimit > 0 && (
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, lineHeight: 22, opacity: 0.5, marginTop: 8 }}>
                {`> impact: \u00A3${newSpent.toFixed(0)}/\u00A3${budgetLimit.toFixed(0)} (${pct}%)`}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm transaction"
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: pressed ? theme.colors.interactive.primaryPressed : theme.colors.interactive.primary,
                  borderRadius: theme.radius.xl,
                },
              ]}
            >
              <Text style={{ color: theme.colors.interactive.primaryText, fontFamily: mono, fontSize: 16, fontWeight: '700' }}>
                CONFIRM
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel transaction"
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary,
                  borderRadius: theme.radius.xl,
                },
              ]}
            >
              <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14, fontWeight: '600' }}>
                CANCEL
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    overflow: 'hidden',
  },
  termBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  termBody: {
    padding: 16,
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  catPicker: {
    maxHeight: 120,
    marginLeft: 16,
  },
  catOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  buttons: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  confirmBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
});
