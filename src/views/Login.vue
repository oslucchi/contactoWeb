<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.png" alt="Contacto Logo" class="logo" />
        <h1>Contacto</h1>
        <p class="subtitle">Action manager at your fingertips</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username or Email</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            autocomplete="username"
            placeholder="Enter your username"
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            required
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else>Logging in...</span>
        </button>
      </form>
      
      <div class="login-footer">
        <p>&copy; 2026 Contacto. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      }
    };
  },
  computed: {
    ...mapGetters('auth', ['isLoading', 'error']),
    loading() {
      return this.isLoading;
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    
    async handleLogin() {
      if (!this.credentials.username || !this.credentials.password) {
        return;
      }
      
      const result = await this.login(this.credentials);
      
      if (result.success) {
        // Redirect to original destination or default page
        const redirect = this.$route.query.redirect || '/persons';
        this.$router.push(redirect);
      }
    }
  },
  mounted() {
    // Clear any existing errors when component mounts
    this.$store.commit('auth/SET_ERROR', null);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
  font-style: italic;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.login-footer p {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>
