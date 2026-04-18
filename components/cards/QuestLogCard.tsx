// Quest Log card — renders inside DynamicContentArea, data via props
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { calculateLevel, getLevelTitle, getXPForNextLevel } from '../../utils/gamification';

interface QuestLogCardProps {
  data: {
    active: Array<{
      id: number; title: string; description: string; progress: number;
      duration_days: number; xp_reward: number; type: string; category: string; created_at: string;
    }>;
    completed: Array<{ id: number; title: string; xp_reward: number }>;
    level: number;
    xp: number;
  };
}

export default function QuestLogCard({ data }: QuestLogCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const level = calculateLevel(data.xp);
  const levelTitle = getLevelTitle(level);
  const xpProgress = getXPForNextLevel(data.xp);
  const xpBarFilled = Math.min(Math.round(xpProgress.progress * 10), 10);
  const xpBarEmpty = 10 - xpBarFilled;

  const progressBar = (progress: number, total: number) => {
    const filled = Math.min(Math.round((progress / total) * 8), 8);
    const empty = 8 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  const getDaysLeft = (ch: QuestLogCardProps['data']['active'][number]) => {
    const deadline = new Date(new Date(ch.created_at).getTime() + ch.duration_days * 86400000);
    return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
  };

  const hasNoQuests = data.active.length === 0 && data.completed.length === 0;

  return (
    <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
        {'── Quest Log ──'}
      </Text>

      {/* Level / XP summary */}
      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
        {`Level ${level}: ${levelTitle}`}
      </Text>
      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.7 }}>
        {`XP ${'[' + '#'.repeat(xpBarFilled) + '.'.repeat(xpBarEmpty) + ']'} ${xpProgress.current}/${xpProgress.needed}`}
      </Text>
      {data.completed.length > 0 && (
        <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5 }}>
          {`Quests done: ${data.completed.length}`}
        </Text>
      )}
      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.3, marginTop: 4, marginBottom: 8 }}>
        {'────────────────────────────'}
      </Text>

      {/* Active quests */}
      {data.active.length > 0 ? (
        data.active.map((ch) => {
          const daysLeft = getDaysLeft(ch);
          return (
            <View key={ch.id} style={styles.questBlock}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, fontWeight: '700', marginTop: 8 }}>
                {'* ACTIVE'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                {`"${ch.title}"`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6 }}>
                {ch.description}
              </Text>
              <Text
                style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}
                accessibilityLabel={`Progress: ${ch.progress} of ${ch.duration_days} days`}
              >
                {`Progress: ${progressBar(ch.progress, ch.duration_days)} ${ch.progress}/${ch.duration_days} days`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.7 }}>
                {`Time left: ${daysLeft}d | Reward: +${ch.xp_reward} care points`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5, marginTop: 4 }}>
                {ch.type === 'track_purchases'
                  ? '> hint: log spending on the home screen'
                  : `> hint: log ${ch.category} spending to progress`}
              </Text>
            </View>
          );
        })
      ) : hasNoQuests ? (
        <View style={styles.emptyState}>
          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center' }}>
            {'No quests yet!'}
          </Text>
          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center', opacity: 0.7, marginTop: 12 }}>
            {'Complete lessons and log\nspending to unlock quests.'}
          </Text>
          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center', opacity: 0.5, marginTop: 12 }}>
            {'Your pet will suggest new\nchallenges as you progress.'}
          </Text>
        </View>
      ) : null}

      {/* Completed quests */}
      {data.completed.map((ch) => (
        <View key={ch.id} style={styles.questBlock}>
          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, fontWeight: '700', opacity: 0.6, marginTop: 8 }}>
            {'[ok] COMPLETED'}
          </Text>
          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6 }}>
            {`"${ch.title}"`}
          </Text>
          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5 }}>
            {`+${ch.xp_reward} care points earned`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16 },
  termHeader: { textAlign: 'center', marginBottom: 12 },
  questBlock: { marginBottom: 12 },
  emptyState: { paddingVertical: 24 },
});
