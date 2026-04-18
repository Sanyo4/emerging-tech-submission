import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, CategoryIcons } from '../constants/theme';
import type { BudgetSuggestion } from '../services/budgetPlanner';

interface BudgetPlanCardProps {
  suggestion: BudgetSuggestion;
  onApply: (categoryId: string, newLimit: number) => void;
}

export default function BudgetPlanCard({ suggestion, onApply }: BudgetPlanCardProps) {
  const [adjustedLimit, setAdjustedLimit] = useState(suggestion.suggestedLimit);
  const icon = CategoryIcons[suggestion.categoryId] ?? suggestion.categoryIcon;

  const statusColor = suggestion.status === 'increase'
    ? Colors.warning
    : suggestion.status === 'decrease'
      ? Colors.success
      : Colors.primary;

  const statusLabel = suggestion.status === 'increase'
    ? 'Increase'
    : suggestion.status === 'decrease'
      ? 'Tighten'
      : 'Keep';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon} importantForAccessibility="no">{icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.categoryName}>{suggestion.categoryName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.limitsRow}>
        <View style={styles.limitBox}>
          <Text style={styles.limitLabel}>Current</Text>
          <Text style={styles.limitValue}>£{suggestion.currentLimit.toFixed(0)}/wk</Text>
        </View>
        <Text style={styles.arrow} importantForAccessibility="no">→</Text>
        <View style={styles.limitBox}>
          <Text style={styles.limitLabel}>Suggested</Text>
          <Text style={[styles.limitValue, styles.suggestedValue]}>£{adjustedLimit.toFixed(0)}/wk</Text>
        </View>
      </View>

      {suggestion.status !== 'keep' && (
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setAdjustedLimit((v) => Math.max(v - 5, 5))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${suggestion.categoryName} limit by 5 pounds`}
          >
            <Text style={styles.stepperText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue} accessibilityLiveRegion="polite">
            £{adjustedLimit.toFixed(0)}
          </Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setAdjustedLimit((v) => v + 5)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${suggestion.categoryName} limit by 5 pounds`}
          >
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.reasoning}>{suggestion.reasoning}</Text>

      {suggestion.status !== 'keep' && (
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => onApply(suggestion.categoryId, adjustedLimit)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Apply ${adjustedLimit} pound limit for ${suggestion.categoryName}`}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBadge: {
    minWidth: 42,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.menuBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  icon: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.6,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  limitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  limitBox: {
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  limitValue: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  suggestedValue: {
    color: Colors.primary,
  },
  arrow: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  stepperValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  reasoning: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
