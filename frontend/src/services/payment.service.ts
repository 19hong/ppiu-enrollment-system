import api from './api';

export const paymentService = {
  getAll: async (params?: { search?: string; status?: string; studentId?: string; type?: string; page?: number; limit?: number }) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  processPayment: async (id: string, data: any) => {
    const response = await api.post(`/payments/${id}/process`, data);
    return response.data;
  },

  generateInvoice: async (id: string) => {
    const response = await api.get(`/payments/${id}/invoice`);
    return response.data;
  },
};
