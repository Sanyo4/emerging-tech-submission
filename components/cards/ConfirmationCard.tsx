// Inline transaction confirmation — voice-driven via conversationContext
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { PendingTransaction } from '../../services/ai';

interface ConfirmationCardProps {
  data: PendingTransaction;
  responseText: string;
}

export default function ConfirmationCard({ data, responseText }: ConfirmationCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const pct = data.budgetLimit > 0
    ? Math.round(((data.budgetSpent + data.amount) / data.budgetLimit) * 100)
    : 0;

  return (
    <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      <Text style={[styles.header, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16 * fs }]}>
        {'── Confirm Transaction ──'}
      </Text>

      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`> amount: \u00A3${data.amount.toFixed(2)}`}
      </Text>
      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`> what: ${data.description}`}
      </Text>
      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`> category: ${data.categoryName}`}
      </Text>

      {data.budgetLimit > 0 && (
        <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6, marginTop: 4 }}>
          {`> impact: ${pct}% of weekly budget`}
        </Text>
      )}

      <Text style={[styles.separator, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs }]}>
        {'────────────────────────'}
      </Text>

      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs, lineHeight: 20 * fs, opacity: 0.7 }}>
        {'Say "yes" to confirm, "no" to cancel,'}
      </Text>
      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs, lineHeight: 20 * fs, opacity: 0.7 }}>
        {'or "change amount to X" to edit.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16 },
  header: { textAlign: 'center', marginBottom: 12 },
  separator: { opacity: 0.3, marginTop: 8, marginBottom: 4 },
});
