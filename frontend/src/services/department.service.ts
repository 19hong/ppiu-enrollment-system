import api from './api';

export const departmentService = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};
