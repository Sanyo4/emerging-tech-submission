// Voice-first app shell — stack navigation with no visible tab bar
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    />
  );
}
