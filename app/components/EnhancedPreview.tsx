"use client";

import { useState } from 'react';
import { Track } from '../services/mockAppleMusic';

interface EnhancedPreviewProps {
  track: Track;
  platform: "youtube" | "spotify" | "apple" | "amazon";
  accessToken?: string;
}

export default function EnhancedPreview({ track, platform, accessToken }: EnhancedPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    setIsLoading(true);
    
    try {
      switch (platform) {
        case 'youtube':
          // Best option: Full song on YouTube
          window.open(`https://www.youtube.com/watch?v=${track.id}`, '_blank');
          break;
          
        case 'spotify':
          if (accessToken) {
            // Try to get real 30-second preview
            try {
              const response = await fetch(`https://api.spotify.com/v1/tracks/${track.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.preview_url) {
                  // Play real 30-second Spotify preview
                  const audio = new Audio(data.preview_url);
                  audio.play();
                  return;
                }
              }
            } catch (err) {
              console.log('Spotify preview not available');
            }
          }
          
          // Fallback: Open Spotify web player
          window.open(`https://open.spotify.com/search/${encodeURIComponent(track.title + ' ' + track.artist)}`, '_blank');
          break;
          
        case 'apple':
          // Open Apple Music search (best we can do without full API)
          window.open(`https://music.apple.com/search?term=${encodeURIComponent(track.title + ' ' + track.artist)}`, '_blank');
          break;
          
        case 'amazon':
          // Open Amazon Music search
          window.open(`https://music.amazon.com/search/${encodeURIComponent(track.title + ' ' + track.artist)}`, '_blank');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    const styles = {
      youtube: 'bg-red-500 hover:bg-red-600 text-white',
      spotify: 'bg-green-500 hover:bg-green-600 text-white', 
      apple: 'bg-pink-500 hover:bg-pink-600 text-white',
      amazon: 'bg-blue-500 hover:bg-blue-600 text-white'
    };
    return styles[platform];
  };

  const getButtonText = () => {
    const texts = {
      youtube: '🎬 Play Full Song',
      spotify: '🎵 Preview/Open',
      apple: '🍎 Open in Apple Music',
      amazon: '🛒 Open in Amazon Music'
    };
    return texts[platform];
  };

  const getTooltip = () => {
    const tooltips = {
      youtube: 'Play full song on YouTube',
      spotify: accessToken ? 'Play 30s preview or open Spotify' : 'Open in Spotify',
      apple: 'Search and play in Apple Music',
      amazon: 'Search and play in Amazon Music'
    };
    return tooltips[platform];
  };

  return (
    <button
      onClick={handlePreview}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${getButtonStyle()}`}
      title={getTooltip()}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        getButtonText()
      )}
    </button>
  );
}
