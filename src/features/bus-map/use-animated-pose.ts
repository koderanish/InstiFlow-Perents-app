import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { MOVE_ANIMATION_MS, easeInOut, lerpPose, progress, type Pose } from '@/lib/bus-live';

/**
 * Follows `target` smoothly: each new fix glides from wherever the marker is now, so a fix that arrives
 * mid-glide never makes it jump. Under reduced motion it moves straight to the new fix.
 */
export function useAnimatedPose(target: Pose): Pose {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<Pose | null>(null);
  const current = useRef<Pose>(target);

  useEffect(() => {
    const from = current.current;
    if (from.lat === target.lat && from.lng === target.lng && from.heading === target.heading) return undefined;
    const duration = reduced ? 0 : MOVE_ANIMATION_MS;
    const startedAt = Date.now();
    let frame = 0;
    const step = () => {
      const k = progress(Date.now() - startedAt, duration);
      const next = lerpPose(from, target, easeInOut(k));
      current.current = next;
      setShown(next);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);

  return shown ?? target;
}
