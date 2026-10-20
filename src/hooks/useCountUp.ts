import { useEffect, useState } from "react";

/** Animates 0 -> target with an ease-out curve. Respects prefers-reduced-motion. */
export function useCountUp(target: number | undefined, duration = 1800) {
  const [value, setValue] = useState(0);
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (target === undefined || reduce || target === 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 4))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);

  return reduce ? (target ?? 0) : value;
}
