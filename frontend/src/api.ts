import axios from 'axios';
import type {
  Collection,
  Sample,
  QualityReview,
  User,
  QualityReviewStats,
  SupplierCommunication
} from './types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper: zorgt dat er altijd een geldige token is
const ensureToken = async (): Promise<string | null> => {
  let token = localStorage.getItem('token');
  if (!token) {
    // Auto-login voor development
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'sophie.laurent@viktor-rolf.com',
        password: 'password123'
      });
      token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Auto-login failed:', err);
    }
  }
  return token;
};

// Request interceptor om altijd de token toe te voegen
api.interceptors.request.use(async (config) => {
  const token = await ensureToken();
  if (token && config.headers) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor om in te grijpen bij 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('API returned 401. Clearing token and forcing re-login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optioneel: redirect naar de login pagina, of herlaad zodat auto-login wekt
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Collections
export const collectionsAPI = {
  getAll: () => api.get<Collection[]>('/collections'),
  getById: (id: string | number) => api.get<Collection>(`/collections/${id}`),
  create: (data: Partial<Collection>) => api.post<Collection>('/collections', data),
  update: (id: string | number, data: Partial<Collection>) => api.put<Collection>(`/collections/${id}`, data),
  delete: (id: string | number) => api.delete(`/collections/${id}`),
};

// Samples
export const samplesAPI = {
  getAll: (params?: { collection_id?: string | number; status?: string }) =>
    api.get<Sample[]>('/samples', { params }),
  getByCollection: (collectionId: string | number) =>
    api.get<Sample[]>(`/samples?collection_id=${collectionId}`),
  getById: (id: string | number) => api.get<Sample>(`/samples/${id}`),
  create: (data: Partial<Sample>) => api.post<Sample>('/samples', data),
  update: (id: string | number, data: Partial<Sample>) => api.put<Sample>(`/samples/${id}`, data),
  delete: (id: string | number) => api.delete(`/samples/${id}`),
  getAuditTrail: (id: string | number) => api.get(`/samples/${id}/audit-trail`),
};

// Quality Reviews
export const qualityReviewsAPI = {
  getAll: (params?: { sample_id?: string | number; status?: string; severity?: string }) =>
    api.get<QualityReview[]>('/quality-reviews', { params }),
  getById: (id: string | number) => api.get<QualityReview>(`/quality-reviews/${id}`),
  create: (data: Partial<QualityReview>) => api.post<QualityReview>('/quality-reviews', data),
  update: (id: string | number, data: Partial<QualityReview>) =>
    api.put<QualityReview>(`/quality-reviews/${id}`, data),
  delete: (id: string | number) => api.delete(`/quality-reviews/${id}`),
  uploadPhotos: (id: string | number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return api.post(`/quality-reviews/${id}/photos`, formData);
  },
  deletePhoto: (reviewId: string | number, photoId: string | number) =>
    api.delete(`/quality-reviews/${reviewId}/photos/${photoId}`),
  addComment: (id: string | number, data: { user_id: string | number; comment: string }) =>
    api.post(`/quality-reviews/${id}/comments`, data),
  getStats: () => api.get<QualityReviewStats>('/quality-reviews/stats/overview'),
};



// Users
export const usersAPI = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Sample Photos
export const photosAPI = {
  uploadPhotos: async (sampleId: string | number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    // Gebruik de standaard 'api' instance zodat de interceptors hun werk doen
    return api.post(`/photos/samples/${sampleId}`, formData);
  },
  getPhotos: (sampleId: string | number) => api.get(`/photos/samples/${sampleId}`),
  setMainPhoto: async (photoId: string | number) => {
    return api.put(`/photos/${photoId}/set-main`, {});
  },
  updateOrder: async (photoId: string | number, display_order: number) => {
    return api.put(`/photos/${photoId}/order`, { display_order });
  },
  deletePhoto: async (photoId: string | number) => {
    return api.delete(`/photos/${photoId}`);
  },
};

// Manufacturers
export interface Manufacturer {
  id: string;
  name: string;
}

export const manufacturersAPI = {
  getAll: () => api.get<Manufacturer[]>('/manufacturers'),
  create: (name: string) => api.post<Manufacturer>('/manufacturers', { name }),
  update: (id: string, name: string, oldName?: string) => api.put<Manufacturer>(`/manufacturers/${id}`, { name, oldName }),
  delete: (id: string) => api.delete(`/manufacturers/${id}`),
};

// Supplier Communications
export const supplierCommsAPI = {
  getAll: (params?: { sample_id?: string; status?: string; supplier_name?: string }) =>
    api.get<SupplierCommunication[]>('/supplier-communications', { params }),
  getById: (id: number) => api.get<SupplierCommunication>(`/supplier-communications/${id}`),
  create: (data: Partial<SupplierCommunication>) =>
    api.post<SupplierCommunication>('/supplier-communications', data),
  update: (id: number, data: Partial<SupplierCommunication>) =>
    api.put<SupplierCommunication>(`/supplier-communications/${id}`, data),
  delete: (id: number) => api.delete(`/supplier-communications/${id}`),
  uploadAttachments: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('attachments', file));
    return api.post(`/supplier-communications/${id}/attachments`, formData);
  },
  deleteAttachment: (commId: number, attachmentId: number) =>
    api.delete(`/supplier-communications/${commId}/attachments/${attachmentId}`),
  getStats: () => api.get('/supplier-communications/stats/overview'),
};

export default api;
