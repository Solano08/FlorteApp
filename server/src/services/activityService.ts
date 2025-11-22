import { activityRepository } from '../repositories/activityRepository';
import { ActivityOverview } from '../types/activity';

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const differenceInDays = (later: Date, earlier: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcLater = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const utcEarlier = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((utcLater - utcEarlier) / msPerDay);
};

const computeStreak = (loginDates: string[]): number => {
  if (loginDates.length === 0) {
    return 0;
  }

  const today = new Date();
  let streak = 0;
  let previousDate: Date | null = null;

  for (const isoDate of loginDates) {
    const current = new Date(isoDate);
    if (Number.isNaN(current.getTime())) {
      continue;
    }

    if (streak === 0) {
      const diff = differenceInDays(today, current);
      if (diff > 1) {
        return 0;
      }
      streak = 1;
      previousDate = current;
      continue;
    }

    if (!previousDate) {
      previousDate = current;
      continue;
    }

    const diff = differenceInDays(previousDate, current);
    if (diff === 0) {
      continue;
    }
    if (diff === 1) {
      streak += 1;
      previousDate = current;
    } else {
      break;
    }
  }

  return streak;
};

export const activityService = {
  async recordLogin(userId: string): Promise<void> {
    await activityRepository.recordLogin(userId);
  },

  async recordProjectContribution(input: {
    userId: string;
    projectId: string;
    contributionPoints?: number;
    description?: string;
  }): Promise<void> {
    await activityRepository.recordProjectContribution({
      userId: input.userId,
      projectId: input.projectId,
      contributionPoints: input.contributionPoints,
      description: input.description
    });
  },

  async getProfileActivity(userId: string, weeks = 5): Promise<ActivityOverview> {
    const normalizedWeeks = Math.min(Math.max(weeks, 1), 12);
    const totalDays = normalizedWeeks * 7;
    const now = new Date();
    const heatmapStart = new Date(now);
    heatmapStart.setDate(now.getDate() - (totalDays - 1));
    const weeklyStart = new Date(now);
    weeklyStart.setDate(now.getDate() - 6);

    const [activeProjects, hasProjects, loginDates, contributionsWeek, rawHeatmap] = await Promise.all([
      activityRepository.countActiveProjects(userId),
      activityRepository.hasAnyProjectMembership(userId),
      activityRepository.getRecentLoginDates(userId, Math.max(totalDays, 30)),
      activityRepository.sumContributionsSince(userId, formatDate(weeklyStart)),
      activityRepository.getContributionHeatmap(userId, formatDate(heatmapStart))
    ]);

    const streakDays = computeStreak(loginDates);
    const heatmap = hasProjects ? rawHeatmap : [];

    return {
      summary: {
        contributionsThisWeek: hasProjects ? contributionsWeek : 0,
        activeProjects,
        streakDays,
        hasProjectActivity: hasProjects && heatmap.length > 0
      },
      heatmap
    };
  }
};
