"use client";

import { useState } from "react";
import { storeToken } from "../../lib/token-storage";

type Platform = "youtube" | "spotify" | "apple" | "amazon";

interface OAuthButtonProps {
  platform: Platform;
  platformName: string;
  logo: React.ReactNode;
  isConnected: boolean;
  onConnect: () => void;
}

export default function OAuthButton({ platform, platformName, logo, isConnected, onConnect }: OAuthButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    
    // Check if we have API keys configured
    const hasGoogleKey = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'YOUR_CLIENT_ID';
    const hasSpotifyKey = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID && process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID !== 'YOUR_CLIENT_ID';
    const hasAppleKey = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && process.env.NEXT_PUBLIC_APPLE_CLIENT_ID !== 'YOUR_CLIENT_ID';
    const hasAmazonKey = process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID && process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID !== 'YOUR_CLIENT_ID';
    
    // Helper function to get redirect URI - Spotify requires 127.0.0.1 instead of localhost
    const getRedirectUri = (path: string, use127: boolean = false) => {
      let origin = window.location.origin;
      // Spotify doesn't allow localhost - must use 127.0.0.1
      if (use127 && origin.includes('localhost')) {
        origin = origin.replace('localhost', '127.0.0.1');
      }
      return origin + path;
    };
    
    // OAuth URLs for each platform
    const oauthUrls: Record<Platform, string> = {
      youtube: hasGoogleKey 
        ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(getRedirectUri('/api/auth/youtube/callback'))}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly')}`
        : '#',
      spotify: hasSpotifyKey
        ? (() => {
            const originalOrigin = window.location.origin;
            const redirectUri = getRedirectUri('/api/auth/spotify/callback', true);
            // Include original origin in state so callback can redirect back to correct domain
            const state = encodeURIComponent(JSON.stringify({ origin: originalOrigin }));
            const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent('playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private')}`;
            console.log("Spotify OAuth URL:", spotifyUrl);
            console.log("Redirect URI:", redirectUri);
            return spotifyUrl;
          })()
        : '#',
      apple: hasAppleKey
        ? `https://appleid.apple.com/auth/authorize?client_id=${process.env.NEXT_PUBLIC_APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/apple/callback')}&response_type=code&scope=music`
        : '#',
      amazon: hasAmazonKey
        ? `https://api.amazon.com/auth/o2/create/codepair?client_id=${process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID}&scope=${encodeURIComponent('music_subscription_customers')}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/amazon/callback')}`
        : '#'
    };

    // If no API keys configured, show a message and simulate connection
    if (!hasGoogleKey && platform === 'youtube') {
      console.log('Demo mode: Simulating YouTube connection');
      // Instead of alert, use a more user-friendly notification
      setTimeout(() => {
        setIsAuthenticating(false);
        onConnect();
        // Trigger success message in parent component
        window.dispatchEvent(new CustomEvent('demo-auth-success', { 
          detail: { platform: 'youtube', message: '✅ Demo: Connected to YouTube successfully!' }
        }));
      }, 1000);
      return;
    }
    if (!hasSpotifyKey && platform === 'spotify') {
      alert('⚠️ Please configure SPOTIFY_CLIENT_ID in your .env.local file. Simulating connection for demo purposes.');
      setTimeout(() => {
        setIsAuthenticating(false);
        onConnect();
      }, 1000);
      return;
    }
    if (!hasAppleKey && platform === 'apple') {
      alert('⚠️ Please configure APPLE_CLIENT_ID in your .env.local file. Simulating connection for demo purposes.');
      setTimeout(() => {
        setIsAuthenticating(false);
        onConnect();
      }, 1000);
      return;
    }
    if (!hasAmazonKey && platform === 'amazon') {
      alert('⚠️ Please configure AMAZON_CLIENT_ID in your .env.local file. Simulating connection for demo purposes.');
      setTimeout(() => {
        setIsAuthenticating(false);
        onConnect();
      }, 1000);
      return;
    }

    // Redirect to the OAuth page
    const oauthUrl = oauthUrls[platform];
    if (oauthUrl && oauthUrl !== '#') {
      console.log(`Redirecting to ${platform} OAuth:`, oauthUrl);
      window.location.href = oauthUrl;
    } else {
      console.error(`No OAuth URL for platform: ${platform}`);
      alert(`OAuth URL not configured for ${platformName}`);
      setIsAuthenticating(false);
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={isAuthenticating || isConnected}
      className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 ${
        isConnected
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : isAuthenticating
          ? "border-gray-400 bg-gray-100 dark:bg-gray-800"
          : "border-gray-300 dark:border-gray-700 hover:border-purple-500 bg-white/60 dark:bg-gray-800/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            {logo}
          </div>
          <div className="text-left">
            <p className={`font-bold ${isConnected ? "text-green-700 dark:text-green-300" : ""}`}>
              {platformName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? "✓ Connected" : isAuthenticating ? "Authenticating..." : "Click to connect"}
            </p>
          </div>
        </div>
        {isConnected && (
          <div className="text-2xl">✓</div>
        )}
      </div>
    </button>
  );
}

