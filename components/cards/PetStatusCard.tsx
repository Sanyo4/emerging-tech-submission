// Pet Status card — renders inside DynamicContentArea, data via props
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface PetStatusCardProps {
  data: {
    petName: string;
    mood: string;
    health: number;
    tier: string;
    streak: number;
  };
}

const MOOD_LABELS: Record<string, string> = {
  thriving: 'Thriving',
  happy: 'Happy',
  neutral: 'Neutral',
  worried: 'Worried',
  critical: 'Critical',
};

const MOOD_SYMBOLS: Record<string, string> = {
  thriving: '*',
  happy: ':)',
  neutral: '.',
  worried: ':(',
  critical: 'x',
};

export default function PetStatusCard({ data }: PetStatusCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const healthFilled = Math.min(Math.round((data.health / 100) * 10), 10);
  const healthEmpty = 10 - healthFilled;

  const moodLabel = MOOD_LABELS[data.mood] ?? 'Neutral';
  const moodSymbol = MOOD_SYMBOLS[data.mood] ?? '.';

  return (
    <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
        {`── ${data.petName} Status ──`}
      </Text>

      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`Mood: ${moodSymbol}  ${moodLabel}`}
      </Text>

      <Text
        style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}
        accessibilityLabel={`Health: ${data.health} out of 100`}
      >
        {`Health ${'[' + '#'.repeat(healthFilled) + '.'.repeat(healthEmpty) + ']'} ${data.health}/100`}
      </Text>

      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`Streak: ${data.streak} day${data.streak !== 1 ? 's' : ''}`}
      </Text>

      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`Stage: ${data.tier}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16 },
  termHeader: { textAlign: 'center', marginBottom: 12 },
});
