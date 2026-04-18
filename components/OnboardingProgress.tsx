import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  return (
    <View style={[styles.container, { paddingVertical: theme.spacing.sm }]} accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}>
      <View style={[styles.dots, { gap: theme.spacing.sm }]}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < currentStep
                    ? theme.colors.interactive.primary
                    : theme.colors.base.border,
              },
              i === currentStep - 1 && {
                width: 12,
                height: 12,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: theme.colors.petStates.neutral.dark,
              },
            ]}
          />
        ))}
      </View>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.base.textSecondary,
            fontFamily: mono,
            fontSize: theme.typeScale.caption,
          },
        ]}
      >
        {`Step ${currentStep} / ${totalSteps}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: '600',
  },
});
