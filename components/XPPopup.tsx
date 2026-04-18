import { StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { Colors, FontSize } from '../constants/theme';

interface XPPopupProps {
  amount: number;
  visible: boolean;
}

export default function XPPopup({ amount, visible }: XPPopupProps) {
  if (!visible || amount <= 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      exiting={FadeOut.duration(300)}
      style={styles.container}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      accessibilityLabel={`Earned ${amount} experience points`}
    >
      <Animated.Text style={styles.text}>+{amount} XP</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: Colors.xpGold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
});
