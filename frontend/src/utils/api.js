import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// ──────────────────────────────────────────────
// Create Axios instance with base URL
// ──────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ──────────────────────────────────────────────
// Request Interceptor — Attach Bearer token to every request
// ──────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────
// Response Interceptor — Auto-logout on 401 (expired/invalid token)
// ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't clear on login/register failures (those are auth attempts, not expired tokens)
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Auth endpoints
// ──────────────────────────────────────────────
export const loginApi = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerApi = (name, email, password, role) =>
  api.post('/auth/register', { name, email, password, role });

export const getMeApi = () => api.get('/auth/me');

// ──────────────────────────────────────────────
// Phase endpoints
// ──────────────────────────────────────────────
export const getActivePhase = () => api.get('/phase');
export const setActivePhase = (activePhase) => api.put('/phase', { activePhase });

// ──────────────────────────────────────────────
// Team endpoints
// ──────────────────────────────────────────────
export const getTeams = () => api.get('/teams');
export const getTeamByNo = (teamNo) => api.get(`/teams/${teamNo}`);
export const createTeam = (data) => api.post('/teams/create', data);
export const joinTeam = (data) => api.post('/teams/join', data);
export const deleteTeam = (id) => api.delete(`/teams/${id}`);

// ──────────────────────────────────────────────
// Submission endpoints
// ──────────────────────────────────────────────
// Note: submitPhase sends FormData (file upload), so Content-Type is NOT set
// — Axios will auto-set multipart/form-data with the correct boundary
export const submitPhase = (formData) => {
  const stored = localStorage.getItem('user');
  const token = stored ? JSON.parse(stored).token : null;
  return axios.post(`${API_URL}/submissions/submit`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      // Content-Type intentionally omitted so Axios sets multipart/form-data
    },
  });
};
export const gradeSubmission = (id, data) => api.post(`/submissions/grade/${id}`, data);
export const getTeamSubmissions = (teamNo) => api.get(`/submissions/${teamNo}`);
export const getTeamReport = (teamNo) => api.get(`/submissions/report/${teamNo}`);
export const downloadPdfReport = (teamNo) => {
  const stored = localStorage.getItem('user');
  const token = stored ? JSON.parse(stored).token : null;
  return axios.get(`${API_URL}/submissions/report/${teamNo}/pdf`, {
    responseType: 'blob',
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

// ──────────────────────────────────────────────
// Meeting endpoints
// ──────────────────────────────────────────────
export const getMeetings = () => api.get('/meetings');
export const requestMeeting = (data) => api.post('/meetings', data);
export const updateMeetingStatus = (id, status) =>
  api.put(`/meetings/${id}/status`, { status });

// ──────────────────────────────────────────────
// Admin endpoints
// ──────────────────────────────────────────────
export const getUsers = () => api.get('/auth/users');

// ──────────────────────────────────────────────
// Profile endpoints
// ──────────────────────────────────────────────
export const getProfile = () => api.get('/profile/me');
export const updateProfile = (data) => api.put('/profile/update', data);

// ──────────────────────────────────────────────
// Subject endpoints
// ──────────────────────────────────────────────
export const getSubjects = () => api.get('/subjects');
export const createSubject = (data) => api.post('/subjects', data);

export default api;
