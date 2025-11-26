"use client";

import { useState, useRef, useEffect } from 'react';
import { TrackMatch } from '../services/songMatcher';

interface SongPreviewProps {
  match: TrackMatch;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export default function SongPreview({ match, isPlaying, onPlay, onPause }: SongPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate mock preview URLs for different platforms
  const getPreviewUrl = (match: TrackMatch): string => {
    // In a real implementation, these would come from the actual APIs
    const mockPreviews = {
      youtube: `https://www.youtube.com/embed/${generateMockId()}?autoplay=0&controls=1&start=30`,
      spotify: `https://open.spotify.com/embed/track/${generateMockId()}?utm_source=generator&theme=0`,
      apple: `https://embed.music.apple.com/us/song/${generateMockId()}?app=music&itsct=music_box_player&itscg=30200&ls=1&theme=auto`,
      amazon: `https://music.amazon.com/embed/${generateMockId()}/?marketplace=US&theme=dark`
    };

    return mockPreviews[match.platform] || '';
  };

  const generateMockId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };

  // For audio previews (when available)
  const getAudioPreviewUrl = (match: TrackMatch): string => {
    // Mock audio preview URLs - in real implementation, these come from APIs
    const mockAudioPreviews = [
      'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      'https://www.soundjay.com/buttons/sounds/button-09.wav',
      'https://www.soundjay.com/buttons/sounds/button-10.wav'
    ];
    
    const index = match.track.id.length % mockAudioPreviews.length;
    return mockAudioPreviews[index];
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setError(true));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleAudioPlay = async () => {
    if (!audioRef.current) return;
    
    setLoading(true);
    setError(false);
    
    try {
      await audioRef.current.play();
      onPlay();
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      onPause();
    }
  };

  const handleAudioEnded = () => {
    onPause();
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Audio Preview Button */}
      <button
        onClick={isPlaying ? handleAudioPause : handleAudioPlay}
        disabled={loading}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
          loading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : error
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : isPlaying
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
        title={error ? 'Preview unavailable' : isPlaying ? 'Pause' : 'Play preview'}
      >
        {loading ? (
          <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <span className="text-xs">✕</span>
        ) : isPlaying ? (
          <span className="text-xs">⏸</span>
        ) : (
          <span className="text-xs">▶</span>
        )}
      </button>

      {/* Platform Preview Button */}
      <button
        onClick={() => window.open(getPreviewUrl(match), '_blank', 'width=400,height=600')}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        title={`Open in ${match.platform}`}
      >
        🔗 {match.platform}
      </button>

      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        src={getAudioPreviewUrl(match)}
        onEnded={handleAudioEnded}
        onError={() => setError(true)}
        preload="none"
      />
    </div>
  );
}

// Hook for managing multiple audio previews
export function useAudioPreview() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const play = (trackId: string) => {
    setCurrentlyPlaying(trackId);
  };

  const pause = () => {
    setCurrentlyPlaying(null);
  };

  const isPlaying = (trackId: string) => {
    return currentlyPlaying === trackId;
  };

  return { play, pause, isPlaying };
}
