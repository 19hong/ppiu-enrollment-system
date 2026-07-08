import api from './api';

export const reportService = {
  getEnrollmentReport: async (params?: { departmentId?: string; programId?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/enrollment', { params });
    return response.data;
  },

  getPaymentReport: async (params?: { status?: string; type?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/payment', { params });
    return response.data;
  },

  getGradeReport: async (params?: { courseId?: string; programId?: string; academicYear?: string }) => {
    const response = await api.get('/reports/grades', { params });
    return response.data;
  },

  getAttendanceReport: async (params?: { courseId?: string; departmentId?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/reports/attendance', { params });
    return response.data;
  },

  getStudentReport: async (params?: { status?: string; programId?: string; departmentId?: string }) => {
    const response = await api.get('/reports/students', { params });
    return response.data;
  },

  exportReport: async (type: string, format: string, params?: any) => {
    const response = await api.get(`/reports/export/${type}/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
