/**
 * Bolt Town Points utility
 * 
 * IMPORTANT: total_points is a GENERATED column in the database.
 * It is automatically calculated from the sum of all point columns.
 * NEVER try to INSERT or UPDATE total_points directly - it will cause errors.
 * 
 * Only update the individual point columns:
 * - referral_points
 * - referral_bonus_points
 * - task_points
 * - special_task_points
 * - ad_points
 * - activity_points
 * - streak_bonus
 */

export type BoltTownPointsLike = Partial<{
  referral_points: number | null;
  referral_bonus_points: number | null;
  task_points: number | null;
  special_task_points: number | null;
  ad_points: number | null;
  activity_points: number | null;
  streak_bonus: number | null;
}>;

const n = (v: unknown) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Compute total points from individual columns
 * This is for DISPLAY purposes only - the database calculates this automatically
 */
export const computeBoltTownTotalPoints = (p: BoltTownPointsLike): number => {
  return (
    n(p.referral_points) +
    n(p.referral_bonus_points) +
    n(p.task_points) +
    n(p.special_task_points) +
    n(p.ad_points) +
    n(p.activity_points) +
    n(p.streak_bonus)
  );
};

/**
 * Get UTC date string for today (YYYY-MM-DD format)
 * Always use this for consistency with database
 */
export const getTodayUTCDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
