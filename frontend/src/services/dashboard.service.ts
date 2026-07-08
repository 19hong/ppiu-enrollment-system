import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivities: async (params?: { limit?: number }) => {
    const response = await api.get('/dashboard/recent-activities', { params });
    return response.data;
  },

  getEnrollmentChart: async (params?: { period?: string }) => {
    const response = await api.get('/dashboard/enrollment-chart', { params });
    return response.data;
  },

  getRevenueChart: async (params?: { period?: string }) => {
    const response = await api.get('/dashboard/revenue-chart', { params });
    return response.data;
  },

  getUpcomingEvents: async (params?: { limit?: number }) => {
    const response = await api.get('/dashboard/upcoming-events', { params });
    return response.data;
  },

  getTopPrograms: async (params?: { limit?: number }) => {
    const response = await api.get('/dashboard/top-programs', { params });
    return response.data;
  },
};
