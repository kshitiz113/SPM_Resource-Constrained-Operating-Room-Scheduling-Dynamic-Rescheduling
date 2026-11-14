import { RescheduleAlternative } from '../types';

/** Average positive delay (minutes) across moved cases of an alternative. */
export const averageDelayMinutes = (alt: RescheduleAlternative): number => {
  if (alt.averageDelayMinutes != null) return alt.averageDelayMinutes;
  const moved = alt.diff?.moved || [];
  if (moved.length === 0) return 0;
  const total = moved.reduce((sum, m) => sum + Math.max(0, m.shiftMinutes || 0), 0);
  return total / moved.length;
};

export const displacedCount = (alt: RescheduleAlternative): number =>
  alt.displacedSurgeriesCount ?? alt.metrics?.movedCases ?? alt.diff?.moved?.length ?? 0;
