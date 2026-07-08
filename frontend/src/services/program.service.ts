import api from './api';

export const programService = {
  getAll: async (params?: { search?: string; level?: string; departmentId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/programs', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/programs/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/programs', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/programs/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/programs/${id}`);
    return response.data;
  },
};
