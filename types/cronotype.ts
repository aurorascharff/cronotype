export type ArchetypeId =
  | 'vampire'
  | 'sunrise-sniper'
  | 'lunch-bandit'
  | 'weekend-warrior'
  | 'nine-to-fiver'
  | 'insomniac-maintainer'
  | 'drifter'
  | 'touch-grass';

export type Archetype = {
  id: ArchetypeId;
  name: string;
  /** One sentence, second person, slightly mean. */
  tagline: string;
  /** Tailwind text-color class for the headline. */
  colorVar: string;
  /** Tailwind text-color class for the glow. */
  glowVar: string;
};

export type HourStats = {
  /** Array of 24 buckets, index = hour 0..23, value = commit count for that hour. */
  hourly: number[];
  /** Array of 7 buckets, 0 = Sunday .. 6 = Saturday. */
  weekday: number[];
  total: number;
  /** Most common hour, 0..23. */
  peakHour: number;
  /** Percent of commits in 0..4 (inclusive). */
  pctNocturnal: number;
  /** Percent of commits in 5..8 (inclusive). */
  pctSunrise: number;
  /** Percent of commits in 9..18 (inclusive). */
  pctBusiness: number;
  /** Percent of commits on Sat/Sun. */
  pctWeekend: number;
  /** Standard deviation of the hourly distribution as a percent. Lower = more disciplined. */
  hourlyVariance: number;
  /** True if the distribution has two clear humps separated by a quiet zone. */
  isBimodal: boolean;
  /** Timezone offset hours used to compute local time. May be null if unknown. */
  tzOffsetHours: number | null;
};

export type Window = '90d' | '1y' | 'all';

export type ProfileSummary = {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  publicRepos: number;
};

export type CronotypeResult = {
  profile: ProfileSummary;
  window: Window;
  stats: HourStats;
  archetype: Archetype;
  /** Percentile within all classified users for the dominant trait. 0..100. */
  percentile: number;
  /** Commits per yearly bucket for the history view. Keys are year strings. */
  history?: Array<{ year: number; stats: HourStats; archetypeId: ArchetypeId }>;
};
