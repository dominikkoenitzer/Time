/**
 * The two curves the scroll timeline is built from. Pure, so the shapes they
 * promise — clamped at both ends, monotonic in between, symmetric about the
 * midpoint — are pinned by tests rather than by eye.
 */

/** Ease in and out, quadratic. Maps [0,1] onto [0,1]. */
export function easeIO(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

/**
 * Smoothstep between two thresholds: 0 at or below `a`, 1 at or above `b`, and
 * an S-curve in between. Every fade, dim and reveal in the timeline is one of
 * these against the scroll position.
 */
export function sstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
