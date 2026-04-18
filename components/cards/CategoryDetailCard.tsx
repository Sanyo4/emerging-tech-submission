import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';

export interface CategoryDetailCardData {
  category: {
    id: string;
    name: string;
    spent: number;
    weekly_limit: number;
  };
  transactions: Array<{
    id: number;
    amount: number;
    description: string;
    timestamp: string;
  }>;
  remaining: number;
  pct: number;
}

interface CategoryDetailCardProps {
  data: CategoryDetailCardData;
  onAdjustLimit?: (categoryId: string, delta: number) => Promise<void> | void;
}

export default function CategoryDetailCard({ data, onAdjustLimit }: CategoryDetailCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;
  const [isAdjusting, setIsAdjusting] = useState(false);

  const { category, transactions, remaining, pct } = data;

  const progressBar = () => {
    const filled = Math.min(Math.round((pct / 100) * 10), 10);
    const empty = 10 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  };

  const textStyle = {
    color: theme.colors.base.terminalText,
    fontFamily: mono,
    fontSize: 14 * fs,
    lineHeight: 22 * fs,
  };

  const handleAdjust = async (delta: number) => {
    if (!onAdjustLimit || isAdjusting) return;

    setIsAdjusting(true);
    try {
      await onAdjustLimit(category.id, delta);
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      {/* Category header */}
      <Text style={[textStyle, { fontSize: 18 * fs, textAlign: 'center', marginBottom: 8 }]}>
        {`── ${category.name} ──`}
      </Text>
      <Text style={textStyle}>
        {`> \u00A3${category.spent.toFixed(0)} / \u00A3${category.weekly_limit.toFixed(0)}  (${pct}%)`}
      </Text>

      {/* Progress bar */}
      <Text style={textStyle}>
        {`  ${progressBar()} ${remaining >= 0 ? `\u00A3${remaining.toFixed(0)} left` : `\u00A3${Math.abs(remaining).toFixed(0)} over!`}`}
      </Text>

      <Text style={[textStyle, { opacity: 0.7, marginTop: 4 }]}>
        {'> say "increase by 5" or "decrease by 5"'}
      </Text>

      {/* Separator */}
      <Text style={[textStyle, { opacity: 0.3, marginTop: 4, marginBottom: 8 }]}>
        {'────────────────────────────'}
      </Text>

      {onAdjustLimit && (
        <>
          <View style={styles.editRow}>
            <Text style={[textStyle, { opacity: 0.6 }]}>
              {`> limit: \u00A3${category.weekly_limit.toFixed(0)}`}
            </Text>
            <Pressable
              onPress={() => handleAdjust(-5)}
              disabled={isAdjusting}
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${category.name} limit by 5 pounds`}
              style={[styles.editBtn, {
                backgroundColor: theme.colors.interactive.secondary,
                borderRadius: theme.radius.sm,
                opacity: isAdjusting ? 0.6 : 1,
              }]}
            >
              <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14 * fs, fontWeight: '700' }}>
                [-]
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAdjust(5)}
              disabled={isAdjusting}
              accessibilityRole="button"
              accessibilityLabel={`Increase ${category.name} limit by 5 pounds`}
              style={[styles.editBtn, {
                backgroundColor: theme.colors.interactive.secondary,
                borderRadius: theme.radius.sm,
                opacity: isAdjusting ? 0.6 : 1,
              }]}
            >
              <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14 * fs, fontWeight: '700' }}>
                [+]
              </Text>
            </Pressable>
          </View>
          {isAdjusting && (
            <Text style={[textStyle, { opacity: 0.6 }]}>
              {'  updating limit...'}
            </Text>
          )}
        </>
      )}

      {/* Transactions */}
      {transactions.length > 0 ? (
        transactions.map((txn, i) => {
          const isLast = i === transactions.length - 1;
          const prefix = isLast ? '\u2514' : '\u251C';
          const desc = txn.description.length > 18
            ? txn.description.slice(0, 18) + '..'
            : txn.description;

          return (
            <Text key={txn.id} style={[textStyle, { opacity: 0.6 }]}>
              {`${prefix} \u00A3${txn.amount.toFixed(2).padStart(5)}  ${desc.padEnd(20)} ${formatDate(txn.timestamp)}`}
            </Text>
          );
        })
      ) : (
        <Text style={[textStyle, { opacity: 0.5 }]}>
          {'  no transactions this week'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
});
