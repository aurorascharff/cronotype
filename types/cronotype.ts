export type ArchetypeId =
  | 'vampire'
  | 'last-call-shipper'
  | 'sunrise-sniper'
  | 'lunch-bandit'
  | 'weekend-warrior'
  | 'nine-to-fiver'
  | 'insomniac-maintainer'
  | 'drifter'
  | 'touch-grass';

export type ArchetypeTheme = {
  /** Primary accent color (hex). */
  accent: string;
  /** Secondary accent for gradients (hex). */
  accent2: string;
  /** Card background gradient stops, light + dark. CSS color-mix-friendly. */
  bgLight: string;
  bgDark: string;
};

export type Archetype = {
  id: ArchetypeId;
  name: string;
  /** What the classifier saw. One sentence, descriptive. */
  tagline: string;
  /** What it says about the person. One sentence, dry. */
  meaning: string;
  /** Visual theme. */
  theme: ArchetypeTheme;
};

export type HourStats = {
  aiScore: number;
  aiStampedCount: number;
  hourly: number[];
  weekday: number[];
  total: number;
  peakHour: number;
  pctNocturnal: number;
  pctSunrise: number;
  pctBusiness: number;
  pctWeekend: number;
  hourlyVariance: number;
  isBimodal: boolean;
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
  createdAt: string;
  fetchedAtDate?: string;
};

export type CronotypeResult = {
  profile: ProfileSummary;
  window: Window;
  stats: HourStats;
  archetype: Archetype;
  percentile: number;
};
