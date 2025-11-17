import { apiClient } from './apiClient';
import { Profile } from '../types/profile';
import { UserRole } from '../types/auth';
import { FeedReport, ReportStatus } from '../types/feed';
import { normalizeFeedReport, normalizeProfile } from '../utils/media';

export const adminService = {
  async listUsers(): Promise<Profile[]> {
    const { data } = await apiClient.get<{ success: boolean; users: Profile[] }>('/admin/users');
    return data.users.map((user) => normalizeProfile(user));
  },

  async updateRole(userId: string, role: UserRole): Promise<Profile> {
    const { data } = await apiClient.patch<{ success: boolean; user: Profile }>(`/admin/users/${userId}/role`, {
      role
    });
    return normalizeProfile(data.user);
  },

  async updateStatus(userId: string, isActive: boolean): Promise<Profile> {
    const { data } = await apiClient.patch<{ success: boolean; user: Profile }>(`/admin/users/${userId}/status`, {
      isActive
    });
    return normalizeProfile(data.user);
  },

  async updateUser(
    userId: string,
    payload: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
      headline?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      instagramUrl?: string | null;
      githubUrl?: string | null;
      facebookUrl?: string | null;
      contactEmail?: string | null;
      xUrl?: string | null;
    }
  ): Promise<Profile> {
    const { data } = await apiClient.put<{ success: boolean; user: Profile }>(`/admin/users/${userId}`, payload);
    return normalizeProfile(data.user);
  },

  async listReports(): Promise<FeedReport[]> {
    const { data } = await apiClient.get<{ success: boolean; reports: FeedReport[] }>('/admin/reports');
    return data.reports.map((report) => normalizeFeedReport(report));
  },

  async updateReportStatus(reportId: string, status: ReportStatus): Promise<FeedReport> {
    const { data } = await apiClient.patch<{ success: boolean; report: FeedReport }>(`/admin/reports/${reportId}`, {
      status
    });
    return normalizeFeedReport(data.report);
  }
};
