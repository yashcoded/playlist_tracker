/**
 * Smart Song Matching Service
 * 
 * This service handles intelligent song matching between different music platforms,
 * provides user selection options, and integrates AI suggestions.
 */

import { Track } from './mockAppleMusic';

export interface MatchResult {
  originalTrack: Track;
  matches: TrackMatch[];
  confidence: 'high' | 'medium' | 'low' | 'none';
  needsUserSelection: boolean;
}

export interface TrackMatch {
  track: Track;
  confidence: number; // 0-1 score
  matchType: 'exact' | 'fuzzy' | 'ai_suggested';
  platform: 'youtube' | 'spotify' | 'apple' | 'amazon';
  previewUrl?: string;
}

export interface SearchOptions {
  platform: 'youtube' | 'spotify' | 'apple' | 'amazon';
  query: string;
  limit?: number;
}

class SongMatcherService {
  private readonly EXACT_MATCH_THRESHOLD = 0.85;
  private readonly GOOD_MATCH_THRESHOLD = 0.7;
  private readonly MIN_MATCH_THRESHOLD = 0.6; // Increased for better quality matches
  private readonly MIN_TITLE_SIMILARITY = 0.6; // Minimum title similarity required
  private readonly MIN_ARTIST_SIMILARITY = 0.3; // Minimum artist similarity required

  /**
   * Find matches for a track across platforms
   */
  async findMatches(
    originalTrack: Track, 
    targetPlatforms: string[]
  ): Promise<MatchResult> {
    const allMatches: TrackMatch[] = [];

    // Search each platform
    for (const platform of targetPlatforms) {
      const platformMatches = await this.searchPlatform(
        originalTrack, 
        platform as any
      );
      allMatches.push(...platformMatches);
    }

    // Sort by confidence
    allMatches.sort((a, b) => b.confidence - a.confidence);

    // Determine overall confidence and user selection need
    const bestMatch = allMatches[0];
    const confidence = this.determineOverallConfidence(allMatches);
    const needsUserSelection = confidence !== 'high' || allMatches.length > 1;

    return {
      originalTrack,
      matches: allMatches.slice(0, 5), // Top 5 matches
      confidence,
      needsUserSelection
    };
  }

  /**
   * Search a specific platform for matches
   */
  private async searchPlatform(
    originalTrack: Track, 
    platform: 'youtube' | 'spotify' | 'apple' | 'amazon'
  ): Promise<TrackMatch[]> {
    // Simulate platform search with different query strategies
    const queries = this.generateSearchQueries(originalTrack);
    const matches: TrackMatch[] = [];

    for (const query of queries) {
      const results = await this.mockPlatformSearch(platform, query);
      
      for (const result of results) {
        const confidence = this.calculateMatchConfidence(originalTrack, result);
        
        if (confidence >= this.MIN_MATCH_THRESHOLD) {
          matches.push({
            track: result,
            confidence,
            matchType: confidence >= this.EXACT_MATCH_THRESHOLD ? 'exact' : 'fuzzy',
            platform,
            previewUrl: this.generatePreviewUrl(result, platform)
          });
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Generate different search query variations
   */
  private generateSearchQueries(track: Track): string[] {
    const queries = [
      `${track.title} ${track.artist}`, // Exact
      `${track.title} ${track.artist.split(' ')[0]}`, // First name only
      `${track.title}`, // Title only
      `${track.artist} ${track.title}`, // Artist first
    ];

    // Remove duplicates and empty queries
    return [...new Set(queries.filter(q => q.trim().length > 0))];
  }

  /**
   * Calculate match confidence between two tracks
   */
  private calculateMatchConfidence(original: Track, candidate: Track): number {
    const titleSimilarity = this.stringSimilarity(
      this.normalizeForMatching(original.title), 
      this.normalizeForMatching(candidate.title)
    );
    
    const artistSimilarity = this.stringSimilarity(
      this.normalizeForMatching(original.artist), 
      this.normalizeForMatching(candidate.artist)
    );

    // Require minimum similarity for both title and artist
    if (titleSimilarity < this.MIN_TITLE_SIMILARITY || artistSimilarity < this.MIN_ARTIST_SIMILARITY) {
      return 0; // Reject matches that don't meet minimum requirements
    }

    // Weighted average (title is more important, but artist is significant)
    return (titleSimilarity * 0.65) + (artistSimilarity * 0.35);
  }

  /**
   * Normalize string for better matching (handles "its magic" vs "It's Magic")
   */
  private normalizeForMatching(str: string): string {
    return str
      .toLowerCase()
      // Remove common version indicators that cause mismatches
      .replace(/\s*\(.*?(live|remix|version|feat\.?|ft\.?|official|video|audio|full|hd|4k).*?\)/gi, '')
      .replace(/\s*\[.*?(live|remix|version|feat\.?|ft\.?|official|video|audio|full|hd|4k).*?\]/gi, '')
      // Remove "from movie" indicators
      .replace(/\s*-?\s*from\s+["'].*?["']/gi, '')
      .replace(/\s*\|\s*.*$/g, '') // Remove everything after | symbol
      // Remove apostrophes and quotes that cause mismatches
      .replace(/[''`"]/g, '')
      // Replace other punctuation with spaces
      .replace(/[^\w\s]/g, ' ')
      // Remove common suffixes that cause issues
      .replace(/\s+(song|music|video|audio|lyrics|lyrical|full|new|latest|official)$/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Determine overall confidence level
   */
  private determineOverallConfidence(matches: TrackMatch[]): 'high' | 'medium' | 'low' | 'none' {
    if (matches.length === 0) return 'none';
    
    const bestConfidence = matches[0].confidence;
    
    if (bestConfidence >= this.EXACT_MATCH_THRESHOLD) return 'high';
    if (bestConfidence >= this.GOOD_MATCH_THRESHOLD) return 'medium';
    return 'low';
  }

  /**
   * Generate preview URL for a track on a platform
   */
  private generatePreviewUrl(track: Track, platform: string): string {
    // Mock preview URLs - in real implementation, these would come from the APIs
    const baseUrls = {
      youtube: `https://www.youtube.com/embed/search?q=${encodeURIComponent(track.title + ' ' + track.artist)}`,
      spotify: `https://open.spotify.com/embed/search/${encodeURIComponent(track.title + ' ' + track.artist)}`,
      apple: `https://embed.music.apple.com/search?term=${encodeURIComponent(track.title + ' ' + track.artist)}`,
      amazon: `https://music.amazon.com/embed/search?q=${encodeURIComponent(track.title + ' ' + track.artist)}`
    };

    return baseUrls[platform as keyof typeof baseUrls] || '';
  }

  /**
   * Mock platform search (replace with real API calls)
   */
  private async mockPlatformSearch(platform: string, query: string): Promise<Track[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Extract search terms from query
    const searchTerms = query.toLowerCase().split(' ');
    
    // Generate contextually relevant mock results based on the search query
    const generateRelevantTracks = (baseQuery: string) => {
      // If query contains specific terms, generate relevant results
      if (baseQuery.includes('shringaar') || baseQuery.includes('bhoomi')) {
        return [
          { title: 'Shringaar', artist: 'Salim Sulaiman', album: 'Bhoomi 2025' },
          { title: 'Shringaar (Instrumental)', artist: 'Salim Sulaiman', album: 'Bhoomi 2025' },
          { title: 'Shringaar - Live Version', artist: 'Shankar Mahadevan', album: 'Live Sessions' },
          { title: 'Bhoomi Theme', artist: 'Salim Sulaiman', album: 'Bhoomi 2025' },
          { title: 'Shringaar Remix', artist: 'Salim Sulaiman ft. Shraddha P', album: 'Bhoomi Remixed' }
        ];
      }
      
      if (baseQuery.includes('salim') || baseQuery.includes('sulaiman')) {
        return [
          { title: 'Shringaar', artist: 'Salim Sulaiman', album: 'Bhoomi 2025' },
          { title: 'Jai Ho', artist: 'Salim Sulaiman', album: 'Slumdog Millionaire' },
          { title: 'Arziyan', artist: 'Salim Sulaiman', album: 'Delhi 6' },
          { title: 'Maula', artist: 'Salim Sulaiman', album: 'Jab We Met' },
          { title: 'Ishq Dance', artist: 'Salim Sulaiman', album: 'Jab Tak Hai Jaan' }
        ];
      }

      // Default popular tracks for general searches
      return [
        { title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights' },
        { title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House' },
        { title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland' },
        { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3' },
        { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' }
      ];
    };

    const relevantTracks = generateRelevantTracks(query.toLowerCase());

    return relevantTracks.map((track, index) => ({
      id: `${platform}_${Math.random().toString(36).substring(2, 15)}`,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: Math.floor(Math.random() * 300000) + 120000,
      artworkUrl: `https://example.com/${platform}_artwork_${index}.jpg`,
      platform: platform as any,
      originalId: `${platform}_${Math.random().toString(36).substring(2, 15)}`
    }));
  }

  /**
   * Get AI-powered suggestions for better matches
   */
  async getAISuggestions(originalTrack: Track, context?: string): Promise<TrackMatch[]> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI suggestions - in real implementation, this would call an AI service
    const aiSuggestions = [
      {
        title: `${originalTrack.title} (Acoustic Version)`,
        artist: originalTrack.artist,
        album: `${originalTrack.album} (Deluxe)`,
        reason: 'Alternative version of the same song'
      },
      {
        title: `${originalTrack.title} (Remix)`,
        artist: `${originalTrack.artist} ft. Various Artists`,
        album: 'Remix Collection',
        reason: 'Popular remix version'
      },
      {
        title: 'Similar Song by Same Artist',
        artist: originalTrack.artist,
        album: 'Greatest Hits',
        reason: 'Similar style from same artist'
      }
    ];

    return aiSuggestions.map((suggestion, index) => ({
      track: {
        id: `ai_${Math.random().toString(36).substring(2, 15)}`,
        title: suggestion.title,
        artist: suggestion.artist,
        album: suggestion.album,
        duration: Math.floor(Math.random() * 300000) + 120000,
        artworkUrl: `https://example.com/ai_artwork_${index}.jpg`,
        platform: 'youtube' as any,
        originalId: `ai_${Math.random().toString(36).substring(2, 15)}`
      },
      confidence: 0.8 - (index * 0.1), // Decreasing confidence
      matchType: 'ai_suggested' as const,
      platform: 'youtube' as const, // Default platform for AI suggestions
      previewUrl: `https://example.com/preview/${index}`
    }));
  }

  /**
   * Custom search within a platform
   */
  async customSearch(options: SearchOptions, accessToken?: string): Promise<Track[]> {
    // Use real Spotify API if available
    if (options.platform === 'spotify' && accessToken) {
      return this.realSpotifySearch(options.query, accessToken);
    }
    
    // Fall back to mock search for other platforms or when no token
    return this.mockPlatformSearch(options.platform, options.query);
  }

  /**
   * Real Spotify search using Web API
   */
  private async realSpotifySearch(query: string, accessToken: string): Promise<Track[]> {
    try {
      console.log(`🎵 Real Spotify search for: "${query}"`);
      
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Spotify access token expired or invalid');
          throw new Error('Spotify authentication expired');
        }
        throw new Error(`Spotify search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.tracks || !data.tracks.items) {
        console.log('No tracks found in Spotify search results');
        return [];
      }

      console.log(`✅ Found ${data.tracks.items.length} real Spotify tracks`);

      return data.tracks.items.map((track: any): Track => ({
        id: track.id, // Real Spotify track ID
        title: track.name, // Real song title
        artist: track.artists.map((artist: any) => artist.name).join(', '), // Real artist names
        album: track.album?.name, // Real album name
        duration: track.duration_ms, // Real duration in milliseconds
        artworkUrl: track.album?.images?.[0]?.url, // Real album artwork
        platform: 'spotify' as any,
        originalId: track.id,
        // Add preview URL as a custom property
        ...(track.preview_url && { previewUrl: track.preview_url })
      }));
    } catch (error) {
      console.error('Real Spotify search error:', error);
      // Fall back to mock search on error
      return this.mockPlatformSearch('spotify', query);
    }
  }
}

export const songMatcherService = new SongMatcherService();
