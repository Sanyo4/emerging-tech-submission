import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface BudgetOverviewCardProps {
  data: {
    categories: Array<{
      id: string;
      name: string;
      spent: number;
      limit: number;
      remaining: number;
      pct: number;
      status: 'ok' | 'tight' | 'over';
    }>;
    totalSpent: number;
    totalLimit: number;
    totalRemaining: number;
    overallPercent: number;
  };
}

export default function BudgetOverviewCard({ data }: BudgetOverviewCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const { categories, totalSpent, totalLimit, totalRemaining, overallPercent } = data;

  const getStatusIndicator = (status: 'ok' | 'tight' | 'over') => {
    switch (status) {
      case 'over':
        return ' !!!';
      case 'tight':
        return ' !!';
      default:
        return ' [ok]';
    }
  };

  const summaryBar = () => {
    const filled = Math.min(Math.round((overallPercent / 100) * 10), 10);
    const empty = 10 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  const textStyle = {
    color: theme.colors.base.terminalText,
    fontFamily: mono,
    fontSize: 14 * fs,
    lineHeight: 22 * fs,
  };

  if (categories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
        <View style={styles.emptyState}>
          <Text style={[textStyle, { textAlign: 'center' }]}>
            {'No budget set up yet!'}
          </Text>
          <Text style={[textStyle, { textAlign: 'center', opacity: 0.7, marginTop: 12 }]}>
            {'Head to the home screen and\ntell Buddy about your spending.'}
          </Text>
          <Text style={[textStyle, { textAlign: 'center', opacity: 0.5, marginTop: 12 }]}>
            {'> hint: try "I have 50 a week\n  for food and 20 for coffee"'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      {/* Summary bar */}
      <Text style={textStyle}>
        {`${summaryBar()} ${overallPercent}% used`}
      </Text>
      <Text style={[textStyle, { opacity: 0.7 }]}>
        {totalRemaining >= 0
          ? `\u00A3${totalRemaining.toFixed(0)} remaining this week`
          : `\u00A3${Math.abs(totalRemaining).toFixed(0)} over budget!`}
      </Text>

      {/* Separator */}
      <Text style={[textStyle, { opacity: 0.3, marginTop: 4, marginBottom: 8 }]}>
        {'────────────────────────────'}
      </Text>

      {/* Table header */}
      <Text style={textStyle}>
        {'CATEGORY      SPENT    LEFT'}
      </Text>
      <Text style={[textStyle, { opacity: 0.4 }]}>
        {'──────────    ─────    ────'}
      </Text>

      {/* Category rows */}
      {categories.map((cat) => {
        const name = cat.name.padEnd(14).slice(0, 14);
        const spentStr = `\u00A3${cat.spent.toFixed(0)}`.padStart(5);
        const leftStr = cat.remaining >= 0
          ? `\u00A3${cat.remaining.toFixed(0)}`.padStart(5)
          : `-\u00A3${Math.abs(cat.remaining).toFixed(0)}`.padStart(5);
        const status = getStatusIndicator(cat.status);

        return (
          <Text key={cat.id} style={textStyle}>
            {`> ${name}${spentStr}  ${leftStr}${status}`}
          </Text>
        );
      })}

      {/* Total row */}
      <Text style={[textStyle, { opacity: 0.4, marginTop: 4 }]}>
        {'──────────    ─────    ────'}
      </Text>
      <Text style={[textStyle, { fontWeight: '700' }]}>
        {`${'TOTAL'.padEnd(14)}${`\u00A3${totalSpent.toFixed(0)}`.padStart(5)}  ${(totalRemaining >= 0 ? `\u00A3${totalRemaining.toFixed(0)}` : `-\u00A3${Math.abs(totalRemaining).toFixed(0)}`).padStart(5)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyState: {
    paddingVertical: 24,
  },
});
