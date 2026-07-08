import api from './api';

export const courseService = {
  getAll: async (params?: { search?: string; programId?: string; departmentId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};
