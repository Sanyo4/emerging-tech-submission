// Inline game card — shows current game prompt, voice-driven via conversationContext
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface GameCardProps {
  gameType: 'needs_vs_wants' | 'bnpl';
  responseText: string;
}

export default function GameCard({ gameType, responseText }: GameCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const title = gameType === 'needs_vs_wants' ? 'Needs vs Wants' : 'BNPL Challenge';

  return (
    <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      <Text style={[styles.header, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 16 * fs }]}>
        {`── ${title} ──`}
      </Text>

      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {responseText}
      </Text>

      <Text style={[styles.separator, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs }]}>
        {'────────────────────────'}
      </Text>

      {gameType === 'needs_vs_wants' ? (
        <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs, lineHeight: 20 * fs, opacity: 0.7 }}>
          {'Say "need" or "want" to classify.'}
        </Text>
      ) : (
        <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs, lineHeight: 20 * fs, opacity: 0.7 }}>
          {'Say "buy now" or "pay later" to choose.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16 },
  header: { textAlign: 'center', marginBottom: 12 },
  separator: { opacity: 0.3, marginTop: 8, marginBottom: 4 },
});
