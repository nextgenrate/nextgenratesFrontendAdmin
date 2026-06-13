import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://nextgenratesbackend-production.up.railway.app/api';
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(new Error(err.response?.data?.message || err.message || 'Request failed'))
);

// ─── Admin Auth ────────────────────────────────────────────────
export const adminLogin = d => api.post('/admin/login', d);
export const adminLogout = () => api.post('/admin/logout');

// ─── Dashboard ─────────────────────────────────────────────────
export const getDashboard = (params) => api.get('/admin/dashboard', { params });
export const exportData = (resource) => api.get(`/admin/export/${resource}`, { responseType: 'blob' });

// ─── Rates ─────────────────────────────────────────────────────
export const getRates = (params) => api.get('/admin/rates', { params });
export const createRate = d => api.post('/admin/rates', d);
export const updateRate = (id, d) => api.put(`/admin/rates/${id}`, d);
export const deleteRate = id => api.delete(`/admin/rates/${id}`);
export const bulkUploadRates   = fd => api.post('/admin/rates/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadRateTemplate = () =>
  api.get('/admin/rates/bulk-template', { responseType: 'blob' }).then(blob => {
    const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
    const a = document.createElement('a');
    a.href = url; a.download = 'NGR_Rate_Upload_Template.xlsx';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
  });

// ─── KYC ───────────────────────────────────────────────────────
export const getKycList = (params) => api.get('/admin/kyc', { params });
export const approveKyc = (userId, d) => api.post(`/admin/kyc/${userId}/approve`, d);
export const rejectKyc = (userId, d) => api.post(`/admin/kyc/${userId}/reject`, d);
export const requestResubmit = (userId, d) => api.post(`/admin/kyc/${userId}/resubmit`, d);

// ─── Users ─────────────────────────────────────────────────────
export const getUsers = (params) => api.get('/admin/users', { params });
export const createUser = d => api.post('/admin/users', d);
export const updateUser = (id, d) => api.put(`/admin/users/${id}`, d);
export const suspendUser = id => api.post(`/admin/users/${id}/suspend`);
export const getUserActivity = (id) => api.get(`/admin/users/${id}/activity`);

// ─── Bookings ──────────────────────────────────────────────────
export const getAdminBookings = (params) => api.get('/admin/bookings', { params });
export const updateBookingStatus = (id, d) => api.put(`/admin/bookings/${id}/status`, d);

// ─── Enquiries ─────────────────────────────────────────────────
export const getAdminEnquiries = (params) => api.get('/admin/enquiries', { params });
export const respondEnquiry = (id, d) => api.post(`/admin/enquiries/${id}/respond`, d);

// ─── Analytics ─────────────────────────────────────────────────
export const getAnalytics = (params) => api.get('/admin/analytics', { params });
export const getSearchActivity = (params) => api.get('/admin/search-activity', { params });

// ─── Ports ─────────────────────────────────────────────────────
export const getPorts = (params) => api.get('/admin/ports', { params });
export const createPort = d => api.post('/admin/ports', d);
export const updatePort = (id, d) => api.put(`/admin/ports/${id}`, d);

export default api;

// ─── Registrations ─────────────────────────────────────────────
export const getRegistrations    = (params) => api.get('/admin/registrations', { params });
export const approveRegistration = (userId) => api.patch(`/admin/registrations/${userId}/approve`);
export const rejectRegistration  = (userId, reason) => api.patch(`/admin/registrations/${userId}/reject`, { reason });

// ─── Aliases for admin page imports ─────────────────────────────updateBooking
// BookingsPage uses: getBookings, updateBooking
export const getBookings   = (params) => api.get('/admin/bookings', { params });
export const updateBooking = (id, d)  => api.patch(`/admin/bookings/${id}`, d);

// KycPage uses: reviewKyc, adminVerifyGst
export const reviewKyc      = (userId, d) => api.patch(`/admin/kyc/${userId}`, d);
export const adminVerifyGst = (userId, d) => api.post(`/admin/kyc/verify-gst/${userId}`, d);

// OtherPages uses: getUserSearches, getEnquiries, updateEnquiry
export const getUserSearches = (userId, params) => api.get(`/admin/users/${userId}/searches`, { params });
export const getEnquiries    = (params) => api.get('/admin/enquiries', { params });
export const updateEnquiry   = (id, d)  => api.patch(`/admin/enquiries/${id}`, d);

// Reset KYC (super admin)
export const resetUserKyc = (userId) => api.patch(`/admin/registrations/${userId}/reset-kyc`);
export const deactivateRegistration = (userId, reason) =>
  api.patch(`/admin/registrations/${userId}/deactivate`, { reason });

export const deleteRegistration = (userId) =>
  api.delete(`/admin/registrations/${userId}`);

// Add to admin services/api.js
export const getAirRates        = (params) => api.get('/admin/air-rates', { params });
export const createAirRate      = (d)      => api.post('/admin/air-rates', d);
export const updateAirRate      = (id, d)  => api.put(`/admin/air-rates/${id}`, d);
export const deleteAirRate      = (id)     => api.delete(`/admin/air-rates/${id}`);
export const bulkUploadAirRates = (fd)     => api.post('/admin/air-rates/bulk', fd, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const downloadAirRateTemplate = () =>
  api.get('/admin/air-rates/template', { responseType: 'blob' }).then(blob => {
    const url = URL.createObjectURL(new Blob([blob]));
    const a = document.createElement('a');
    a.href = url; a.download = 'NGR_Air_Rate_Template.xlsx';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
  });

  
