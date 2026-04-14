'use client';

import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 600) {
  const [current, setCurrent] = useState(target);
  const prevTarget = useRef(target);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startValueRef = useRef(target);

  useEffect(() => {
    if (prevTarget.current === target) return;

    const from = prevTarget.current;
    const to = target;
    prevTarget.current = target;
    startValueRef.current = from;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = 0;
        setCurrent(to);
      }
    };

    startRef.current = 0;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}
