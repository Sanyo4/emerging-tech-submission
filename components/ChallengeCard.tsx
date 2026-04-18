import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius, CategoryIcons } from '../constants/theme';

interface ChallengeCardProps {
  title: string;
  description: string;
  category: string;
  durationDays: number;
  xpReward: number;
  progress: number;
  completed: boolean;
}

export default function ChallengeCard({
  title,
  description,
  category,
  durationDays,
  xpReward,
  progress,
  completed,
}: ChallengeCardProps) {
  const progressPercent = Math.min((progress / durationDays) * 100, 100);
  const icon = CategoryIcons[category] ?? 'GOAL';

  const animatedWidth = useAnimatedStyle(() => ({
    width: withTiming(`${progressPercent}%`, { duration: 500 }),
  }));

  const cardLabel = completed
    ? `${title}, completed, earned ${xpReward} experience points`
    : `${title}, day ${Math.min(progress, durationDays)} of ${durationDays}, ${xpReward} experience points reward`;

  return (
    <View
      style={[styles.card, completed && styles.cardCompleted]}
      accessible={true}
      accessibilityLabel={cardLabel}
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon} importantForAccessibility="no">{icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, completed && styles.titleCompleted]}>
            {completed ? 'DONE ' : ''}{title}
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={[styles.xpBadge, completed && styles.xpBadgeCompleted]}>
          <Text style={styles.xpText}>+{xpReward} XP</Text>
        </View>
      </View>

      {!completed && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, animatedWidth]}
            />
          </View>
          <Text style={styles.progressText}>
            Day {Math.min(progress, durationDays)} of {durationDays}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconBadge: {
    minWidth: 40,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.menuBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: 2,
  },
  icon: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.6,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  titleCompleted: {
    color: Colors.textSecondary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  xpBadge: {
    backgroundColor: Colors.xpGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  xpBadgeCompleted: {
    backgroundColor: Colors.success,
  },
  xpText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
