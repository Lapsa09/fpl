export type CutPot = { potAmount: number; contributors: number; quota: number };

export function cutPotBreakdown(pot: number, participants: number): CutPot {
  const potAmount = Math.max(0, Math.trunc(pot));
  const contributors = Math.max(0, Math.trunc(participants) - 1);
  const quota = contributors > 0 ? Math.trunc(potAmount / contributors) : 0;
  return { potAmount, contributors, quota };
}