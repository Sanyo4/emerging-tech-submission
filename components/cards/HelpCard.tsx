// Help / command reference card — renders inside DynamicContentArea, data via props
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface HelpCardProps {
  data: {
    commands: string[];
  };
}

export default function HelpCard({ data }: HelpCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  return (
    <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
        {'── What You Can Say ──'}
      </Text>

      {data.commands.map((cmd, i) => (
        <Text
          key={i}
          style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 24 * fs }}
        >
          {`> "${cmd}"`}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16 },
  termHeader: { textAlign: 'center', marginBottom: 12 },
});
