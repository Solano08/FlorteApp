"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityService = void 0;
const activityRepository_1 = require("../repositories/activityRepository");
const formatDate = (date) => date.toISOString().slice(0, 10);
const differenceInDays = (later, earlier) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const utcLater = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
    const utcEarlier = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
    return Math.round((utcLater - utcEarlier) / msPerDay);
};
const computeStreak = (loginDates) => {
    if (loginDates.length === 0) {
        return 0;
    }
    const today = new Date();
    let streak = 0;
    let previousDate = null;
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
        }
        else {
            break;
        }
    }
    return streak;
};
exports.activityService = {
    async recordLogin(userId) {
        await activityRepository_1.activityRepository.recordLogin(userId);
    },
    async recordProjectContribution(input) {
        await activityRepository_1.activityRepository.recordProjectContribution({
            userId: input.userId,
            projectId: input.projectId,
            contributionPoints: input.contributionPoints,
            description: input.description
        });
    },
    async getProfileActivity(userId, weeks = 5) {
        const normalizedWeeks = Math.min(Math.max(weeks, 1), 12);
        const totalDays = normalizedWeeks * 7;
        const now = new Date();
        const heatmapStart = new Date(now);
        heatmapStart.setDate(now.getDate() - (totalDays - 1));
        const weeklyStart = new Date(now);
        weeklyStart.setDate(now.getDate() - 6);
        const [activeProjects, hasProjects, loginDates, contributionsWeek, rawHeatmap] = await Promise.all([
            activityRepository_1.activityRepository.countActiveProjects(userId),
            activityRepository_1.activityRepository.hasAnyProjectMembership(userId),
            activityRepository_1.activityRepository.getRecentLoginDates(userId, Math.max(totalDays, 30)),
            activityRepository_1.activityRepository.sumContributionsSince(userId, formatDate(weeklyStart)),
            activityRepository_1.activityRepository.getContributionHeatmap(userId, formatDate(heatmapStart))
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
