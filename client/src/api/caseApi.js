import axios from 'axios';

// Normalize API_BASE_URL: handles trailing slashes or base domain without /api
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
const API_BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const caseApi = {
  // Synthesize a new case (Easy, Medium, Hard)
  createCase: async (payload) => {
    const res = await apiClient.post('/cases', payload);
    return res.data;
  },

  // Retrieve case file & active player progress
  getCaseById: async (id) => {
    const res = await apiClient.get(`/cases/${id}`);
    return res.data;
  },

  // Examine & discover a clue
  discoverClue: async (id, clueId) => {
    const res = await apiClient.post(`/cases/${id}/clues/${clueId}/discover`);
    return res.data;
  },

  // Request the next progressive hint
  requestHint: async (id) => {
    const res = await apiClient.post(`/cases/${id}/hints`);
    return res.data;
  },

  // Submit prime suspect accusation
  submitAccusation: async (id, payload) => {
    const res = await apiClient.post(`/cases/${id}/accuse`, payload);
    return res.data;
  },

  // Fetch final results & culprit debrief for sealed case
  getCaseResult: async (id) => {
    const res = await apiClient.get(`/cases/${id}/result`);
    return res.data;
  },

  // Health status
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
};

export default caseApi;

