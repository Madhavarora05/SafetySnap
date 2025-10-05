import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Images API
export const uploadImage = async (formData) => {
  const response = await api.post('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getImages = async (filters = {}) => {
  const response = await api.get('/images', { params: filters });
  return response.data;
};

export const getImageById = async (id) => {
  const response = await api.get(`/images/${id}`);
  return response.data;
};

export const deleteImage = async (id) => {
  const response = await api.delete(`/images/${id}`);
  return response.data;
};

// Labels API
export const getLabels = async () => {
  const response = await api.get('/labels');
  return response.data;
};

export default api;
