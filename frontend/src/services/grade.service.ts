import api from './api';

export const gradeService = {
  getAll: async (params?: { search?: string; studentId?: string; courseId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/grades', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/grades', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/grades/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },

  getTranscript: async (studentId: string) => {
    const response = await api.get(`/grades/transcript/${studentId}`);
    return response.data;
  },
};
