import axios from 'axios';
import store from '@/store';
import router from '@/router';
import { willExpireSoon } from '@/utils/tokenManager';

/**
 * Request Interceptor
 * Adds JWT token to all requests and handles token refresh
 */
axios.interceptors.request.use(
  async (config) => {
    const token = store.getters['auth/accessToken'];
    
    if (token) {
      // Check if token will expire soon
      if (willExpireSoon(token, 5)) {
        try {
          // Refresh token proactively
          await store.dispatch('auth/refreshAccessToken');
          const newToken = store.getters['auth/accessToken'];
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // Refresh failed - will be handled by response interceptor
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors and token refresh
 */
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        await store.dispatch('auth/refreshAccessToken');
        const newToken = store.getters['auth/accessToken'];
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout and redirect to login
        await store.dispatch('auth/logout');
        router.push({ name: 'Login', query: { redirect: router.currentRoute.fullPath } });
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 403 Forbidden (insufficient permissions)
    if (error.response && error.response.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Optionally redirect to an access denied page
    }
    
    return Promise.reject(error);
  }
);

export default axios;
