// Brief 02 — Terminal panel component rendering ASCII pet art
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme, type PetMood } from '../../theme';
import { getPetArt } from '../../assets/pet';
import HealthMeter from './HealthMeter';

interface PetTerminalProps {
  petState: PetMood;
  petName: string;
  /** Compact mode for non-home screens (smaller font, fewer lines) */
  compact?: boolean;
  /** Pet health points (0-100) for the health meter */
  healthPoints?: number;
}

/** Accessibility labels per state (Brief 02) */
const STATE_DESCRIPTIONS: Record<PetMood, (name: string) => string> = {
  thriving: (n) => `${n} is thriving! They look very happy, bouncing with sparkles around them.`,
  happy: (n) => `${n} is happy. They have a gentle smile and look content.`,
  neutral: (n) => `${n} is feeling okay. They look calm but not excited.`,
  worried: (n) => `${n} is worried. They look concerned, with a small frown.`,
  critical: (n) => `${n} is not doing well. They look distressed and need your attention.`,
};

export default function PetTerminal({ petState, petName, compact = false, healthPoints }: PetTerminalProps) {
  const theme = useTheme();
  const stateColor = theme.colors.petStates[petState];
  const artLines = useMemo(() => {
    const lines = getPetArt(petState);
    if (compact) {
      // In compact mode, show middle ~5 lines (the core character)
      const start = Math.max(0, Math.floor(lines.length / 2) - 2);
      return lines.slice(start, start + 5);
    }
    return lines;
  }, [petState, compact]);

  const monoFont = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fontSize = compact ? theme.typeScale.terminalSmall : theme.typeScale.terminal;
  const reducedMotion = theme.accessibility.reducedMotion;

  const stateLabel = theme.colors.petStates[petState].label;

  return (
    <View
      style={[
        styles.outerCard,
        {
          backgroundColor: theme.colors.base.surface,
          borderRadius: theme.radius.terminal,
          borderColor: stateColor.light,
        },
        theme.shadows.md,
      ]}
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={STATE_DESCRIPTIONS[petState](petName)}
        style={[
          styles.terminal,
          {
            backgroundColor: theme.colors.base.terminal,
            borderRadius: theme.radius.terminal - 2,
            padding: compact ? theme.spacing.sm : theme.spacing.lg,
          },
        ]}
      >
        {reducedMotion ? (
          <View>
            {artLines.map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.artLine,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                    fontSize,
                    lineHeight: fontSize * theme.lineHeight.relaxed,
                  },
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} key={petState}>
            {artLines.map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.artLine,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                    fontSize,
                    lineHeight: fontSize * theme.lineHeight.relaxed,
                  },
                ]}
              >
                {line}
              </Text>
            ))}
          </Animated.View>
        )}

        {healthPoints != null && (
          <HealthMeter health={healthPoints} />
        )}

        {!compact && (
          <Text
            style={[
              styles.nameLabel,
              {
                color: theme.colors.base.terminalText,
                fontFamily: monoFont,
                fontSize: theme.typeScale.terminalSmall,
              },
            ]}
          >
            {`── ${petName} is ${stateLabel.toLowerCase()}! ──`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCard: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  terminal: {
    alignItems: 'center',
  },
  artLine: {
    textAlign: 'center',
  },
  nameLabel: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
});
