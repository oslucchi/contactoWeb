# Contacto Authentication System

## Overview
Secure, enterprise-grade authentication system using JWT tokens, Vuex state management, and encrypted localStorage.

## Architecture

### Components
1. **Vuex Store** (`/src/store/modules/auth.js`)
   - Manages authentication state
   - Handles login/logout
   - Token refresh mechanism
   
2. **Auth Service** (`/src/services/cryptoService.js`)
   - Encrypts/decrypts data for localStorage
   - Secure storage management

3. **Token Manager** (`/src/utils/tokenManager.js`)
   - JWT token validation
   - Expiration checking
   - Token decoding

4. **Axios Interceptors** (`/src/middleware/axiosInterceptors.js`)
   - Automatically adds JWT to requests
   - Handles 401 errors
   - Auto-refreshes expired tokens

5. **Router Guards** (`/src/router/index.js`)
   - Protects routes requiring authentication
   - Redirects to login when needed
   - Restores sessions from localStorage

### Security Features
- ✅ **Encrypted localStorage** - Sensitive data encrypted with AES
- ✅ **JWT tokens** - Industry-standard authentication
- ✅ **Token refresh** - Automatic token renewal
- ✅ **Secure headers** - Authorization Bearer tokens
- ✅ **Session restoration** - Survives page refresh
- ✅ **Auto-logout** - On token expiry or errors

## Usage

### Login
```javascript
// User submits credentials
await this.$store.dispatch('auth/login', {
  username: 'john',
  password: 'password123'
});
```

### Logout
```javascript
await this.$store.dispatch('auth/logout');
this.$router.push({ name: 'Login' });
```

### Access User Data
```javascript
// In components
import { mapGetters } from 'vuex';

computed: {
  ...mapGetters('auth', ['currentUser', 'userId', 'isAuthenticated'])
}

// Or directly
this.$store.getters['auth/userId']
this.$store.getters['auth/currentUser']
```

### Protected Routes
```javascript
// In router/index.js
{
  path: '/persons',
  component: PersonsList,
  meta: { requiresAuth: true }  // Requires authentication
}
```

## Backend Requirements

### Endpoints Needed

#### 1. Login
```
POST /auth/login
Body: { username: string, password: string }
Response: {
  user: {
    userId: number,
    username: string,
    email: string,
    roles?: string[]
  },
  accessToken: string,
  refreshToken: string
}
```

#### 2. Refresh Token
```
POST /auth/refresh-token
Body: { refreshToken: string }
Response: {
  accessToken: string
}
```

#### 3. Logout (optional)
```
POST /auth/logout
Body: { refreshToken: string }
Response: { success: boolean }
```

### JWT Token Structure
```javascript
{
  userId: 1,
  username: "john",
  email: "john@example.com",
  roles: ["user", "admin"],
  iat: 1234567890,  // Issued at
  exp: 1234569690   // Expiration (30 mins from iat)
}
```

## Flow Diagram

```
1. User visits app
   ↓
2. Router guard checks authentication
   ↓
3. If no auth → Redirect to /login
   ↓
4. User enters credentials
   ↓
5. POST /auth/login
   ↓
6. Backend validates & returns JWT + user
   ↓
7. Store tokens in Vuex + encrypted localStorage
   ↓
8. Redirect to requested page
   ↓
9. All API calls include JWT in Authorization header
   ↓
10. Token expires → Auto-refresh using refresh token
    ↓
11. Refresh fails → Logout & redirect to login
```

## Future Enhancements (Phase 2)

### Two-Factor Authentication (2FA)
- Modify login flow to support 2FA step
- Add `/auth/verify-2fa` endpoint
- Create TwoFactorAuth.vue component

### Role-Based Access Control
- Check user roles in router guards
- Conditionally show/hide UI elements
- Backend validates permissions

### Session Management
- Track active sessions
- Force logout from all devices
- Activity tracking

## Configuration

### Environment Variables
Create `.env` file:
```
VUE_APP_CRYPTO_SECRET=your-secret-key-here
VUE_APP_API_BASE_URL=http://localhost:3000
```

## Testing

### Manual Testing
1. Navigate to app → Should redirect to /login
2. Enter credentials → Should login and redirect
3. Refresh page → Should stay logged in
4. Click logout → Should clear session
5. Try accessing protected route → Should redirect to login

### Development Tips
- Check browser console for auth logs
- Inspect localStorage (encrypted data)
- Use Vue DevTools to inspect Vuex store
- Monitor Network tab for JWT in requests

## Troubleshooting

### "Token expired" errors
- Check backend token expiration time
- Ensure refresh token endpoint works
- Verify token refresh logic in interceptors

### Session not persisting
- Check localStorage encryption/decryption
- Verify restoreSession is called in router guard
- Check browser localStorage for auth data

### Login not working
- Verify backend endpoint URL
- Check CORS settings
- Inspect network request/response
- Check credentials format

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **HTTPS only** - In production, enforce HTTPS
3. **Short-lived tokens** - Access tokens expire quickly (15-30 mins)
4. **Secure cookies** - Use httpOnly cookies for refresh tokens (backend)
5. **CORS configuration** - Restrict origins in production
6. **Input validation** - Sanitize all user inputs
7. **Rate limiting** - Implement on backend
8. **Audit logging** - Log authentication events

## Files Created

```
src/
├── store/
│   ├── index.js (Vuex store)
│   └── modules/
│       └── auth.js (Auth module)
├── services/
│   └── cryptoService.js (Encryption)
├── utils/
│   └── tokenManager.js (JWT utilities)
├── middleware/
│   └── axiosInterceptors.js (HTTP interceptors)
└── views/
    └── Login.vue (Login screen)
```

## Support

For issues or questions, contact the development team.
