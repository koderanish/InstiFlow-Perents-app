import { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { countUpValue, decimalsOf } from './motion-math';

export type CountUpProps = {
  value: number;
  /** Decimals to show while counting. Defaults to the fewest that show `value` exactly. */
  decimals?: number;
  /** Turns the running number into text, e.g. `(n) => `${n}%``. */
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  maxFontSizeMultiplier?: number;
  numberOfLines?: number;
};

/**
 * A number that counts up from 0 the first time it appears, then only moves again if `value` changes.
 * Digits are tabular so the width never jitters. Screen readers get the final number, not the frames.
 * Under reduced motion it just shows the value.
 */
export function CountUp({ value, decimals, format, duration = 900, delay = 0, style, maxFontSizeMultiplier = 1.2, numberOfLines }: CountUpProps) {
  const reduced = useReducedMotion();
  const places = decimals ?? decimalsOf(value);
  const [shown, setShown] = useState(reduced ? value : 0);
  const latest = useRef(reduced ? value : 0);

  useEffect(() => {
    if (reduced) return undefined;
    const from = latest.current;
    if (from === value) return undefined;
    let frame: ReturnType<typeof requestAnimationFrame> | undefined;
    const start = () => {
      const startedAt = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - startedAt) / duration);
        const next = countUpValue(from, value, t, places);
        latest.current = next;
        setShown(next);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      tick();
    };
    const timer = setTimeout(start, delay);
    return () => {
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [value, places, duration, delay, reduced]);

  const render = format ?? ((n: number) => n.toFixed(places));
  return (
    <Text
      accessibilityLabel={render(value)}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      numberOfLines={numberOfLines}
      style={[style, { fontVariant: ['tabular-nums'] }]}
    >
      {render(reduced ? value : shown)}
    </Text>
  );
}
