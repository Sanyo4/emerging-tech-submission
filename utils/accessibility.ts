import { AccessibilityInfo, Platform } from 'react-native';

let screenReaderEnabled = false;
let listenerSubscription: ReturnType<typeof AccessibilityInfo.addEventListener> | null = null;

export function initAccessibilityListener(): () => void {
  AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
    screenReaderEnabled = enabled;
  });

  listenerSubscription = AccessibilityInfo.addEventListener(
    'screenReaderChanged',
    (enabled) => {
      screenReaderEnabled = enabled;
    },
  );

  return () => {
    listenerSubscription?.remove();
    listenerSubscription = null;
  };
}

export function isScreenReaderEnabled(): boolean {
  return screenReaderEnabled;
}

export function announceForScreenReader(message: string): void {
  if (Platform.OS === 'web') return;
  AccessibilityInfo.announceForAccessibility(message);
}

export async function getAccessibleTimeout(defaultMs: number): Promise<number> {
  if (!screenReaderEnabled) return defaultMs;

  if (Platform.OS === 'android') {
    try {
      // Android provides recommended timeout via AccessibilityInfo
      const recommended = await AccessibilityInfo.getRecommendedTimeoutMillis(defaultMs);
      return Math.max(recommended, defaultMs);
    } catch {
      return Math.max(defaultMs, 10000);
    }
  }

  // iOS: use minimum 10s when screen reader is active
  return Math.max(defaultMs, 10000);
}
