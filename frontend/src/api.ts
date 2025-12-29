import axios from 'axios';
import type {
  Collection,
  Sample,
  QualityReview,
  SupplierCommunication,
  User,
  QualityReviewStats,
  SupplierCommStats,
} from './types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Collections
export const collectionsAPI = {
  getAll: () => api.get<Collection[]>('/collections'),
  getById: (id: number) => api.get<Collection>(`/collections/${id}`),
  create: (data: Partial<Collection>) => api.post<Collection>('/collections', data),
  update: (id: number, data: Partial<Collection>) => api.put<Collection>(`/collections/${id}`, data),
  delete: (id: number) => api.delete(`/collections/${id}`),
};

// Samples
export const samplesAPI = {
  getAll: (params?: { collection_id?: number; status?: string }) =>
    api.get<Sample[]>('/samples', { params }),
  getByCollection: (collectionId: number) =>
    api.get<Sample[]>(`/samples?collection_id=${collectionId}`),
  getById: (id: number) => api.get<Sample>(`/samples/${id}`),
  create: (data: Partial<Sample>) => api.post<Sample>('/samples', data),
  update: (id: number, data: Partial<Sample>) => api.put<Sample>(`/samples/${id}`, data),
  delete: (id: number) => api.delete(`/samples/${id}`),
  getAuditTrail: (id: number) => api.get(`/samples/${id}/audit-trail`),
};

// Quality Reviews
export const qualityReviewsAPI = {
  getAll: (params?: { sample_id?: number; status?: string; severity?: string }) =>
    api.get<QualityReview[]>('/quality-reviews', { params }),
  getById: (id: number) => api.get<QualityReview>(`/quality-reviews/${id}`),
  create: (data: Partial<QualityReview>) => api.post<QualityReview>('/quality-reviews', data),
  update: (id: number, data: Partial<QualityReview>) =>
    api.put<QualityReview>(`/quality-reviews/${id}`, data),
  delete: (id: number) => api.delete(`/quality-reviews/${id}`),
  uploadPhotos: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return api.post(`/quality-reviews/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePhoto: (reviewId: number, photoId: number) =>
    api.delete(`/quality-reviews/${reviewId}/photos/${photoId}`),
  addComment: (id: number, data: { user_id: number; comment: string }) =>
    api.post(`/quality-reviews/${id}/comments`, data),
  getStats: () => api.get<QualityReviewStats>('/quality-reviews/stats/overview'),
};

// Supplier Communications
export const supplierCommsAPI = {
  getAll: (params?: { sample_id?: number; status?: string; supplier_name?: string }) =>
    api.get<SupplierCommunication[]>('/supplier-communications', { params }),
  getById: (id: number) => api.get<SupplierCommunication>(`/supplier-communications/${id}`),
  getOverdue: () => api.get<SupplierCommunication[]>('/supplier-communications/overdue'),
  getImportant: () => api.get<SupplierCommunication[]>('/supplier-communications/important'),
  create: (data: Partial<SupplierCommunication>) =>
    api.post<SupplierCommunication>('/supplier-communications', data),
  update: (id: number, data: Partial<SupplierCommunication>) =>
    api.put<SupplierCommunication>(`/supplier-communications/${id}`, data),
  delete: (id: number) => api.delete(`/supplier-communications/${id}`),
  uploadAttachments: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('attachments', file));
    return api.post(`/supplier-communications/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (commId: number, attachmentId: number) =>
    api.delete(`/supplier-communications/${commId}/attachments/${attachmentId}`),
  getStats: () => api.get<SupplierCommStats>('/supplier-communications/stats/overview'),
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
  uploadPhotos: (sampleId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return api.post(`/photos/samples/${sampleId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPhotos: (sampleId: number) => api.get(`/photos/samples/${sampleId}`),
  setMainPhoto: (photoId: number) => api.put(`/photos/${photoId}/set-main`),
  updateOrder: (photoId: number, display_order: number) => 
    api.put(`/photos/${photoId}/order`, { display_order }),
  deletePhoto: (photoId: number) => api.delete(`/photos/${photoId}`),
};

export default api;
