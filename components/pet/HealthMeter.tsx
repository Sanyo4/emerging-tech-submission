// Health meter — terminal-styled HP bar
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface HealthMeterProps {
  health: number;
  maxHealth?: number;
}

export default function HealthMeter({ health, maxHealth = 100 }: HealthMeterProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;
  const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const filled = Math.round((pct / 100) * 10);
  const empty = 10 - filled;

  const barColor =
    pct > 60
      ? theme.colors.petStates.happy.medium
      : pct > 30
        ? theme.colors.petStates.worried.medium
        : theme.colors.petStates.critical.medium;

  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);

  return (
    <View style={styles.container} accessibilityLabel={`Health: ${health} out of ${maxHealth}`}>
      <Text style={{ color: barColor, fontFamily: mono, fontSize: 13 * fs, lineHeight: 20 * fs }}>
        {`HP [${bar}] ${health}/${maxHealth}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 4,
  },
});
