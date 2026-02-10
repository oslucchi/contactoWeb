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
    if (error.response && error.response.status === 401) {
      console.error('[Auth Interceptor] 401 Unauthorized:', originalRequest.url);
      
      // Don't retry login/refresh endpoints
      if (originalRequest.url.includes('/auth/login') || 
          originalRequest.url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          console.log('[Auth Interceptor] Attempting token refresh...');
          // Try to refresh the token
          await store.dispatch('auth/refreshAccessToken');
          const newToken = store.getters['auth/accessToken'];
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log('[Auth Interceptor] Retrying request with new token');
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('[Auth Interceptor] Token refresh failed, redirecting to login');
          // Refresh failed - logout and redirect to login
          await store.dispatch('auth/logout');
          router.push({ name: 'Login', query: { redirect: router.currentRoute.fullPath } });
          return Promise.reject(refreshError);
        }
      } else {
        // Already retried once, logout
        console.error('[Auth Interceptor] Retry failed, logging out');
        await store.dispatch('auth/logout');
        router.push({ name: 'Login' });
        return Promise.reject(error);
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
