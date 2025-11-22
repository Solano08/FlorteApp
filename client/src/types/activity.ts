export interface ContributionPoint {
  date: string;
  contributions: number;
}

export interface ActivitySummary {
  contributionsThisWeek: number;
  activeProjects: number;
  streakDays: number;
  hasProjectActivity: boolean;
}

export interface ActivityOverview {
  summary: ActivitySummary;
  heatmap: ContributionPoint[];
}
