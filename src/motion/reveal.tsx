import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { enterRise } from './presets';

/**
 * Wrap a block so it rises in on mount, staggered by `index`. Siblings below glide
 * (instead of jumping) when it grows or shrinks. Only fires on mount, not on refetch.
 */
export function Reveal({ index = 0, style, children }: PropsWithChildren<{ index?: number; style?: StyleProp<ViewStyle> }>) {
  return (
    <Animated.View entering={enterRise(index)} layout={LinearTransition.duration(220)} style={style}>
      {children}
    </Animated.View>
  );
}
