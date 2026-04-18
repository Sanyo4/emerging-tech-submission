import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { getXPForNextLevel, getLevelTitle } from '../utils/gamification';

interface LevelBadgeProps {
  level: number;
  xp: number;
  streakDays: number;
}

export default function LevelBadge({ level, xp, streakDays }: LevelBadgeProps) {
  const { current, needed, progress } = getXPForNextLevel(xp);
  const title = getLevelTitle(level);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.levelCircle}>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.xpText}>
            {current} / {needed} XP
          </Text>
        </View>
        {streakDays > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>RUN {streakDays}</Text>
          </View>
        )}
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.levelPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  xpText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  streakBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  streakText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.levelPurple,
    borderRadius: 3,
  },
});
