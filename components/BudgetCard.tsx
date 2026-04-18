import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius, CategoryColors } from '../constants/theme';
import { getBudgetState, BUDGET_STATE_CONFIG } from '../utils/budgetState';
import { playFullBudgetFeedback } from '../services/audioFeedback';

interface BudgetCardProps {
  id: string;
  name: string;
  icon: string;
  spent: number;
  limit: number;
}

export default function BudgetCard({ id, name, icon, spent, limit }: BudgetCardProps) {
  const percentage = Math.min((spent / limit) * 100, 100);
  const pctRounded = Math.round(percentage);
  const exceeded = spent > limit;
  const nearLimit = spent > limit * 0.8;

  const barColor = exceeded
    ? Colors.danger
    : nearLimit
      ? Colors.warning
      : Colors.success;

  const categoryColor = CategoryColors[id] ?? { bg: '#F3F4F6', icon: '#374151' };

  const animatedWidth = useAnimatedStyle(() => ({
    width: withTiming(`${percentage}%`, { duration: 600 }),
  }));

  const budgetState = getBudgetState(spent, limit);
  const stateConfig = BUDGET_STATE_CONFIG[budgetState];
  const cardLabel = `${name} budget: ${stateConfig.emotion}. £${spent.toFixed(0)} of £${limit.toFixed(0)}, ${pctRounded} percent used`;

  return (
    <Pressable
      style={styles.card}
      onPress={() => playFullBudgetFeedback(budgetState, spent, limit)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={cardLabel}
      accessibilityHint="Double tap to hear budget status"
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor.bg }]}>
          <Text style={styles.icon} importantForAccessibility="no">{icon}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={styles.progressBar}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: pctRounded }}
        >
          <Animated.View
            style={[styles.progressFill, { backgroundColor: barColor }, animatedWidth]}
          />
        </View>
      </View>
      <Text style={[styles.amount, exceeded && styles.amountExceeded]}>
        £{spent.toFixed(0)} / £{limit.toFixed(0)}
        {exceeded && <Text importantForAccessibility="no"> [OVER]</Text>}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    minWidth: 44,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  progressContainer: {
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amountExceeded: {
    color: Colors.danger,
    fontWeight: '700',
  },
});
