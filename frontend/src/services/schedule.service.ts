import api from './api';

export const scheduleService = {
  getAll: async (params?: { search?: string; courseId?: string; lecturerId?: string; day?: string; page?: number; limit?: number }) => {
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/schedules', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  },
};
