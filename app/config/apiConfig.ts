/**
 * API Configuration
 * 
 * This file manages the configuration for different music platform APIs,
 * allowing easy switching between mock and real implementations.
 */

export interface ApiConfig {
  // Apple Music
  appleMusic: {
    useMock: boolean;
    keyId?: string;
    issuerId?: string;
    teamId?: string;
    privateKey?: string;
  };
  
  // Spotify
  spotify: {
    useMock: boolean;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  };
  
  // YouTube
  youtube: {
    useMock: boolean;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  
  // Amazon Music
  amazonMusic: {
    useMock: boolean;
    apiKey?: string;
  };
}

// Default configuration - uses mock services by default
const defaultConfig: ApiConfig = {
  appleMusic: {
    useMock: true,
    keyId: process.env.APPLE_MUSIC_KEY_ID,
    issuerId: process.env.APPLE_MUSIC_ISSUER_ID,
    teamId: process.env.APPLE_MUSIC_TEAM_ID,
    privateKey: process.env.APPLE_MUSIC_PRIVATE_KEY,
  },
  
  spotify: {
    useMock: true,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback/spotify',
  },
  
  youtube: {
    useMock: true,
    apiKey: process.env.YOUTUBE_API_KEY,
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  },
  
  amazonMusic: {
    useMock: true,
    apiKey: process.env.AMAZON_MUSIC_API_KEY,
  },
};

/**
 * Get the current API configuration
 */
export function getApiConfig(): ApiConfig {
  const config = { ...defaultConfig };
  
  // Auto-detect if real APIs should be used based on environment variables
  // For Apple Music, we need at minimum: keyId, issuerId, and privateKey
  // teamId can be the same as individual developer ID for personal accounts
  if (config.appleMusic.keyId && config.appleMusic.issuerId && config.appleMusic.privateKey) {
    config.appleMusic.useMock = false;
  }
  
  if (config.spotify.clientId && config.spotify.clientSecret) {
    config.spotify.useMock = false;
  }
  
  if (config.youtube.apiKey) {
    config.youtube.useMock = false;
  }
  
  if (config.amazonMusic.apiKey) {
    config.amazonMusic.useMock = false;
  }
  
  return config;
}

/**
 * Check if a specific platform should use mock implementation
 */
export function shouldUseMock(platform: keyof ApiConfig): boolean {
  const config = getApiConfig();
  return config[platform].useMock;
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig<T extends keyof ApiConfig>(platform: T): ApiConfig[T] {
  const config = getApiConfig();
  return config[platform];
}

/**
 * Validate that required environment variables are set for a platform
 */
export function validatePlatformConfig(platform: keyof ApiConfig): { valid: boolean; missing: string[] } {
  const config = getApiConfig();
  const missing: string[] = [];
  
  switch (platform) {
    case 'appleMusic':
      if (!config.appleMusic.useMock) {
        if (!config.appleMusic.keyId) missing.push('APPLE_MUSIC_KEY_ID');
        if (!config.appleMusic.issuerId) missing.push('APPLE_MUSIC_ISSUER_ID');
        if (!config.appleMusic.privateKey) missing.push('APPLE_MUSIC_PRIVATE_KEY');
        // Team ID is optional for individual accounts (can use developer ID)
        if (!config.appleMusic.teamId) missing.push('APPLE_MUSIC_TEAM_ID (use your individual developer ID)');
      }
      break;
      
    case 'spotify':
      if (!config.spotify.useMock) {
        if (!config.spotify.clientId) missing.push('SPOTIFY_CLIENT_ID');
        if (!config.spotify.clientSecret) missing.push('SPOTIFY_CLIENT_SECRET');
      }
      break;
      
    case 'youtube':
      if (!config.youtube.useMock) {
        if (!config.youtube.apiKey) missing.push('YOUTUBE_API_KEY');
      }
      break;
      
    case 'amazonMusic':
      if (!config.amazonMusic.useMock) {
        if (!config.amazonMusic.apiKey) missing.push('AMAZON_MUSIC_API_KEY');
      }
      break;
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get a user-friendly status message for each platform
 */
export function getPlatformStatus() {
  const config = getApiConfig();
  
  return {
    appleMusic: {
      configured: !config.appleMusic.useMock,
      status: config.appleMusic.useMock ? 'Using Mock API' : 'Real API Configured',
      validation: validatePlatformConfig('appleMusic')
    },
    spotify: {
      configured: !config.spotify.useMock,
      status: config.spotify.useMock ? 'Using Mock API' : 'Real API Configured',
      validation: validatePlatformConfig('spotify')
    },
    youtube: {
      configured: !config.youtube.useMock,
      status: config.youtube.useMock ? 'Using Mock API' : 'Real API Configured',
      validation: validatePlatformConfig('youtube')
    },
    amazonMusic: {
      configured: !config.amazonMusic.useMock,
      status: config.amazonMusic.useMock ? 'Using Mock API' : 'Real API Configured',
      validation: validatePlatformConfig('amazonMusic')
    }
  };
}
