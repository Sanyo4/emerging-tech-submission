// Mood History card — renders inside DynamicContentArea, data via props
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface MoodHistoryCardProps {
  data: {
    history: Array<{ day: string; state: string }>;
    avgMood: string;
    petName: string;
  };
}

const MOOD_SYMBOLS: Record<string, string> = {
  thriving: '*',
  happy: ':)',
  neutral: '.',
  worried: ':(',
  critical: 'x',
};

const MOOD_LABELS: Record<string, string> = {
  thriving: 'Thriving',
  happy: 'Happy',
  neutral: 'Neutral',
  worried: 'Worried',
  critical: 'Critical',
};

export default function MoodHistoryCard({ data }: MoodHistoryCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const hasData = data.history.length > 0;

  return (
    <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
        {`── ${data.petName}'s Journey ──`}
      </Text>

      {!hasData ? (
        <View>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.6, textAlign: 'center' }]}>
            {'Just getting started!'}
          </Text>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.4, textAlign: 'center' }]}>
            {'Log transactions to see'}
          </Text>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.4, textAlign: 'center' }]}>
            {'mood history.'}
          </Text>
        </View>
      ) : (
        <View>
          {/* Day-by-day timeline */}
          {data.history.map((entry) => {
            const symbol = MOOD_SYMBOLS[entry.state] ?? '.';
            const label = MOOD_LABELS[entry.state] ?? 'Neutral';
            return (
              <Text
                key={entry.day}
                style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs }]}
                accessibilityLabel={`${entry.day}: ${label}`}
              >
                {`${entry.day.padEnd(4)} ${symbol.padEnd(3)} ${label}`}
              </Text>
            );
          })}

          {/* Separator + average */}
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.4, marginTop: 8 }]}>
            {'─────────────────────'}
          </Text>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs }]}>
            {`This week: avg ${MOOD_LABELS[data.avgMood] ?? 'Neutral'}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16 },
  termHeader: { textAlign: 'center', marginBottom: 12 },
  termText: { lineHeight: 24 },
});
