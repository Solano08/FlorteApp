import { apiClient } from './apiClient';
import { normalizeFeedReport, normalizeProfile } from '../utils/media';
export const adminService = {
    async listUsers() {
        const { data } = await apiClient.get('/admin/users');
        return data.users.map((user) => normalizeProfile(user));
    },
    async updateRole(userId, role) {
        const { data } = await apiClient.patch(`/admin/users/${userId}/role`, {
            role
        });
        return normalizeProfile(data.user);
    },
    async updateStatus(userId, isActive) {
        const { data } = await apiClient.patch(`/admin/users/${userId}/status`, {
            isActive
        });
        return normalizeProfile(data.user);
    },
    async updateUser(userId, payload) {
        const { data } = await apiClient.put(`/admin/users/${userId}`, payload);
        return normalizeProfile(data.user);
    },
    async listReports() {
        const { data } = await apiClient.get('/admin/reports');
        return data.reports.map((report) => normalizeFeedReport(report));
    },
    async updateReportStatus(reportId, status) {
        const { data } = await apiClient.patch(`/admin/reports/${reportId}`, {
            status
        });
        return normalizeFeedReport(data.report);
    }
};
