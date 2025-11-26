"use client";

import { useState, useRef, useEffect } from 'react';
import { Track } from '../services/mockAppleMusic';
import AudioPreview from './AudioPreview';

interface SearchResult extends Track {
  confidence?: number;
  matchType?: 'search_result';
  previewUrl?: string;
}

interface PlatformSearchChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  originalTrack: Track;
  platform: "youtube" | "spotify" | "apple" | "amazon";
  accessToken?: string;
  onTrackSelected: (track: Track) => void;
}

export default function PlatformSearchChatbot({
  isOpen,
  onClose,
  originalTrack,
  platform,
  accessToken,
  onTrackSelected
}: PlatformSearchChatbotProps) {
  const [searchQuery, setSearchQuery] = useState(`${originalTrack.title} ${originalTrack.artist}`);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'bot', message: string}>>([
    {
      type: 'bot',
      message: `I'll help you find "${originalTrack.title}" by ${originalTrack.artist} on ${platform}. Try searching with different keywords or variations of the song name.`
    }
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Removed auto-scroll behavior to prevent CSS conflicts and unwanted scrolling
  // Users can manually scroll if needed

  const searchSpotifyReal = async (query: string): Promise<SearchResult[]> => {
    try {
      console.log(`🔍 Real Spotify search for: "${query}"`);
      
      if (!accessToken) {
        console.error('No Spotify access token available');
        return [];
      }

      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Spotify access token expired or invalid');
          throw new Error('Spotify authentication expired. Please reconnect.');
        }
        throw new Error(`Spotify search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
        console.log('No tracks found in Spotify search results');
        return [];
      }

      console.log(`✅ Found ${data.tracks.items.length} real Spotify tracks`);

      return data.tracks.items.map((track: any): SearchResult => ({
        id: track.id, // Real Spotify track ID
        title: track.name, // Real song title
        artist: track.artists.map((artist: any) => artist.name).join(', '), // Real artist names
        album: track.album?.name || '', // Real album name
        duration: track.duration_ms, // Real duration in milliseconds
        artworkUrl: track.album?.images?.[0]?.url || '', // Real album artwork
        platform: 'spotify' as any,
        originalId: track.id,
        previewUrl: track.preview_url, // Real 30-second preview URL from Spotify
        confidence: 1.0, // Real search results have high confidence
        matchType: 'search_result' as const
      }));
    } catch (error) {
      console.error('Real Spotify search error:', error);
      
      // Show error message to user
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        message: `Sorry, there was an error searching Spotify: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or reconnect your Spotify account.` 
      }]);
      
      return [];
    }
  };

  const mockPlatformSearch = async (query: string, targetPlatform: string): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const searchTerms = query.toLowerCase();
    
    // Generate contextually relevant results based on the search query
    const generateSearchResults = (searchQuery: string) => {
      // If searching for the original track, provide variations
      if (searchQuery.includes(originalTrack.title.toLowerCase()) || 
          searchQuery.includes(originalTrack.artist.toLowerCase())) {
        return [
          { 
            title: originalTrack.title, 
            artist: originalTrack.artist, 
            album: originalTrack.album || 'Unknown Album',
            confidence: 0.95 
          },
          { 
            title: `${originalTrack.title} (Remix)`, 
            artist: originalTrack.artist, 
            album: 'Remixed',
            confidence: 0.85 
          },
          { 
            title: `${originalTrack.title} - Live Version`, 
            artist: originalTrack.artist, 
            album: 'Live Sessions',
            confidence: 0.80 
          },
          { 
            title: originalTrack.title, 
            artist: `${originalTrack.artist} ft. Various Artists`, 
            album: 'Collaborations',
            confidence: 0.75 
          },
          { 
            title: `${originalTrack.title} (Acoustic)`, 
            artist: originalTrack.artist, 
            album: 'Acoustic Sessions',
            confidence: 0.70 
          }
        ];
      }

      // Generic search results based on query
      const variations = [
        { title: searchQuery, artist: 'Various Artists', album: 'Search Results', confidence: 0.60 },
        { title: `${searchQuery} (Cover)`, artist: 'Cover Artists', album: 'Covers', confidence: 0.55 },
        { title: `${searchQuery} Instrumental`, artist: 'Instrumental', album: 'Instrumentals', confidence: 0.50 },
        { title: `Similar to ${searchQuery}`, artist: 'Similar Artists', album: 'Similar Songs', confidence: 0.45 },
        { title: `${searchQuery} Karaoke`, artist: 'Karaoke Version', album: 'Karaoke', confidence: 0.40 }
      ];

      return variations;
    };

    const results = generateSearchResults(searchQuery);

    return results.map((result, index) => ({
      id: `mock_${targetPlatform}_${Math.random().toString(36).substring(2, 15)}`,
      title: result.title,
      artist: result.artist,
      album: result.album,
      duration: Math.floor(Math.random() * 300000) + 120000,
      artworkUrl: `https://picsum.photos/300/300?random=search_${index}`,
      platform: targetPlatform as any,
      originalId: `mock_${index}`,
      confidence: result.confidence,
      matchType: 'search_result' as const
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', message: searchQuery }]);
    
    try {
      console.log(`🔍 Manual search - Platform: ${platform}, Query: "${searchQuery}"`);
      console.log(`🔑 Access token available: ${!!accessToken}`);
      console.log(`🎯 Access token preview: ${accessToken ? accessToken.substring(0, 20) + '...' : 'None'}`);
      
      let results: SearchResult[] = [];
      
      // Use real API for Spotify if access token is available
      if (platform === 'spotify' && accessToken) {
        console.log('🎵 Using real Spotify API for manual search');
        results = await searchSpotifyReal(searchQuery);
        console.log(`📊 Real Spotify search returned ${results.length} results`);
      } else if (platform === 'spotify' && !accessToken) {
        console.warn('⚠️ No Spotify access token - user needs to authenticate first');
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          message: 'Please authenticate with Spotify first to search for real songs. Click the Spotify button above to connect your account.' 
        }]);
        setIsSearching(false);
        return;
      } else {
        // For other platforms, use mock data
        console.log(`🎭 Using mock search for platform: ${platform}`);
        results = await mockPlatformSearch(searchQuery, platform);
        console.log(`📊 Mock search returned ${results.length} results`);
      }
      
      setSearchResults(results);
      
      // Add bot response
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        message: `Found ${results.length} results for "${searchQuery}" on ${platformNames[platform]}. Click on any result to preview and select it.` 
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        message: `Sorry, I couldn't search ${platform} right now. Please try again or try a different search term.` 
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleTrackSelect = (track: SearchResult) => {
    onTrackSelected(track);
    setChatMessages(prev => [...prev, { 
      type: 'bot', 
      message: `Great choice! Selected "${track.title}" by ${track.artist}. You can close this search or continue looking for other options.` 
    }]);
  };

  const platformNames = {
    youtube: 'YouTube',
    spotify: 'Spotify', 
    apple: 'Apple Music',
    amazon: 'Amazon Music'
  };

  const platformColors = {
    youtube: 'from-red-500 to-red-600',
    spotify: 'from-green-500 to-green-600',
    apple: 'from-pink-500 to-pink-600',
    amazon: 'from-blue-500 to-blue-600'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`p-3 sm:p-4 bg-gradient-to-r ${platformColors[platform]} text-white rounded-t-xl flex-shrink-0`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold">Search {platformNames[platform]}</h2>
              <p className="text-xs opacity-90 truncate">
                Looking for: &ldquo;{originalTrack.title}&rdquo; by {originalTrack.artist}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Single Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Chat Messages */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="space-y-3">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="p-3 sm:p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Search Results:</h3>
              <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.id}-${index}`}
                  className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        by {result.artist} • {result.album}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {result.confidence && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                            {Math.round(result.confidence * 100)}% match
                          </span>
                        )}
                        {(result as any).previewUrl && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            🎵 Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile-friendly button row */}
                  <div className="flex items-center justify-between gap-2">
                    <AudioPreview 
                      track={result} 
                      platform={platform} 
                      accessToken={accessToken}
                    />
                    <button
                      onClick={() => handleTrackSelect(result)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors flex-shrink-0"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Input - Fixed at Bottom */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Search for "${originalTrack.title}" on ${platformNames[platform]}...`}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-sm font-medium"
            >
              {isSearching ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline text-xs">Searching...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden sm:inline text-xs">Search</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Try different keywords, artist variations, or song versions (remix, live, acoustic, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
