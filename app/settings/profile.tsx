// Brief 04 — Pet profile and plan management
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { getPetProfile, getUserProfile, updatePetProfile, getAppSettings, type PetProfile, type UserProfile, type AppSettings } from '../../services/database';
import { getPetAge } from '../../services/petEvolution';
import { getPlanById } from '../../data/plans';
import { useAuth } from '../../services/authContext';
import { useTheme } from '../../theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { resetApp } = useAuth();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [petAge, setPetAge] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  useFocusEffect(
    useCallback(() => {
      Promise.all([getPetProfile(), getUserProfile(), getAppSettings(), getPetAge()]).then(([p, u, s, a]) => {
        setPet(p);
        setUser(u);
        setSettings(s);
        setPetAge(a);
        if (p) setEditName(p.name);
      });
    }, [])
  );

  const handleSaveName = async () => {
    if (editName.trim()) {
      await updatePetProfile({ name: editName.trim() });
      const p = await getPetProfile();
      setPet(p);
    }
    setIsEditingName(false);
  };

  const handleReset = () => {
    Alert.alert('Reset App', 'This will erase all data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { await resetApp(); router.replace('/onboarding/shake-practice'); } },
    ]);
  };

  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const plan = settings?.selected_plan_id ? getPlanById(settings.selected_plan_id) : null;

  const tierLabel = (pet?.evolution_tier ?? 'egg').charAt(0).toUpperCase() + (pet?.evolution_tier ?? 'egg').slice(1);
  const pathLabel = (pet?.evolution_path ?? 'standard').charAt(0).toUpperCase() + (pet?.evolution_path ?? 'standard').slice(1);

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
            {'── Pet Profile ──'}
          </Text>

          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Name:" value={pet?.name ?? 'Buddy'} />
          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Age:" value={`${petAge} days`} />
          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Stage:" value={tierLabel} />
          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Path:" value={pathLabel} />
          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Streak:" value={`${user?.streak_days ?? 0} days`} />
          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Level:" value={`${user?.level ?? 1}`} />
          <InfoRow mono={mono} color={theme.colors.base.terminalText} label="Plan:" value={plan?.title ?? 'Default'} />
        </View>

        {/* Edit Name */}
        {isEditingName ? (
          <View style={[styles.editRow, { borderColor: theme.colors.base.border }]}>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.editInput, { color: theme.colors.base.textPrimary, borderColor: theme.colors.base.border }]}
              autoFocus
              accessibilityLabel="New pet name"
            />
            <Pressable onPress={handleSaveName} style={[styles.smallBtn, { backgroundColor: theme.colors.interactive.primary, borderRadius: theme.radius.sm }]}>
              <Text style={[styles.smallBtnText, { color: theme.colors.interactive.primaryText }]}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setIsEditingName(true)} accessibilityLabel="Edit pet name" accessibilityRole="button"
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary, borderRadius: theme.radius.xl }]}>
            <Text style={[styles.actionBtnText, { color: theme.colors.interactive.secondaryText }]}>Edit Name</Text>
          </Pressable>
        )}

        {/* Accessibility Settings */}
        <Pressable onPress={() => router.push('/settings/accessibility')} accessibilityLabel="Accessibility settings" accessibilityRole="button"
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary, borderRadius: theme.radius.xl }]}>
          <Text style={[styles.actionBtnText, { color: theme.colors.interactive.secondaryText }]}>Accessibility Settings</Text>
        </Pressable>

        {/* Demo Mode */}
        <Pressable onPress={() => router.push('/demo')} accessibilityLabel="Open demo mode" accessibilityRole="button"
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? theme.colors.interactive.secondaryPressed : theme.colors.interactive.secondary, borderRadius: theme.radius.xl }]}>
          <Text style={[styles.actionBtnText, { color: theme.colors.interactive.secondaryText }]}>Demo Mode</Text>
        </Pressable>

        {/* Reset */}
        <Pressable onPress={handleReset} accessibilityLabel="Reset all data" accessibilityRole="button"
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? theme.colors.interactive.dangerPressed : theme.colors.interactive.danger, borderRadius: theme.radius.xl }]}>
          <Text style={[styles.actionBtnText, { color: theme.colors.interactive.dangerText }]}>Reset Data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ mono, color, label, value }: { mono: string | undefined; color: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color, fontFamily: mono }]}>{label}</Text>
      <Text style={[infoStyles.value, { color, fontFamily: mono }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 14, opacity: 0.6 },
  value: { fontSize: 14 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { paddingVertical: 8, minHeight: 48, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  content: { flexGrow: 1, gap: 16 },
  terminal: { padding: 16 },
  termHeader: { fontSize: 18, textAlign: 'center', marginBottom: 16 },
  editRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  smallBtn: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 48, justifyContent: 'center' },
  smallBtnText: { fontSize: 14, fontWeight: '600' },
  actionBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  actionBtnText: { fontSize: 16, fontWeight: '600' },
});
