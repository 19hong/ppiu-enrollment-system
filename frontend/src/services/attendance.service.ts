import api from './api';

export const attendanceService = {
  getAll: async (params?: { search?: string; studentId?: string; courseId?: string; date?: string; status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  markAttendance: async (data: { courseId: string; date: string; records: { studentId: string; status: string }[] }) => {
    const response = await api.post('/attendance/batch', data);
    return response.data;
  },

  getAttendanceReport: async (params: { studentId?: string; courseId?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/attendance/report', { params });
    return response.data;
  },
};
