"use client";

type Platform = "youtube" | "spotify" | "apple" | "amazon";

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  platform: Platform;
}

const TOKEN_PREFIX = "playlist_tracker_token_";
const TOKEN_EXPIRY_PREFIX = "playlist_tracker_expiry_";

/**
 * Store OAuth token in localStorage with expiration
 */
export function storeToken(platform: Platform, tokenData: TokenData): void {
  try {
    const key = `${TOKEN_PREFIX}${platform}`;
    const expiryKey = `${TOKEN_EXPIRY_PREFIX}${platform}`;
    
    // Store token data
    localStorage.setItem(key, JSON.stringify(tokenData));
    
    // Store expiration time (default 1 hour if not provided)
    const expiresAt = tokenData.expiresAt || Date.now() + 3600000; // 1 hour default
    localStorage.setItem(expiryKey, expiresAt.toString());
    
    console.log(`Token stored for ${platform}`);
  } catch (error) {
    console.error(`Error storing token for ${platform}:`, error);
  }
}

/**
 * Retrieve stored token for a platform
 */
export function getToken(platform: Platform): TokenData | null {
  try {
    const key = `${TOKEN_PREFIX}${platform}`;
    const expiryKey = `${TOKEN_EXPIRY_PREFIX}${platform}`;
    
    const tokenDataStr = localStorage.getItem(key);
    const expiryStr = localStorage.getItem(expiryKey);
    
    if (!tokenDataStr) {
      return null;
    }
    
    const tokenData: TokenData = JSON.parse(tokenDataStr);
    const expiresAt = expiryStr ? parseInt(expiryStr, 10) : null;
    
    // Check if token is expired
    if (expiresAt && Date.now() > expiresAt) {
      console.log(`Token expired for ${platform}, removing...`);
      removeToken(platform);
      return null;
    }
    
    return tokenData;
  } catch (error) {
    console.error(`Error retrieving token for ${platform}:`, error);
    return null;
  }
}

/**
 * Check if user is authenticated for a platform
 */
export function isAuthenticated(platform: Platform): boolean {
  const token = getToken(platform);
  return token !== null;
}

/**
 * Remove stored token for a platform
 */
export function removeToken(platform: Platform): void {
  try {
    const key = `${TOKEN_PREFIX}${platform}`;
    const expiryKey = `${TOKEN_EXPIRY_PREFIX}${platform}`;
    
    localStorage.removeItem(key);
    localStorage.removeItem(expiryKey);
    
    console.log(`Token removed for ${platform}`);
  } catch (error) {
    console.error(`Error removing token for ${platform}:`, error);
  }
}

/**
 * Get token from cookie (set by API routes)
 */
export function getTokenFromCookie(platform: Platform): TokenData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cookieName = `${platform}_token`;
    const cookies = document.cookie.split('; ');
    const cookieRow = cookies.find(row => row.startsWith(`${cookieName}=`));
    
    if (!cookieRow) {
      console.log(`No cookie found for ${platform}`);
      return null;
    }
    
    const cookieValue = cookieRow.split('=').slice(1).join('='); // Handle values with = in them
    const decodedValue = decodeURIComponent(cookieValue);
    const tokenData = JSON.parse(decodedValue);
    
    console.log(`Found token in cookie for ${platform}`, { hasAccessToken: !!tokenData.accessToken });
    
    // Also store in localStorage for persistence
    storeToken(platform, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      platform,
    });
    
    console.log(`Token synced to localStorage for ${platform}`);
    return tokenData;
  } catch (error) {
    console.error(`Error reading cookie for ${platform}:`, error);
    return null;
  }
}

/**
 * Get all authenticated platforms
 */
export function getAuthenticatedPlatforms(): Platform[] {
  const platforms: Platform[] = ["youtube", "spotify", "apple", "amazon"];
  return platforms.filter(platform => isAuthenticated(platform));
}

/**
 * Clear all stored tokens
 */
export function clearAllTokens(): void {
  const platforms: Platform[] = ["youtube", "spotify", "apple", "amazon"];
  platforms.forEach(platform => removeToken(platform));
}

