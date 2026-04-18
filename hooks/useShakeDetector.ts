// Shake-to-talk detector using Accelerometer
// Monitors device acceleration for a shake gesture and fires a callback.
// Debounced to prevent multiple triggers from one shake.

import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';

interface ShakeDetectorOptions {
  onShake: () => void;
  threshold?: number;   // acceleration magnitude to count as a shake (default 1.8g)
  debounceMs?: number;  // cooldown between shakes (default 1500ms)
  enabled?: boolean;    // toggle on/off (default true)
}

const DEFAULT_THRESHOLD = 1.8;
const DEFAULT_DEBOUNCE = 1500;
const SAMPLE_INTERVAL = 100; // ms between accelerometer readings

export function useShakeDetector({
  onShake,
  threshold = DEFAULT_THRESHOLD,
  debounceMs = DEFAULT_DEBOUNCE,
  enabled = true,
}: ShakeDetectorOptions): void {
  const lastShakeRef = useRef(0);
  const onShakeRef = useRef(onShake);

  // Keep callback ref fresh without re-subscribing
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const handleAcceleration = useCallback(
    ({ x, y, z }: AccelerometerMeasurement) => {
      // Calculate total acceleration magnitude (gravity-subtracted approximation)
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > threshold) {
        const now = Date.now();
        if (now - lastShakeRef.current > debounceMs) {
          lastShakeRef.current = now;
          onShakeRef.current();
        }
      }
    },
    [threshold, debounceMs]
  );

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL);
    const subscription = Accelerometer.addListener(handleAcceleration);

    return () => {
      subscription.remove();
    };
  }, [enabled, handleAcceleration]);
}
