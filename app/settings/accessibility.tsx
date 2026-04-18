// Brief 04 — Full accessibility settings with terminal-styled toggles
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, type AccessibilitySettings } from '../../theme';

export default function AccessibilitySettingsScreen() {
  const theme = useTheme();
  const { accessibility, updateAccessibility } = theme;
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  const toggle = (key: keyof AccessibilitySettings, value: boolean) => {
    updateAccessibility({ [key]: value });
  };

  const cycleSetting = (key: 'textSize' | 'hapticIntensity' | 'ttsSpeed', options: string[], current: string) => {
    const idx = options.indexOf(current);
    const next = options[(idx + 1) % options.length];
    updateAccessibility({ [key]: next });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button" style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.colors.interactive.primary }]}>{'<- Back'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {'── Accessibility Settings ──'}
          </Text>

          {/* DISPLAY */}
          <Text style={[styles.sectionLabel, { color: theme.colors.base.terminalText, fontFamily: mono }]}>DISPLAY</Text>

          <TermRow mono={mono} color={theme.colors.base.terminalText} label="Text size:" value={accessibility.textSize}
            onPress={() => cycleSetting('textSize', ['small', 'medium', 'large', 'extra_large'], accessibility.textSize)} />
          <TermToggle mono={mono} color={theme.colors.base.terminalText} label="High contrast:" value={accessibility.highContrast}
            onChange={(v) => toggle('highContrast', v)} tint={theme.colors.interactive.primary} />
          <TermToggle mono={mono} color={theme.colors.base.terminalText} label="Reduce motion:" value={accessibility.reducedMotion}
            onChange={(v) => toggle('reducedMotion', v)} tint={theme.colors.interactive.primary} />

          {/* AUDIO & HAPTICS */}
          <Text style={[styles.sectionLabel, { color: theme.colors.base.terminalText, fontFamily: mono, marginTop: 16 }]}>AUDIO & HAPTICS</Text>

          <TermRow mono={mono} color={theme.colors.base.terminalText} label="Haptics:" value={accessibility.hapticIntensity}
            onPress={() => cycleSetting('hapticIntensity', ['off', 'light', 'medium', 'strong'], accessibility.hapticIntensity)} />
          <TermToggle mono={mono} color={theme.colors.base.terminalText} label="Bloop sounds:" value={accessibility.bloopSound}
            onChange={(v) => toggle('bloopSound', v)} tint={theme.colors.interactive.primary} />
          <TermRow mono={mono} color={theme.colors.base.terminalText} label="TTS speed:" value={accessibility.ttsSpeed}
            onPress={() => cycleSetting('ttsSpeed', ['slow', 'normal', 'fast'], accessibility.ttsSpeed)} />

          {/* LANGUAGE */}
          <Text style={[styles.sectionLabel, { color: theme.colors.base.terminalText, fontFamily: mono, marginTop: 16 }]}>LANGUAGE</Text>

          <TermToggle mono={mono} color={theme.colors.base.terminalText} label="Simplified:" value={accessibility.simplifiedLanguage}
            onChange={(v) => toggle('simplifiedLanguage', v)} tint={theme.colors.interactive.primary} />
          <TermToggle mono={mono} color={theme.colors.base.terminalText} label="Verbose reader:" value={accessibility.verboseScreenReader}
            onChange={(v) => toggle('verboseScreenReader', v)} tint={theme.colors.interactive.primary} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TermRow({ mono, color, label, value, onPress }: { mono: string | undefined; color: string; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} current value ${value}. Tap to change.`} style={styles.row}>
      <Text style={[styles.rowLabel, { color, fontFamily: mono }]}>{label}</Text>
      <Text style={[styles.rowValue, { color, fontFamily: mono }]}>{`[< ${value} >]`}</Text>
    </Pressable>
  );
}

function TermToggle({ mono, color, label, value, onChange, tint }: { mono: string | undefined; color: string; label: string; value: boolean; onChange: (v: boolean) => void; tint: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color, fontFamily: mono }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#555', true: tint }}
        accessibilityLabel={`${label} ${value ? 'on' : 'off'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { paddingVertical: 8, minHeight: 48, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  content: { flexGrow: 1 },
  terminal: { padding: 16 },
  termHeader: { fontSize: 18, textAlign: 'center', marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', opacity: 0.6, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, minHeight: 48 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, opacity: 0.8 },
});
