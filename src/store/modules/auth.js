import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import { secureStore, secureRetrieve, clearAuthStorage } from '@/services/cryptoService';
import { isTokenExpired, decodeToken } from '@/utils/tokenManager';

const state = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const getters = {
  currentUser: (state) => state.user,
  isAuthenticated: (state) => state.isAuthenticated,
  userId: (state) => state.user ? (state.user.idUser || state.user.userId) : null,
  username: (state) => state.user ? (state.user.login || state.user.username) : null,
  userEmail: (state) => state.user ? state.user.email : null,
  accessToken: (state) => state.accessToken,
  isLoading: (state) => state.loading,
  error: (state) => state.error,
  hasRole: (state) => (role) => {
    if (!state.user || !state.user.roles) return false;
    return state.user.roles.includes(role);
  }
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
    state.isAuthenticated = !!user;
  },
  SET_TOKENS(state, { accessToken, refreshToken }) {
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
  },
  SET_ACCESS_TOKEN(state, accessToken) {
    state.accessToken = accessToken;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  CLEAR_AUTH(state) {
    state.user = null;
    state.accessToken = null;
    state.refreshToken = null;
    state.isAuthenticated = false;
    state.error = null;
  }
};

const actions = {
  /**
   * Login action
   */
  async login({ commit }, { username, password }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        login: username,
        password
      });
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Store in Vuex
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      // Securely store in localStorage (encrypted)
      secureStore('authToken', accessToken);
      secureStore('refreshToken', refreshToken);
      secureStore('authUser', user);
      
      commit('SET_LOADING', false);
      return { success: true, user };
    } catch (error) {
      const errorMessage = (error.response && error.response.data && error.response.data.message) || 'Login failed. Please check your credentials.';
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Logout action
   */
  async logout({ commit, state }) {
    try {
      // Optionally call backend to revoke refresh token
      if (state.refreshToken) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          refreshToken: state.refreshToken
        }).catch(() => {
          // Ignore errors - logout anyway
        });
      }
    } finally {
      // Clear Vuex state
      commit('CLEAR_AUTH');
      
      // Clear localStorage
      clearAuthStorage();
    }
  },
  
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken({ commit, state }) {
    if (!state.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken: state.refreshToken
      });
      
      const { accessToken } = response.data;
      
      // Update tokens
      commit('SET_ACCESS_TOKEN', accessToken);
      secureStore('authToken', accessToken);
      
      return accessToken;
    } catch (error) {
      // Refresh token invalid or expired - logout
      commit('CLEAR_AUTH');
      clearAuthStorage();
      throw error;
    }
  },
  
  /**
   * Validate and restore session from localStorage
   */
  async restoreSession({ commit }) {
    try {
      const accessToken = secureRetrieve('authToken');
      const refreshToken = secureRetrieve('refreshToken');
      const user = secureRetrieve('authUser');
      
      if (!accessToken || !user) {
        return false;
      }
      
      // Check if access token is expired
      if (isTokenExpired(accessToken)) {
        // Try to refresh
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken
            });
            
            const newAccessToken = response.data.accessToken;
            commit('SET_USER', user);
            commit('SET_TOKENS', { accessToken: newAccessToken, refreshToken });
            secureStore('authToken', newAccessToken);
            
            return true;
          } catch (error) {
            // Refresh failed - clear session
            clearAuthStorage();
            return false;
          }
        }
        return false;
      }
      
      // Token still valid - restore session
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      return true;
    } catch (error) {
      console.error('Session restore error:', error);
      clearAuthStorage();
      return false;
    }
  },
  
  /**
   * Update user profile in store
   */
  updateUser({ commit }, user) {
    commit('SET_USER', user);
    secureStore('authUser', user);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
