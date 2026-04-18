// Voice-first single-page layout — all interactions through pet terminal
import { useState, useCallback, useReducer, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import SuggestionChips from '../../components/MenuChips';
import VoiceControl from '../../components/VoiceControl';
import DynamicContentArea, { type ContentState } from '../../components/DynamicContentArea';
import MicroLessonModal from '../../components/MicroLessonModal';
import XPPopup from '../../components/XPPopup';
import type { CategoryDetailCardData } from '../../components/cards/CategoryDetailCard';
import {
  getUserProfile,
  getPetProfile,
  getPetHealth,
  createChallenge,
  updateUserXP,
  getBudgetCategories,
  getRecentTransactions,
  getActiveChallenges,
  type UserProfile,
  type PetProfile,
} from '../../services/database';
import { aiService, type AIResult, type PendingTransaction } from '../../services/ai';
import { conversationContext } from '../../services/conversationContext';
import { executeFunctionCall } from '../../services/functionExecutor';
import { recalculatePetState, getCurrentPetState, type PetMood } from '../../services/petState';
import { recordEngagement } from '../../services/engagement';
import { checkEvolution } from '../../services/petEvolution';
import { getTransactionReaction, getDailyCheckInReaction } from '../../services/petReactions';
import { resolveDialogue } from '../../services/petDialogue';
import { playFullPetFeedback, speakQuestOffer, stopAllAudio } from '../../services/audioFeedback';
import { playShakeDetectedHaptic } from '../../services/haptics';
import { XP_AWARDS } from '../../utils/gamification';
import { announceForScreenReader } from '../../utils/accessibility';
import { buildContentSpeech } from '../../utils/contentSpeech';
import { getSuggestionChips, type ChipState } from '../../utils/suggestionChips';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import { useTheme } from '../../theme';

// Content state reducer
type ContentAction =
  | { type: 'SET_CONTENT'; payload: ContentState }
  | { type: 'CLEAR' };

function contentReducer(state: ContentState | null, action: ContentAction): ContentState | null {
  switch (action.type) {
    case 'SET_CONTENT':
      return action.payload;
    case 'CLEAR':
      return null;
    default:
      return state;
  }
}

export default function HomeScreen() {
  const theme = useTheme();

  // Core state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [petState, setPetState] = useState<PetMood>('neutral');
  const [dialogue, setDialogue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [healthPoints, setHealthPoints] = useState(100);

  // Dynamic content
  const [contentState, dispatchContent] = useReducer(contentReducer, null);

  // Suggestion chips
  const [chips, setChips] = useState<string[]>(["how's my budget?", 'log spending', 'what can I do?']);

  // Shake-to-talk
  const [shakeTrigger, setShakeTrigger] = useState(0);
  useShakeDetector({
    onShake: () => {
      playShakeDetectedHaptic();
      setShakeTrigger((n) => n + 1);
    },
    enabled: !isProcessing,
  });

  // Conversational auto-mic after TTS
  const [ttsTrigger, setTTSTrigger] = useState(0);
  const voiceInteractionActive = useRef(false);

  // Lesson modal (kept as modal for now)
  const [showLesson, setShowLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<AIResult['lesson']>(null);
  const [lessonActionPending, setLessonActionPending] = useState<'accept' | 'dismiss' | null>(null);
  const lessonOfferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // XP popup
  const [xpPopup, setXpPopup] = useState<{ amount: number; visible: boolean }>({
    amount: 0,
    visible: false,
  });

  const handleTTSDone = useCallback(() => {
    if (voiceInteractionActive.current && !isProcessing) {
      setTTSTrigger((n) => n + 1);
    }
  }, [isProcessing]);

  const presentLessonOffer = useCallback((lesson: NonNullable<AIResult['lesson']>, delay = 0) => {
    if (lessonOfferTimeoutRef.current) {
      clearTimeout(lessonOfferTimeoutRef.current);
      lessonOfferTimeoutRef.current = null;
    }

    lessonOfferTimeoutRef.current = setTimeout(() => {
      lessonOfferTimeoutRef.current = null;

      void (async () => {
        const activeChallenges = await getActiveChallenges();
        if (activeChallenges.length > 0) {
          return;
        }

        setCurrentLesson(lesson);
        setShowLesson(true);
        // Unmount the SpeechBubble so any in-flight typewriter TTS can't fire
        // after speakQuestOffer starts (the autoSpeakRef update can lag a tick
        // behind showLesson, leaving a race window).
        setDialogue('');
        conversationContext.startLessonOffer();
        announceForScreenReader(`New quest. ${lesson.challengeTemplate.title}.`);
        speakQuestOffer(lesson, handleTTSDone);
      })();
    }, delay);
  }, [handleTTSDone]);

  const loadData = useCallback(async () => {
    const [p, pet, hp] = await Promise.all([
      getUserProfile(),
      getPetProfile(),
      getPetHealth(),
    ]);
    setProfile(p);
    setPetProfile(pet);
    setHealthPoints(hp);
    if (pet) {
      setPetState(pet.current_state as PetMood);
    }

    // Update suggestion chips
    try {
      const cats = await getBudgetCategories();
      const txns = await getRecentTransactions(1);
      const active = await getActiveChallenges();
      const today = new Date().toDateString();
      const hasToday = txns.length > 0 && new Date(txns[0].timestamp).toDateString() === today;
      const tight = cats
        .filter((c) => c.weekly_limit > 0 && c.spent / c.weekly_limit > 0.8)
        .map((c) => c.name);

      const chipState: ChipState = {
        hasTransactionsToday: hasToday,
        tightCategories: tight,
        hasActiveQuest: active.length > 0,
        petName: pet?.name ?? 'Buddy',
      };
      setChips(getSuggestionChips(chipState));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Init AI on first mount
  useEffect(() => {
    let mounted = true;
    if (!aiService.getInitStatus()) {
      aiService
        .init()
        .then(() => { if (mounted) setIsModelReady(true); })
        .catch(() => { if (mounted) setIsModelReady(true); });
    } else {
      setIsModelReady(true);
    }

    // Check time-based triggers FIRST. If a lesson is queued, skip the daily
    // greeting entirely so its typewriter-completion TTS can't override the
    // quest TTS (see SpeechBubble auto-speak race).
    (async () => {
      let lessonQueued = false;
      try {
        const triggerResult = await aiService.checkTimeTriggers();
        if (mounted && triggerResult?.lesson) {
          lessonQueued = true;
          presentLessonOffer(triggerResult.lesson, 1500);
        }
      } catch {}

      if (lessonQueued || !mounted) return;

      // No quest coming — show the contextual daily greeting
      try {
        const state = await getCurrentPetState();
        const reaction = getDailyCheckInReaction(state);
        let text = await resolveDialogue(reaction.templateKey, reaction.slotValues);

        // Append contextual suggestion for discoverability
        const cats = await getBudgetCategories();
        const active = await getActiveChallenges();
        const txns = await getRecentTransactions(1);
        const today = new Date().toDateString();
        const hasToday = txns.length > 0 && new Date(txns[0].timestamp).toDateString() === today;

        if (!hasToday) {
          text += " Tell me what you've spent today!";
        } else if (active.length > 0) {
          text += ' Ask me about your quest progress!';
        } else {
          const tight = cats.find((c) => c.weekly_limit > 0 && c.spent / c.weekly_limit > 0.8);
          if (tight) {
            text += ` Try saying "check ${tight.id} budget"`;
          }
        }

        if (mounted) setDialogue(text);
      } catch {}
    })();

    // Check evolution
    checkEvolution().catch(() => {});

    return () => {
      mounted = false;
      if (lessonOfferTimeoutRef.current) {
        clearTimeout(lessonOfferTimeoutRef.current);
        lessonOfferTimeoutRef.current = null;
      }
    };
  }, [presentLessonOffer]);

  const showXPPopup = (amount: number) => {
    setXpPopup({ amount, visible: true });
    announceForScreenReader(`Earned ${amount} care points`);
    setTimeout(() => setXpPopup({ amount: 0, visible: false }), 1500);
  };

  const handleSend = async (text: string) => {
    setIsProcessing(true);

    try {
      const result = await aiService.parseUserInput(text);
      let nextContentState: ContentState | null = null;

      // Handle lesson accept/dismiss from voice
      if (result.lessonAction) {
        await handleLessonOfferAction(result.lessonAction);
        return;
      }

      // Handle settings navigation
      if (result.executedFunctions[0]?.functionName === 'open_settings') {
        router.push('/settings/profile' as any);
        setIsProcessing(false);
        return;
      }

      // If conversation context intercepted and wants to execute a transaction
      if (result.pendingTransaction && result.contentType !== 'confirmation') {
        // This means the context said "execute" — run confirmed transaction
        await executeTransaction(result.pendingTransaction);
        return;
      }

      // Show content card if applicable
      if (result.contentType && result.contentType !== 'idle') {
        nextContentState = {
          type: result.contentType,
          data: result.executedFunctions[0]?.data ?? result.pendingTransaction ?? {},
          responseText: result.responseText,
        };
        dispatchContent({ type: 'SET_CONTENT', payload: nextContentState });
      } else if (result.contentType === 'idle' || (!result.contentType && !result.pendingTransaction)) {
        // Clear content on idle or generic response
        if (!result.pendingTransaction) {
          dispatchContent({ type: 'CLEAR' });
        }
      }

      // If pending transaction (confirmation flow), show the confirmation card
      if (result.pendingTransaction && result.contentType === 'confirmation') {
        const p = result.pendingTransaction;
        const projected = p.budgetLimit > 0
          ? Math.round(((p.budgetSpent + p.amount) / p.budgetLimit) * 100)
          : 0;
        nextContentState = {
          type: 'confirmation',
          data: result.pendingTransaction,
          responseText: `\u00A3${p.amount.toFixed(2)} on ${p.categoryName}. That'll put you at ${projected}% for the week. Say yes to confirm or no to cancel.`,
        };
        dispatchContent({ type: 'SET_CONTENT', payload: nextContentState });
      }

      const spokenSummary = nextContentState ? buildContentSpeech(nextContentState) : null;

      if (spokenSummary) {
        setDialogue(spokenSummary);
      } else if (result.responseText && !result.pendingTransaction) {
        setDialogue(result.responseText);
      }

      if (result.xpEarned > 0) {
        showXPPopup(result.xpEarned);
      }

      if (result.lesson) {
        presentLessonOffer(result.lesson, 800);
      }
    } catch {
      setDialogue("Hmm, something went wrong. Try again!");
    } finally {
      setIsProcessing(false);
      loadData(); // Refresh chips + state
    }
  };

  const handleVoiceSend = async (text: string) => {
    voiceInteractionActive.current = true;
    await handleSend(text);
  };

  const executeTransaction = async (pending: PendingTransaction) => {
    try {
      const result = await aiService.executeConfirmedTransaction(pending);
      let nextContentState: ContentState | null = null;

      await recordEngagement('transaction_log');
      await loadData();

      // Recalculate pet state
      const stateResult = await recalculatePetState('transaction');
      setPetState(stateResult.newState);
      setHealthPoints(stateResult.newHealth);

      if (stateResult.stateChanged && petProfile) {
        playFullPetFeedback(stateResult.newState, petProfile.name);
      }

      // Pet reaction dialogue
      const logFn = result.executedFunctions.find(f => f.functionName === 'log_transaction');
      if (logFn?.success) {
        const data = logFn.data as { percentage?: number; budgetStatus?: { spent: number; weekly_limit: number } } | undefined;
        const percentage = data?.percentage ?? 0;
        const budgetStatus = data?.budgetStatus;
        const remaining = budgetStatus ? budgetStatus.weekly_limit - budgetStatus.spent : 0;
        const category = (logFn.params as Record<string, unknown>).category as string;
        const amount = (logFn.params as Record<string, unknown>).amount as number;

        const reaction = getTransactionReaction(category, amount, remaining, percentage);
        const dialogueText = await resolveDialogue(reaction.templateKey, reaction.slotValues);
        setDialogue(dialogueText);
      }

      if (result.xpEarned > 0) {
        showXPPopup(result.xpEarned);
      }

      if (result.lesson) {
        presentLessonOffer(result.lesson, 800);
      }

      // Show game card if triggered
      if (result.game) {
        nextContentState = {
          type: result.game === 'needs_vs_wants' ? 'game_needs_vs_wants' : 'game_bnpl',
          data: {},
          responseText: result.game === 'needs_vs_wants'
            ? "I've noticed a few fun purchases lately. Let's play a quick game! Say 'start' when ready."
            : "I've spotted some BNPL purchases. Let me show you something interesting. Say 'start' when ready.",
        };
        dispatchContent({ type: 'SET_CONTENT', payload: nextContentState });
      } else {
        // Clear confirmation card after successful transaction
        dispatchContent({ type: 'CLEAR' });
      }

      const spokenSummary = nextContentState ? buildContentSpeech(nextContentState) : null;
      if (spokenSummary) {
        setDialogue(spokenSummary);
      }
    } catch {
      setDialogue("Something went wrong logging that. Try again!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLessonOfferAction = useCallback(async (action: 'accept' | 'dismiss') => {
    if (lessonActionPending) return;

    const lesson = currentLesson;
    setLessonActionPending(action);
    stopAllAudio();
    if (lessonOfferTimeoutRef.current) {
      clearTimeout(lessonOfferTimeoutRef.current);
      lessonOfferTimeoutRef.current = null;
    }

    try {
      conversationContext.reset();
      setShowLesson(false);
      setCurrentLesson(null);

      if (action === 'dismiss') {
        setDialogue('No worries, maybe next time!');
        return;
      }

      if (!lesson?.challengeTemplate) {
        setDialogue('There is no quest to accept right now.');
        return;
      }

      const activeChallenges = await getActiveChallenges();
      if (activeChallenges.length > 0) {
        setDialogue(`You already have an active quest: "${activeChallenges[0].title}". Finish it first!`);
        return;
      }

      const template = lesson.challengeTemplate;
      const challengeCategory = lesson.sourceCategory ?? lesson.category ?? 'general';

      await createChallenge({
        title: template.title,
        description: template.description,
        type: template.type,
        category: challengeCategory,
        duration_days: template.duration_days,
        xp_reward: template.xp_reward,
      });
      await updateUserXP(XP_AWARDS.ACCEPT_CHALLENGE);
      showXPPopup(XP_AWARDS.ACCEPT_CHALLENGE);
      setDialogue(`Challenge accepted! "${template.title}" — let's do this!`);
    } catch {
      setDialogue(action === 'accept' ? 'Failed to start that quest. Try again.' : 'Something went wrong. Try again.');
    } finally {
      setLessonActionPending(null);
      await loadData();
    }
  }, [currentLesson, lessonActionPending, loadData]);

  const handleAdjustCategoryLimit = useCallback(async (categoryId: string, delta: number) => {
    setIsProcessing(true);

    try {
      const result = await executeFunctionCall({
        name: 'adjust_budget_limit',
        arguments: {
          category: categoryId,
          direction: delta > 0 ? 'increase' : 'decrease',
          amount: Math.abs(delta),
        },
      });

      let nextContentState: ContentState | null = null;
      if (result.success && result.contentType === 'category_detail' && result.data) {
        nextContentState = {
          type: 'category_detail',
          data: result.data as CategoryDetailCardData,
          responseText: result.responseText || '',
        };
        dispatchContent({ type: 'SET_CONTENT', payload: nextContentState });
      }

      const fallbackResponseText = result.responseText || 'Budget updated.';
      const spokenSummary = buildContentSpeech(nextContentState ?? {
        type: 'category_detail',
        data: result.data,
        responseText: fallbackResponseText,
      });
      setDialogue(spokenSummary ?? fallbackResponseText);
    } catch {
      setDialogue('Something went wrong updating that budget. Try again.');
    } finally {
      setIsProcessing(false);
      await loadData();
    }
  }, [loadData]);

  const petName = petProfile?.name ?? 'Buddy';
  const showChips = !contentState; // Hide chips when content card is showing

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.base.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Scrollable content area */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Settings gear */}
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/settings/profile' as any)}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Text style={[styles.settingsIcon, { color: theme.colors.base.textSecondary }]}>
              {'[=]'}
            </Text>
          </Pressable>

          {/* AI loading indicator */}
          {!isModelReady && (
            <Text style={[styles.loadingText, { color: theme.colors.base.textSecondary }]}>
              Loading AI...
            </Text>
          )}

          {/* Pet Terminal */}
          <Animated.View entering={FadeIn.duration(600)}>
            <PetTerminal petState={petState} petName={petName} healthPoints={healthPoints} />
          </Animated.View>

          {/* Speech Bubble */}
          {dialogue ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <SpeechBubble
                message={dialogue}
                onTTSDone={handleTTSDone}
                autoSpeak={!showLesson && !currentLesson}
              />
            </Animated.View>
          ) : null}

          {/* Suggestion Chips — only when no content card */}
          {showChips && (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <SuggestionChips
                chips={chips}
                onChipPress={handleSend}
                disabled={isProcessing}
              />
            </Animated.View>
          )}

          {/* Dynamic Content Area */}
          <DynamicContentArea
            contentState={contentState}
            onAdjustCategoryLimit={handleAdjustCategoryLimit}
          />
        </ScrollView>

        {/* Fixed Footer — Voice/Text Control */}
        <VoiceControl
          onSend={handleVoiceSend}
          isProcessing={isProcessing}
          shakeTrigger={shakeTrigger}
          ttsTrigger={ttsTrigger}
          onModeChange={(m) => { if (m === 'text') voiceInteractionActive.current = false; }}
        />

        {/* XP Popup */}
        <XPPopup amount={xpPopup.amount} visible={xpPopup.visible} />

        {/* Lesson Modal (kept as modal for now) */}
        <MicroLessonModal
          visible={showLesson}
          lesson={currentLesson}
          pendingAction={lessonActionPending}
          onAcceptChallenge={() => { void handleLessonOfferAction('accept'); }}
          onDismiss={() => { void handleLessonOfferAction('dismiss'); }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
  },
  settingsButton: {
    alignSelf: 'flex-end',
    padding: 8,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18, fontWeight: '600' },
  loadingText: { textAlign: 'center', fontSize: 14 },
});
