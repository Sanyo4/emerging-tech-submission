// Demo hub — showcases core features for judges without mutating real data.
// All previews are visual; games run with demoMode so they skip DB writes.
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PetTerminal from '../../components/pet/PetTerminal';
import BNPLGame from '../../components/games/BNPLGame';
import NeedsVsWantsGame from '../../components/games/NeedsVsWantsGame';
import { useTheme, type PetMood } from '../../theme';
import { LEVEL_THRESHOLDS } from '../../utils/gamification';
import { DEMO_TRANSACTIONS } from './mockData';

type DemoGame = 'bnpl' | 'needs_vs_wants' | null;

const MOOD_ORDER: PetMood[] = ['thriving', 'happy', 'neutral', 'worried', 'critical'];

const MOOD_HEALTH: Record<PetMood, number> = {
  thriving: 95,
  happy: 75,
  neutral: 55,
  worried: 30,
  critical: 10,
};

const MOOD_DESCRIPTION: Record<PetMood, string> = {
  thriving: 'Budget on track, daily streak, all categories under.',
  happy: 'Good habits — checked in, logged spending recently.',
  neutral: 'Coasting. A log or lesson will nudge them up.',
  worried: 'Over budget in a category or missed a day.',
  critical: 'Multiple days without care. Needs attention.',
};

const STREAK_MILESTONES: { days: number; label: string; impact: string }[] = [
  { days: 3, label: '3-day streak', impact: 'Unlocks +5 care points bonus' },
  { days: 7, label: '7-day streak', impact: 'Pet mood range widens — thriving reachable' },
  { days: 14, label: '14-day streak', impact: 'Evolution path leans flourishing' },
  { days: 30, label: '30-day streak', impact: 'Elder tier — full narrative arc unlocked' },
];

export default function DemoHub() {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [activeGame, setActiveGame] = useState<DemoGame>(null);

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const closeGame = () => setActiveGame(null);

  // Each pet card takes up most of the screen (card-style paging)
  const cardWidth = Math.min(screenWidth - theme.spacing.lg * 2, 320);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: theme.spacing.md }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back to settings"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Text style={[styles.backText, { color: theme.colors.interactive.primary }]}>{'<- Back'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}
        nestedScrollEnabled
      >
        {/* Demo Mode banner */}
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
            {'── Demo Mode ──'}
          </Text>
          <Text
            style={{
              color: theme.colors.base.terminalText,
              fontFamily: mono,
              fontSize: 13 * fs,
              lineHeight: 20 * fs,
              textAlign: 'center',
              opacity: 0.75,
            }}
          >
            {'Safe preview — no data is changed.\nShowcase what unfolds over time.'}
          </Text>
        </View>

        {/* Section 1: Pet State Gallery */}
        <SectionHeader mono={mono} fs={fs} color={theme.colors.base.textPrimary} title="Pet State Gallery" />
        <Text style={[styles.sectionNote, { color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }]}>
          {'Swipe to see each mood your pet can reach.'}
        </Text>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={[styles.gallery, { height: 340 }]}
          contentContainerStyle={{ gap: theme.spacing.md }}
          nestedScrollEnabled
        >
          {MOOD_ORDER.map((mood) => (
            <View key={mood} style={{ width: cardWidth, gap: theme.spacing.sm }}>
              <PetTerminal
                petState={mood}
                petName="Buddy"
                healthPoints={MOOD_HEALTH[mood]}
              />
              <Text
                style={{
                  color: theme.colors.base.textSecondary,
                  fontFamily: mono,
                  fontSize: 12 * fs,
                  lineHeight: 18 * fs,
                  textAlign: 'center',
                }}
              >
                {MOOD_DESCRIPTION[mood]}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Section 2: Minigames Launcher */}
        <SectionHeader mono={mono} fs={fs} color={theme.colors.base.textPrimary} title="Minigames" />
        <Text style={[styles.sectionNote, { color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }]}>
          {'Sandboxed — no XP or pet health changes.'}
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          <GameTile
            mono={mono}
            fs={fs}
            theme={theme}
            label="Buy Now Pay Later"
            hint="Interactive scenario • ~1 min"
            onPress={() => setActiveGame('bnpl')}
          />
          <GameTile
            mono={mono}
            fs={fs}
            theme={theme}
            label="Needs vs Wants"
            hint="Swipe sorter • ~1 min"
            onPress={() => setActiveGame('needs_vs_wants')}
          />
        </View>

        {/* Section 3: Level & Streak Showcase */}
        <SectionHeader mono={mono} fs={fs} color={theme.colors.base.textPrimary} title="Level & Streak Showcase" />
        <Text style={[styles.sectionNote, { color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }]}>
          {'Titles users earn as they log and learn.'}
        </Text>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termSubheader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs }]}>
            {'── XP Levels ──'}
          </Text>
          {LEVEL_THRESHOLDS.map((t) => (
            <View key={t.level} style={styles.levelRow}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs }}>
                {`Lvl ${t.level}  ${t.title}`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs, opacity: 0.7 }}>
                {`${t.xpRequired} XP`}
              </Text>
            </View>
          ))}

          <Text style={[styles.termSubheader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, marginTop: 16 }]}>
            {'── Streak Milestones ──'}
          </Text>
          {STREAK_MILESTONES.map((s) => (
            <View key={s.days} style={{ paddingVertical: 4 }}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 13 * fs }}>
                {s.label}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12 * fs, opacity: 0.65, lineHeight: 18 * fs }}>
                {`  ${s.impact}`}
              </Text>
            </View>
          ))}
        </View>

        {/* Section 4: Replay Onboarding */}
        <SectionHeader mono={mono} fs={fs} color={theme.colors.base.textPrimary} title="Onboarding Tour" />
        <Text style={[styles.sectionNote, { color: theme.colors.base.textSecondary, fontFamily: mono, fontSize: 12 * fs }]}>
          {'Visual replay of a new user\u2019s first moments.'}
        </Text>
        <Pressable
          onPress={() => router.push('/demo/onboarding-tour')}
          accessibilityLabel="Replay onboarding tour"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: pressed ? theme.colors.interactive.primaryPressed : theme.colors.interactive.primary,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          <Text style={[styles.actionBtnText, { color: theme.colors.interactive.primaryText }]}>
            {'Replay Onboarding'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Game modals (sandboxed) */}
      <BNPLGame
        visible={activeGame === 'bnpl'}
        demoMode
        onComplete={closeGame}
        onDismiss={closeGame}
      />
      <NeedsVsWantsGame
        visible={activeGame === 'needs_vs_wants'}
        transactions={DEMO_TRANSACTIONS}
        demoMode
        onComplete={closeGame}
        onDismiss={closeGame}
      />
    </SafeAreaView>
  );
}

function SectionHeader({
  mono,
  fs,
  color,
  title,
}: {
  mono: string | undefined;
  fs: number;
  color: string;
  title: string;
}) {
  return (
    <Text style={{ color, fontFamily: mono, fontSize: 16 * fs, fontWeight: '700', marginTop: 8 }}>
      {title}
    </Text>
  );
}

function GameTile({
  mono,
  fs,
  theme,
  label,
  hint,
  onPress,
}: {
  mono: string | undefined;
  fs: number;
  theme: ReturnType<typeof useTheme>;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Play ${label}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.gameTile,
        {
          backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary,
          borderRadius: theme.radius.xl,
        },
      ]}
    >
      <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 15 * fs, fontWeight: '700' }}>
        {label}
      </Text>
      <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 12 * fs, opacity: 0.7, marginTop: 2 }}>
        {hint}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingVertical: 8 },
  backBtn: { paddingVertical: 8, minHeight: 48, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  content: { flexGrow: 1, gap: 16 },
  terminal: { padding: 16 },
  termHeader: { textAlign: 'center', marginBottom: 8 },
  termSubheader: { textAlign: 'center', marginBottom: 8, opacity: 0.85 },
  sectionNote: { marginTop: -8, opacity: 0.8 },
  gallery: { marginHorizontal: -4 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  gameTile: { paddingVertical: 14, paddingHorizontal: 16, minHeight: 64 },
  actionBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  actionBtnText: { fontSize: 16, fontWeight: '600' },
});
