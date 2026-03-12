export const BN_TRIP_POINTS_TARGET = Number(
  process.env.NEXT_PUBLIC_BN_TRIP_POINTS_TARGET ?? 50
);

export const ROBLOX_GC_POINTS_TARGET = Number(
  process.env.NEXT_PUBLIC_ROBLOX_GC_POINTS_TARGET ?? 200
);

export function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
