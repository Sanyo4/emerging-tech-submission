// Brief 01 — Warm-tinted shadows (not grey)
import { ViewStyle } from 'react-native';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

export const shadows: Record<'sm' | 'md' | 'lg' | 'pressed', ShadowStyle> = {
  sm: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  pressed: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
};
