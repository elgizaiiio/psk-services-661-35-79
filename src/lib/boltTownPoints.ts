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
