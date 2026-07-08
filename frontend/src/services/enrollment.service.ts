import api from './api';

export const enrollmentService = {
  getAll: async (params?: { search?: string; status?: string; studentId?: string; courseId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/enrollments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/enrollments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/enrollments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/enrollments/${id}/status`, { status });
    return response.data;
  },
};
