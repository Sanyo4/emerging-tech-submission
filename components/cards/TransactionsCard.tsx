import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface TransactionsCardProps {
  data: {
    transactions: Array<{
      id: number;
      amount: number;
      description: string;
      category_id: string;
      timestamp: string;
    }>;
  };
}

export default function TransactionsCard({ data }: TransactionsCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const { transactions } = data;

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      {/* Header */}
      <Text style={[textStyle, { fontSize: 18 * fs, textAlign: 'center', marginBottom: 8 }]}>
        {'── Recent ──'}
      </Text>

      {/* Transaction list */}
      {transactions.length > 0 ? (
        transactions.map((txn) => {
          const desc = txn.description.length > 18
            ? txn.description.slice(0, 18) + '..'
            : txn.description;

          return (
            <Text key={txn.id} style={textStyle}>
              {`> \u00A3${txn.amount.toFixed(2).padStart(5)}  ${desc.padEnd(20)} ${formatDate(txn.timestamp)}`}
            </Text>
          );
        })
      ) : (
        <Text style={[textStyle, { opacity: 0.7 }]}>
          {'No transactions yet. Tell me what you spent!'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
