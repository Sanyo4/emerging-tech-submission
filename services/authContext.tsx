import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAppSettings, createAppSettings, updateAppSettings, resetApp as dbResetApp } from './database';
import { hashPin } from '../utils/pin';

interface AuthContextType {
  isAuthenticated: boolean;
  isNewUser: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  hasBiometrics: boolean;
  biometricType: 'fingerprint' | 'facial' | 'none';
  login: (pin: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  setupBiometrics: () => Promise<boolean>;
  logout: () => void;
  resetApp: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'none'>('none');

  const refresh = useCallback(async () => {
    try {
      const settings = await getAppSettings();
      if (!settings) {
        setIsNewUser(true);
        setIsOnboarded(false);
        setIsAuthenticated(false);
      } else {
        setIsNewUser(false);
        setIsOnboarded(settings.onboarding_completed === 1);
      }
    } catch (err) {
      console.error('Auth refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Detect biometric hardware on mount
  useEffect(() => {
    (async () => {
      try {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(hasHw && isEnrolled);
        if (hasHw && isEnrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('facial');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const setupBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Set up biometric login',
        cancelLabel: 'Skip',
        disableDeviceFallback: true,
      });
      if (result.success) {
        // Mark biometric as enabled in app settings
        const settings = await getAppSettings();
        if (settings) {
          await updateAppSettings({ biometric_enabled: 1 });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const settings = await getAppSettings();
    if (!settings?.pin_hash) return false;
    const inputHash = await hashPin(pin);
    if (inputHash === settings.pin_hash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    const pinHash = await hashPin(pin);
    const settings = await getAppSettings();
    if (settings) {
      await updateAppSettings({ pin_hash: pinHash });
    } else {
      await createAppSettings(pinHash);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const resetApp = useCallback(async () => {
    await dbResetApp();
    setIsAuthenticated(false);
    setIsNewUser(true);
    setIsOnboarded(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isNewUser,
      isOnboarded,
      isLoading,
      hasBiometrics,
      biometricType,
      login,
      loginWithBiometrics,
      setupPin,
      setupBiometrics,
      logout,
      resetApp,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
