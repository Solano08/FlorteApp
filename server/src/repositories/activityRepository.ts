import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';

interface ContributionAggregate {
  activity_date: string;
  contributions: number;
}

export const activityRepository = {
  async recordLogin(userId: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO user_login_activity (user_id, activity_date, login_count, last_login)
       VALUES (:userId, CURDATE(), 1, NOW())
       ON DUPLICATE KEY UPDATE login_count = login_count + 1, last_login = NOW()`,
      { userId }
    );
  },

  async getRecentLoginDates(userId: string, limitDays: number): Promise<string[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT activity_date
       FROM user_login_activity
       WHERE user_id = :userId
       ORDER BY activity_date DESC
       LIMIT ${Math.max(1, Math.min(limitDays, 120))}`,
      { userId }
    );
    return rows.map((row) => row.activity_date as string);
  },

  async countActiveProjects(userId: string): Promise<number> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM project_members pm
       INNER JOIN projects p ON p.id = pm.project_id
       WHERE pm.user_id = :userId
         AND p.status IN ('draft','in_progress')`,
      { userId }
    );
    return Number(rows[0]?.total ?? 0);
  },

  async hasAnyProjectMembership(userId: string): Promise<boolean> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT 1
       FROM project_members
       WHERE user_id = :userId
       LIMIT 1`,
      { userId }
    );
    return rows.length > 0;
  },

  async sumContributionsSince(userId: string, startDate: string): Promise<number> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(contribution_points), 0) AS total
       FROM project_activity_logs
       WHERE user_id = :userId
         AND activity_date >= :startDate`,
      { userId, startDate }
    );
    return Number(rows[0]?.total ?? 0);
  },

  async getContributionHeatmap(userId: string, startDate: string): Promise<Array<{ date: string; contributions: number }>> {
    const [rows] = await getPool().query<RowDataPacket[] & ContributionAggregate[]>(
      `SELECT activity_date, SUM(contribution_points) AS contributions
       FROM project_activity_logs
       WHERE user_id = :userId
         AND activity_date >= :startDate
       GROUP BY activity_date
       ORDER BY activity_date ASC`,
      { userId, startDate }
    );
    return rows.map((row) => ({
      date: row.activity_date,
      contributions: Number(row.contributions ?? 0)
    }));
  },

  async recordProjectContribution(input: {
    userId: string;
    projectId: string;
    activityDate?: Date;
    contributionPoints?: number;
    description?: string | null;
  }): Promise<void> {
    const id = crypto.randomUUID();
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO project_activity_logs (id, user_id, project_id, activity_date, contribution_points, description)
       VALUES (:id, :userId, :projectId, :activityDate, :contributionPoints, :description)`,
      {
        id,
        userId: input.userId,
        projectId: input.projectId,
        activityDate: input.activityDate ? input.activityDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        contributionPoints: input.contributionPoints ?? 1,
        description: input.description ?? null
      }
    );
  }
};
