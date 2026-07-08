import api from './api';

export const applicationService = {
  getAll: async (params?: { search?: string; status?: string; programId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const response = await api.patch(`/applications/${id}/status`, { status, notes });
    return response.data;
  },

  uploadDocument: async (id: string, file: File, type: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    const response = await api.post(`/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
