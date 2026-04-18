import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useTheme } from '../theme';

interface NumPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  showDecimal?: boolean;
  disabled?: boolean;
  currentLength?: number;
  maxLength?: number;
}

const BUTTON_SIZE = 72;

export default function NumPad({
  onDigit,
  onDelete,
  showDecimal = false,
  disabled = false,
  currentLength,
  maxLength,
}: NumPadProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospaceBold : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const handlePress = (value: string) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentLength !== undefined && maxLength !== undefined) {
      Speech.speak(`${currentLength + 1} of ${maxLength}`, { rate: 1.2 });
    }
    onDigit(value);
  };

  const handleDelete = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showDecimal ? '.' : '', '0', 'DEL'],
  ];

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap: theme.spacing.md }]}>
          {row.map((value) => {
            if (value === '') {
              return <View key={`empty-${rowIndex}`} style={styles.emptyButton} />;
            }
            if (value === 'DEL') {
              return (
                <Pressable
                  key="del"
                  style={({ pressed }) => [
                    styles.button,
                    {
                      borderRadius: theme.radius.lg,
                      backgroundColor: theme.colors.interactive.danger + '26',
                      borderColor: theme.colors.interactive.danger,
                    },
                    pressed && styles.buttonPressed,
                    disabled && styles.buttonDisabled,
                  ]}
                  onPress={handleDelete}
                  accessibilityRole="button"
                  accessibilityLabel="Delete"
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: theme.colors.interactive.dangerText,
                        fontFamily: mono,
                        fontSize: 15 * fs,
                      },
                    ]}
                  >
                    DEL
                  </Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={value}
                style={({ pressed }) => [
                  styles.button,
                  {
                    borderRadius: theme.radius.lg,
                    backgroundColor: theme.colors.base.surface,
                    borderColor: theme.colors.base.border,
                  },
                  pressed && styles.buttonPressed,
                  disabled && styles.buttonDisabled,
                ]}
                onPress={() => handlePress(value)}
                accessibilityRole="button"
                accessibilityLabel={value}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: theme.colors.base.textPrimary,
                      fontFamily: mono,
                      fontSize: 26 * fs,
                    },
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  emptyButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  buttonText: {
    fontWeight: '600',
  },
});
