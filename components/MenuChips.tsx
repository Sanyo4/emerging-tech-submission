// Suggestion chips — terminal-styled, tappable, voice-equivalent
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface SuggestionChipsProps {
  chips: string[];
  onChipPress: (text: string) => void;
  disabled?: boolean;
}

export default function SuggestionChips({ chips, onChipPress, disabled }: SuggestionChipsProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  return (
    <View style={styles.container}>
      {chips.map((chip) => (
        <Pressable
          key={chip}
          onPress={() => onChipPress(chip)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Say: ${chip}`}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: pressed
                ? theme.colors.base.terminal + 'CC'
                : theme.colors.base.terminal,
              borderColor: theme.colors.base.border,
              borderRadius: theme.radius.sm,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.base.terminalText,
              fontFamily: mono,
              fontSize: 13 * fs,
            }}
          >
            {chip}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
});
