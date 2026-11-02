export interface MoonPhaseInfo {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  phaseFraction: number; // 0.0 to 1.0 (0=New Moon, 0.5=Full Moon)
  phaseName: string;
  hasActivity: boolean;
  reviewsCount: number;
  readingMinutes: number;
}

const LUNAR_MONTH = 29.53058867;
// Known reference new moon: 2000-01-06 18:14:00 UTC
const REFERENCE_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();

/**
 * Calculates the astronomical moon phase for a given date.
 * Returns phase fraction [0, 1] where 0 = New Moon, 0.5 = Full Moon.
 */
export function getMoonPhaseFraction(date: Date): number {
  const diffDays = (date.getTime() - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = (diffDays % LUNAR_MONTH) / LUNAR_MONTH;
  return phase < 0 ? phase + 1 : phase;
}

export function getMoonPhaseName(fraction: number): string {
  if (fraction < 0.04 || fraction >= 0.96) {
    return "New Moon";
  }
  if (fraction < 0.22) {
    return "Waxing Crescent";
  }
  if (fraction < 0.28) {
    return "First Quarter";
  }
  if (fraction < 0.46) {
    return "Waxing Gibbous";
  }
  if (fraction < 0.54) {
    return "Full Moon";
  }
  if (fraction < 0.72) {
    return "Waning Gibbous";
  }
  if (fraction < 0.78) {
    return "Last Quarter";
  }
  return "Waning Crescent";
}

/**
 * Generates the last 30 days of moon phase history combined with study activity.
 */
export function generatePast30DaysMoonPhases(
  dailyLogsMap: Record<string, { reviewsCount?: number; readingSeconds?: number }>,
  endDate: Date = new Date()
): {
  phases: MoonPhaseInfo[];
  streakDays: number;
  currentPhase: { en: string; fraction: number };
} {
  const phases: MoonPhaseInfo[] = [];
  let streak = 0;
  let streakBroken = false;

  // Generate 30 days starting from 29 days ago up to today
  for (let i = 29; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);

    const dateKey = d.toISOString().split("T")[0];
    const log = dailyLogsMap[dateKey];
    const reviewsCount = log?.reviewsCount || 0;
    const readingMinutes = Math.round((log?.readingSeconds || 0) / 60);
    const hasActivity = reviewsCount > 0 || readingMinutes > 0;

    const fraction = getMoonPhaseFraction(d);
    const name = getMoonPhaseName(fraction);

    phases.push({
      date: dateKey,
      dayOfMonth: d.getDate(),
      phaseFraction: Number(fraction.toFixed(3)),
      phaseName: name,
      hasActivity,
      reviewsCount,
      readingMinutes,
    });
  }

  // Calculate current streak backwards from today
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].hasActivity) {
      if (!streakBroken) streak++;
    } else {
      // If today has no activity yet, don't break streak if yesterday was active
      if (i === phases.length - 1) {
        continue;
      }
      streakBroken = true;
    }
  }

  const todayFraction = getMoonPhaseFraction(endDate);
  const currentPhase = {
    en: getMoonPhaseName(todayFraction),
    fraction: Number(todayFraction.toFixed(3)),
  };

  return { phases, streakDays: streak, currentPhase };
}
