import { useEffect, useState, useCallback } from 'react';
import { Slot, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getDatabase } from '../services/database';
import { seedDatabase } from '../data/seed';
import { AuthProvider, useAuth } from '../services/authContext';
import { ThemeProvider, useTheme } from '../theme';
import { Colors, FontSize } from '../constants/theme';
import { initAccessibilityListener } from '../utils/accessibility';

function AuthGate() {
  const { isAuthenticated, isNewUser, isOnboarded, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    if (isNewUser || !isOnboarded) {
      if (!inOnboarding) {
        router.replace('/onboarding/shake-practice');
      }
    } else if (!isAuthenticated) {
      if (!inLogin) {
        router.replace('/login');
      }
    } else {
      if (inOnboarding || inLogin) {
        router.replace('/(tabs)/');
      }
    }
  }, [isAuthenticated, isNewUser, isOnboarded, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initApp = useCallback(async () => {
    try {
      const db = await getDatabase();
      await seedDatabase(db);
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError('Failed to initialize database');
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    const cleanup = initAccessibilityListener();
    return cleanup;
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <View style={Platform.OS === 'web' ? styles.webContainer : styles.nativeContainer}>
          <StatusBar style="dark" />
          <AuthGate />
        </View>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    maxWidth: 480,
    marginHorizontal: 'auto',
    flex: 1,
    width: '100%',
  },
  nativeContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: FontSize.body,
    color: Colors.danger,
  },
});
