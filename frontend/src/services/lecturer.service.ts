import api from './api';

export const lecturerService = {
  getAll: async (params?: { search?: string; departmentId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/lecturers', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/lecturers/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/lecturers', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/lecturers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/lecturers/${id}`);
    return response.data;
  },

  getCourses: async (id: string) => {
    const response = await api.get(`/lecturers/${id}/courses`);
    return response.data;
  },
};
