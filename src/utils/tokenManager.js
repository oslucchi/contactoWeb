/**
 * Decodes a JWT token (without verification - server handles that)
 */
export function decodeToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * Checks if a token is expired
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

/**
 * Gets time until token expiration in milliseconds
 */
export function getTokenExpirationTime(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime);
}

/**
 * Checks if token will expire soon (within minutes)
 */
export function willExpireSoon(token, minutesThreshold = 5) {
  const timeLeft = getTokenExpirationTime(token);
  const thresholdMs = minutesThreshold * 60 * 1000;
  
  return timeLeft > 0 && timeLeft <= thresholdMs;
}
