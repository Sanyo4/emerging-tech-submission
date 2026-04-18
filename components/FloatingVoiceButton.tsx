import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, BorderRadius } from '../constants/theme';

export default function FloatingVoiceButton() {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.navigate('/')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Voice input"
      accessibilityHint="Navigates to home screen with voice mode"
    >
      <Text style={styles.icon}>MIC</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
