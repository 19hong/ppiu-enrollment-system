import api from './api';

export const settingService = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  getByKey: async (key: string) => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },

  update: async (key: string, value: any) => {
    const response = await api.put(`/settings/${key}`, { value });
    return response.data;
  },

  updateBulk: async (settings: Record<string, any>) => {
    const response = await api.put('/settings/bulk', { settings });
    return response.data;
  },

  getAcademicYears: async () => {
    const response = await api.get('/settings/academic-years');
    return response.data;
  },

  getSemesters: async () => {
    const response = await api.get('/settings/semesters');
    return response.data;
  },
};
