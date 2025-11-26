"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Track } from "../../lib/playlist-fetcher";

// Helper functions for better iTunes matching with naming convention
const extractCoreInfo = (title: string, artist: string): { coreTitle: string; coreArtist: string } => {
  // Extract core title by removing common metadata patterns
  let coreTitle = title
    .toLowerCase()
    .replace(/\s*\|\s*.*$/g, '') // Remove everything after |
    .replace(/\s*#\w+.*$/g, '') // Remove hashtags and everything after
    .replace(/\s*(new|latest|official|video|song|music|audio|lyrics|lyrical|full|hd|4k)\s*(song|video|music|audio|version)?\s*$/gi, '') // Remove common suffixes
    .replace(/\s*\d{4}\s*$/g, '') // Remove year at the end
    .replace(/\s*(ft\.?|feat\.?|featuring|vs\.?|versus|with|x)\s+.*$/gi, '') // Remove featured artists
    .replace(/\s*\(.*?\)\s*/g, '') // Remove content in parentheses
    .replace(/\s*\[.*?\]\s*/g, '') // Remove content in brackets
    .trim();

  // Extract core artist by taking the first/main artist
  let coreArtist = artist
    .toLowerCase()
    .split(/[,&+]|ft\.?|feat\.?|featuring|vs\.?|versus|with|x/i)[0] // Take first artist before separators
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses
    .replace(/\s*\[.*?\]\s*/g, '') // Remove brackets
    .trim();

  return { coreTitle, coreArtist };
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"''""]/g, '') // Remove punctuation
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/\b(feat|ft|featuring|vs|versus|remix|remaster|remastered|live|acoustic|radio edit|extended|version)\b/g, '') // Remove common variations
    .trim();
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Global audio manager to ensure only one preview plays at a time
class GlobalAudioManager {
  private static instance: GlobalAudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentStopCallback: (() => void) | null = null;

  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  playAudio(audio: HTMLAudioElement, stopCallback: () => void) {
    // Stop any currently playing audio
    this.stopCurrent();
    
    // Set new current audio
    this.currentAudio = audio;
    this.currentStopCallback = stopCallback;
  }

  stopCurrent() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    if (this.currentStopCallback) {
      this.currentStopCallback();
    }
    this.currentAudio = null;
    this.currentStopCallback = null;
  }

  isCurrentAudio(audio: HTMLAudioElement): boolean {
    return this.currentAudio === audio;
  }
}

interface AudioPreviewProps {
  track: Track;
  platform: "youtube" | "spotify" | "apple" | "amazon";
  accessToken?: string;
}

export default function AudioPreview({ track, platform, accessToken }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'spotify' | 'itunes' | 'synthetic' | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Create audio element using a callback ref pattern
    const createAudioElement = () => {
      if (!audioRef.current && containerRef.current) {
        const audio = document.createElement('audio');
        audio.preload = 'none';
        audio.style.display = 'none';
        audio.style.position = 'absolute';
        audio.style.visibility = 'hidden';
        
        const handleEnded = () => setIsPlaying(false);
        const handleError = (e: Event) => {
          const audioElement = e.target as HTMLAudioElement;
          
          // Check for empty or invalid src first - ignore these errors
          if (!audioElement?.src || 
              audioElement.src === '' || 
              audioElement.src === window.location.href ||
              audioElement.src.includes('/transfer')) {
            console.warn("Audio error: Empty or invalid src attribute, ignoring error");
            return; // Don't show error for empty/invalid src
          }
          
          let errorMessage = "Playback error";
          
          if (audioElement?.error) {
            switch (audioElement.error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = "Playback aborted";
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = "Network error";
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = "Decode error";
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = "Format not supported";
                break;
              default:
                errorMessage = "Unknown playback error";
            }
          }
          
          console.error("Audio playback error:", {
            error: audioElement?.error,
            code: audioElement?.error?.code,
            message: audioElement?.error?.message,
            src: audioElement?.src
          });
          
          setIsPlaying(false);
          setError(errorMessage);
        };
        
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        
        // Append to container instead of body
        containerRef.current.appendChild(audio);
        audioRef.current = audio;
      }
    };

    // Use a small delay to ensure container is mounted
    const timer = setTimeout(() => {
      createAudioElement();
    }, 0);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
          audioRef.current.removeEventListener('error', () => {});
          
          // Remove from DOM
          if (audioRef.current.parentNode) {
            audioRef.current.parentNode.removeChild(audioRef.current);
          }
        } catch (err) {
          console.error("Error cleaning up audio:", err);
        }
        audioRef.current = null;
      }
    };
  }, []);

  const getPreviewUrl = useCallback(async () => {
    if (previewUrl) return previewUrl;

    setIsLoading(true);
    setError(null);

    try {
      // Check if track already has a preview URL (from search results)
      if ((track as any).previewUrl) {
        console.log(`🎵 Using preview URL from search results: ${track.title}`);
        setPreviewUrl((track as any).previewUrl);
        setPreviewType('spotify');
        return (track as any).previewUrl;
      }

      if (platform === "spotify" && accessToken) {
        // Check if this is a mock ID - don't make real API calls for mock data
        if (track.id.startsWith('mock_') || track.id.startsWith('search_') || track.id.startsWith('demo_')) {
          console.log(`🎵 Mock Spotify track detected: ${track.id}, using fallback`);
          // Skip to fallback options for mock tracks
        } else {
          try {
            // Try to get real Spotify preview only for real track IDs
            const response = await fetch(`https://api.spotify.com/v1/tracks/${track.id}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.preview_url && data.preview_url.trim() !== '') {
                console.log(`🎵 Real Spotify preview found for: ${track.title}`);
                setPreviewUrl(data.preview_url);
                setPreviewType('spotify');
                return data.preview_url;
              } else {
                console.log(`🎵 No preview available for: ${track.title} - this is normal for many tracks`);
              }
            }
          } catch (err) {
            console.log('Spotify API error:', err);
          }
        }
        
        // Fallback to iTunes search for real previews
        const itunesUrl = await tryItunesPreview();
        if (itunesUrl) return itunesUrl;
      } else if (platform === "youtube") {
        // For YouTube, use mock preview for demo
        const mockUrl = await getMockPreviewUrl();
        setPreviewUrl(mockUrl);
        return mockUrl;
      } else {
        // For other platforms, use mock preview for demo
        const mockUrl = await getMockPreviewUrl();
        setPreviewUrl(mockUrl);
        return mockUrl;
      }
    } catch (err) {
      // Fallback to mock preview for demo
      const mockUrl = await getMockPreviewUrl();
      setPreviewUrl(mockUrl);
      return mockUrl;
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl, platform, accessToken, track.id]);

  // Get real preview URL or fallback to search-based preview
  const getMockPreviewUrl = async () => {
    // Try to get a real preview URL from various sources
    try {
      // Option 1: Try YouTube audio (if we can extract it)
      if (platform === "youtube") {
        // For YouTube, we'll open the video instead of trying to extract audio
        return null; // This will trigger the YouTube link behavior
      }
      
      // Option 2: Try to find the song on other platforms using naming convention
      const { coreTitle, coreArtist } = extractCoreInfo(track.title, track.artist || '');
      const coreSearchQuery = `${coreTitle} ${coreArtist}`.trim();
      
      console.log(`🎵 iTunes fallback search - Original: "${track.title}" by "${track.artist}" -> Core: "${coreSearchQuery}"`);
      
      // Option 3: Use iTunes Preview API (this actually works!)
      const itunesResponse = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(coreSearchQuery)}&media=music&limit=10&entity=song`
      );
      
      if (itunesResponse.ok) {
        const itunesData = await itunesResponse.json();
        if (itunesData.results && itunesData.results.length > 0) {
          // Calculate similarity scores using both core and original info
          const scoredResults = itunesData.results
            .filter((result: any) => result.previewUrl)
            .map((result: any) => {
              // Check similarity with core extracted info (primary)
              const coreTitleSimilarity = calculateSimilarity(
                normalizeText(coreTitle), 
                normalizeText(result.trackName || '')
              );
              const coreArtistSimilarity = calculateSimilarity(
                normalizeText(coreArtist), 
                normalizeText(result.artistName || '')
              );
              
              // Check similarity with original info (secondary)
              const originalTitleSimilarity = calculateSimilarity(
                normalizeText(track.title), 
                normalizeText(result.trackName || '')
              );
              const originalArtistSimilarity = calculateSimilarity(
                normalizeText(track.artist || ''), 
                normalizeText(result.artistName || '')
              );
              
              // Use the better of core or original matching
              const bestTitleSimilarity = Math.max(coreTitleSimilarity, originalTitleSimilarity);
              const bestArtistSimilarity = Math.max(coreArtistSimilarity, originalArtistSimilarity);
              
              // Combined score with title weighted more heavily
              const combinedScore = (bestTitleSimilarity * 0.7) + (bestArtistSimilarity * 0.3);
              
              // Bonus for exact core matches
              const coreBonus = (coreTitleSimilarity > 0.9 && coreArtistSimilarity > 0.7) ? 0.1 : 0;
              
              return {
                ...result,
                score: combinedScore + coreBonus,
                coreTitleSimilarity,
                coreArtistSimilarity,
                bestTitleSimilarity,
                bestArtistSimilarity
              };
            })
            .sort((a: any, b: any) => b.score - a.score);

          // Use the best match if it's above a reasonable threshold
          const bestMatch = scoredResults[0];
          if (bestMatch && bestMatch.score > 0.6) {
            console.log(`🎵 Found iTunes fallback preview for: ${track.title} -> ${bestMatch.trackName} by ${bestMatch.artistName} (core score: ${bestMatch.coreTitleSimilarity.toFixed(2)}/${bestMatch.coreArtistSimilarity.toFixed(2)}, final: ${bestMatch.score.toFixed(2)})`);
            setPreviewType('itunes');
            return bestMatch.previewUrl;
          }
          
          // If no good match, try the first result but with lower confidence
          if (scoredResults.length > 0) {
            const firstResult = scoredResults[0];
            console.warn(`⚠️ iTunes fallback preview may not match: ${track.title} -> ${firstResult.trackName} by ${firstResult.artistName} (core score: ${firstResult.coreTitleSimilarity.toFixed(2)}/${firstResult.coreArtistSimilarity.toFixed(2)}, final: ${firstResult.score.toFixed(2)})`);
            setPreviewType('itunes');
            return firstResult.previewUrl;
          }
        }
      }
      
      // Option 4: Try Spotify Web API (public search - no auth needed)
      try {
        // This would require a client credentials token, but let's try anyway
        const spotifySearchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(coreSearchQuery)}&type=track&limit=1`;
        // Note: This needs authentication, so it will fail, but we'll handle it gracefully
      } catch (err) {
        console.log('Spotify search not available without auth');
      }
      
    } catch (error) {
      console.log('Could not find real preview, using synthetic audio');
    }
    
    // Fallback: Generate synthetic audio
    setPreviewType('synthetic');
    const syntheticUrl = await generateSyntheticPreview();
    
    // Final validation - ensure we never return an invalid URL
    if (!syntheticUrl || syntheticUrl.trim() === '' || syntheticUrl === window.location.href) {
      console.warn('Generated invalid synthetic URL, returning null');
      return null;
    }
    
    return syntheticUrl;
  };

  const tryItunesPreview = async (): Promise<string | null> => {
    try {
      // Use naming convention to extract core info
      const { coreTitle, coreArtist } = extractCoreInfo(track.title, track.artist || '');
      const coreSearchQuery = `${coreTitle} ${coreArtist}`.trim();
      
      console.log(`🎵 iTunes search - Original: "${track.title}" by "${track.artist}" -> Core: "${coreSearchQuery}"`);
      
      const itunesResponse = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(coreSearchQuery)}&media=music&limit=10&entity=song`
      );
      
      if (itunesResponse.ok) {
        const itunesData = await itunesResponse.json();
        if (itunesData.results && itunesData.results.length > 0) {
          // Calculate similarity scores using both core and original info
          const scoredResults = itunesData.results
            .filter((result: any) => result.previewUrl)
            .map((result: any) => {
              // Check similarity with core extracted info (primary)
              const coreTitleSimilarity = calculateSimilarity(
                normalizeText(coreTitle), 
                normalizeText(result.trackName || '')
              );
              const coreArtistSimilarity = calculateSimilarity(
                normalizeText(coreArtist), 
                normalizeText(result.artistName || '')
              );
              
              // Check similarity with original info (secondary)
              const originalTitleSimilarity = calculateSimilarity(
                normalizeText(track.title), 
                normalizeText(result.trackName || '')
              );
              const originalArtistSimilarity = calculateSimilarity(
                normalizeText(track.artist || ''), 
                normalizeText(result.artistName || '')
              );
              
              // Use the better of core or original matching
              const bestTitleSimilarity = Math.max(coreTitleSimilarity, originalTitleSimilarity);
              const bestArtistSimilarity = Math.max(coreArtistSimilarity, originalArtistSimilarity);
              
              // Combined score with title weighted more heavily
              const combinedScore = (bestTitleSimilarity * 0.7) + (bestArtistSimilarity * 0.3);
              
              // Bonus for exact core matches
              const coreBonus = (coreTitleSimilarity > 0.9 && coreArtistSimilarity > 0.7) ? 0.1 : 0;
              
              return {
                ...result,
                score: combinedScore + coreBonus,
                coreTitleSimilarity,
                coreArtistSimilarity,
                bestTitleSimilarity,
                bestArtistSimilarity
              };
            })
            .sort((a: any, b: any) => b.score - a.score);

          // Use the best match if it's above a reasonable threshold
          const bestMatch = scoredResults[0];
          if (bestMatch && bestMatch.score > 0.6) {
            console.log(`🎵 Found iTunes preview for: ${track.title} -> ${bestMatch.trackName} by ${bestMatch.artistName} (core score: ${bestMatch.coreTitleSimilarity.toFixed(2)}/${bestMatch.coreArtistSimilarity.toFixed(2)}, final: ${bestMatch.score.toFixed(2)})`);
            setPreviewType('itunes');
            setPreviewUrl(bestMatch.previewUrl);
            return bestMatch.previewUrl;
          }
          
          // If no good match, try the first result but with lower confidence
          if (scoredResults.length > 0) {
            const firstResult = scoredResults[0];
            console.warn(`⚠️ iTunes preview may not match: ${track.title} -> ${firstResult.trackName} by ${firstResult.artistName} (score: ${firstResult.score.toFixed(2)})`);
            setPreviewType('itunes');
            setPreviewUrl(firstResult.previewUrl);
            return firstResult.previewUrl;
          }
        }
      }
    } catch (error) {
      console.log('iTunes search failed:', error);
    }
    return null;
  };

  // Generate synthetic audio preview
  const generateSyntheticPreview = () => {
    // Simple fallback - return a demo message instead of actual audio
    // This avoids complex Web Audio API issues while still providing feedback
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        // Create a simple beep sound using data URL
        const frequency = 440 + (track.id ? track.id.length * 50 : 0);
        const duration = 1000; // 1 second
        
        // Simple sine wave generator
        const sampleRate = 8000;
        const samples = Math.floor(sampleRate * duration / 1000);
        const buffer = new ArrayBuffer(samples * 2);
        const view = new DataView(buffer);
        
        for (let i = 0; i < samples; i++) {
          const time = i / sampleRate;
          const amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.3;
          const sample = Math.floor(amplitude * 32767);
          view.setInt16(i * 2, sample, true);
        }
        
        // Create a simple WAV file
        const wavHeader = new ArrayBuffer(44);
        const headerView = new DataView(wavHeader);
        
        // WAV header
        headerView.setUint32(0, 0x46464952, true); // "RIFF"
        headerView.setUint32(4, 36 + buffer.byteLength, true);
        headerView.setUint32(8, 0x45564157, true); // "WAVE"
        headerView.setUint32(12, 0x20746d66, true); // "fmt "
        headerView.setUint32(16, 16, true);
        headerView.setUint16(20, 1, true);
        headerView.setUint16(22, 1, true);
        headerView.setUint32(24, sampleRate, true);
        headerView.setUint32(28, sampleRate * 2, true);
        headerView.setUint16(32, 2, true);
        headerView.setUint16(34, 16, true);
        headerView.setUint32(36, 0x61746164, true); // "data"
        headerView.setUint32(40, buffer.byteLength, true);
        
        // Combine header and data
        const fullBuffer = new ArrayBuffer(44 + buffer.byteLength);
        new Uint8Array(fullBuffer).set(new Uint8Array(wavHeader), 0);
        new Uint8Array(fullBuffer).set(new Uint8Array(buffer), 44);
        
        const blob = new Blob([fullBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 100);
    });
  };


  const handlePlay = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Early validation - don't proceed if we don't have a valid track
    if (!track || !track.id) {
      console.warn("Cannot play: Invalid track data");
      return;
    }

    try {
      // Ensure audio element exists
      if (!audioRef.current && containerRef.current) {
        const audio = document.createElement('audio');
        audio.preload = 'none';
        audio.style.display = 'none';
        audio.style.position = 'absolute';
        audio.style.visibility = 'hidden';
        
        const handleEnded = () => setIsPlaying(false);
        const handleError = () => {
          setIsPlaying(false);
          setError("Playback error");
        };
        
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        
        containerRef.current.appendChild(audio);
        audioRef.current = audio;
      }

      const audioManager = GlobalAudioManager.getInstance();

      if (isPlaying) {
        // Pause current audio
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      const url = await getPreviewUrl();
      if (!url) {
        setError("No preview available");
        return;
      }

      if (audioRef.current) {
        try {
          // Stop any current playback
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // Handle both string URLs and Promise<string> from synthetic generation
          const finalUrl = typeof url === 'string' ? url : await url;
          
          // Validate URL before setting as source
          if (!finalUrl || finalUrl.trim() === '' || finalUrl === window.location.href) {
            throw new Error('Invalid or empty audio URL');
          }
          
          // Additional validation for proper URL format
          try {
            new URL(finalUrl);
          } catch (urlError) {
            throw new Error(`Invalid URL format: ${finalUrl}`);
          }
          
          // Set new source only if valid
          audioRef.current.src = finalUrl;
          audioRef.current.load(); // Reload the audio element
          
          // Register with global audio manager before playing
          audioManager.playAudio(audioRef.current, () => setIsPlaying(false));
          
          // Play with proper error handling
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            setError(null); // Clear any previous errors
          }
        } catch (playErr: any) {
          console.error("Error playing audio:", {
            name: playErr.name,
            message: playErr.message,
            code: playErr.code,
            src: audioRef.current?.src
          });
          
          // Provide user-friendly error messages
          if (playErr.name === 'NotAllowedError') {
            setError("Click to play audio");
          } else if (playErr.name === 'NotSupportedError') {
            setError("Audio format not supported");
          } else if (playErr.name === 'AbortError') {
            setError("Playback interrupted");
          } else {
            setError("Preview unavailable");
          }
          setIsPlaying(false);
        }
      }
    } catch (err) {
      console.error("Error in handlePlay:", err);
      
      // Retry mechanism for network errors
      if (retryCount < 2 && (err as any)?.name === 'NetworkError') {
        console.log(`Retrying audio load (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        // Retry after a short delay
        setTimeout(() => {
          handlePlay(e);
        }, 1000);
        return;
      }
      
      setError("Error loading preview");
      setIsPlaying(false);
      setRetryCount(0); // Reset retry count
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, getPreviewUrl]);

  // Safety check - must be after hooks
  if (!track || !track.id) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled
          className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 text-white opacity-50 cursor-not-allowed"
          title="Preview not available"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </button>
      </div>
    );
  }

  // For YouTube, show a link instead of audio player
  if (platform === "youtube") {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${track.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
        onClick={(e) => e.stopPropagation()}
        title="Open full song on YouTube"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        Play on YouTube
      </a>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-2 relative" 
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => handlePlay(e)}
        disabled={isLoading}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        title={
          error || (
            previewType === 'spotify' ? 'Real Spotify Preview (30s)' : 
            previewType === 'itunes' ? 'Real iTunes Preview (30s)' : 
            previewType === 'synthetic' ? 'Demo Audio (Synthetic)' : 
            isPlaying ? "Pause demo audio" : "Play demo audio"
          )
        }
        type="button"
        aria-label={isPlaying ? "Pause demo audio" : "Play demo audio"}
      >
        {isLoading ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        )}
      </button>
      {error && !isLoading && error !== "Click to play on YouTube" && (
        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate" title={error}>
          {error.length > 10 ? error.substring(0, 10) + "..." : error}
        </span>
      )}
      {!error && !isLoading && (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1" 
              title={
                previewType === 'spotify' ? 'Real Spotify Preview (30s)' : 
                previewType === 'itunes' ? 'iTunes Preview - May not match exact version' : 
                previewType === 'synthetic' ? 'Demo audio - not actual song' : 
                'Demo audio - not actual song'
              }>
          {previewType === 'spotify' && (
            <>
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Spotify
            </>
          )}
          {previewType === 'itunes' && (
            <>
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              iTunes
            </>
          )}
          {previewType === 'synthetic' && 'Demo'}
          {!previewType && 'Demo'}
        </span>
      )}
    </div>
  );
}

