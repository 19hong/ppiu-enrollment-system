import api from './api';

export const announcementService = {
  getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },

  publish: async (id: string) => {
    const response = await api.patch(`/announcements/${id}/publish`);
    return response.data;
  },

  archive: async (id: string) => {
    const response = await api.patch(`/announcements/${id}/archive`);
    return response.data;
  },
};
