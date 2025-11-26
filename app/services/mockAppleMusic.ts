/**
 * Mock Apple Music Service
 * 
 * This service simulates Apple Music API functionality for development
 * and testing purposes when you don't have access to Apple Developer keys.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // in milliseconds
  isrc?: string;
  artworkUrl?: string;
  platform: "youtube" | "spotify" | "apple" | "amazon";
  originalId: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  artworkUrl?: string;
  curatorName?: string;
  trackCount: number;
  playTime: number; // total duration in milliseconds
}

export interface CreatePlaylistResponse {
  success: boolean;
  playlistId?: string;
  url?: string;
  error?: string;
}

class MockAppleMusicService {
  private isAuthenticated = false;
  private mockDelay = 1000; // Simulate network delay

  /**
   * Simulate user authentication
   */
  async authenticate(): Promise<boolean> {
    await this.delay(500);
    
    // Simulate authentication success/failure
    const success = Math.random() > 0.1; // 90% success rate
    this.isAuthenticated = success;
    
    if (!success) {
      throw new Error('Authentication failed. Please try again.');
    }
    
    return true;
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Extract playlist ID from Apple Music URL
   */
  private extractPlaylistId(url: string): string | null {
    const patterns = [
      /music\.apple\.com\/[a-z]{2}\/playlist\/[^\/]+\/pl\.([a-zA-Z0-9]+)/,
      /music\.apple\.com\/playlist\/[^\/]+\/pl\.([a-zA-Z0-9]+)/,
      /music\.apple\.com\/.*\/playlist\/.*\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Get playlist data from Apple Music URL
   */
  async getPlaylist(url: string): Promise<Playlist> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated. Please sign in to Apple Music.');
    }

    await this.delay(this.mockDelay);

    const playlistId = this.extractPlaylistId(url);
    if (!playlistId) {
      throw new Error('Invalid Apple Music playlist URL');
    }

    // Generate mock playlist data based on URL
    const mockPlaylists = this.getMockPlaylists();
    const playlist = mockPlaylists.find(p => p.id === playlistId) || this.generateRandomPlaylist(playlistId);

    return playlist;
  }

  /**
   * Create a new playlist on Apple Music
   */
  async createPlaylist(name: string, tracks: Track[], description?: string): Promise<CreatePlaylistResponse> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated. Please sign in to Apple Music.');
    }

    await this.delay(2000); // Longer delay for creation

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      return {
        success: false,
        error: 'Failed to create playlist. Please try again.'
      };
    }

    const playlistId = `pl.${this.generateId()}`;
    const url = `https://music.apple.com/us/playlist/${name.toLowerCase().replace(/\s+/g, '-')}/${playlistId}`;

    return {
      success: true,
      playlistId,
      url
    };
  }

  /**
   * Search for tracks on Apple Music
   */
  async searchTracks(query: string, limit: number = 10): Promise<Track[]> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated. Please sign in to Apple Music.');
    }

    await this.delay(800);

    // Generate mock search results
    const mockTracks = this.generateMockTracks(limit, query);
    return mockTracks;
  }

  /**
   * Get user's library playlists
   */
  async getUserPlaylists(): Promise<Playlist[]> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated. Please sign in to Apple Music.');
    }

    await this.delay(1200);

    return this.getMockUserPlaylists();
  }

  /**
   * Add tracks to existing playlist
   */
  async addTracksToPlaylist(playlistId: string, tracks: Track[]): Promise<boolean> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated. Please sign in to Apple Music.');
    }

    await this.delay(1500);

    // Simulate success/failure
    return Math.random() > 0.05; // 95% success rate
  }

  // Private helper methods

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getMockPlaylists(): Playlist[] {
    return [
      {
        id: 'pl.u-MDAWKKKtELWqZg',
        name: 'Today\'s Hits',
        description: 'The biggest songs right now.',
        trackCount: 50,
        playTime: 12000000,
        artworkUrl: 'https://example.com/artwork1.jpg',
        curatorName: 'Apple Music',
        tracks: [
          {
            id: '1',
            title: 'Anti-Hero',
            artist: 'Taylor Swift',
            album: 'Midnights',
            duration: 200000,
            artworkUrl: 'https://example.com/track1.jpg',
            platform: 'apple' as const,
            originalId: '1'
          },
          {
            id: '2',
            title: 'As It Was',
            artist: 'Harry Styles',
            album: 'Harry\'s House',
            duration: 167000,
            artworkUrl: 'https://example.com/track2.jpg',
            platform: 'apple' as const,
            originalId: '2'
          }
        ]
      },
      {
        id: 'pl.u-XkD0KKKsZLWqZg',
        name: 'Chill Indie',
        description: 'Relaxing indie tracks for any mood.',
        trackCount: 30,
        playTime: 7200000,
        tracks: [
          {
            id: '3',
            title: 'Heat Waves',
            artist: 'Glass Animals',
            album: 'Dreamland',
            duration: 238000,
            platform: 'apple' as const,
            originalId: '3'
          },
          {
            id: '4',
            title: 'Levitating',
            artist: 'Dua Lipa',
            album: 'Future Nostalgia',
            duration: 203000,
            platform: 'apple' as const,
            originalId: '4'
          }
        ]
      }
    ];
  }

  private generateRandomPlaylist(id: string): Playlist {
    const names = [
      'My Awesome Mix', 'Road Trip Vibes', 'Workout Energy', 'Study Focus',
      'Party Hits', 'Chill Evening', 'Morning Motivation', 'Throwback Thursday'
    ];
    
    const name = names[Math.floor(Math.random() * names.length)];
    const trackCount = Math.floor(Math.random() * 50) + 10;
    const tracks = this.generateMockTracks(Math.min(trackCount, 10));

    return {
      id,
      name,
      description: `A great collection of ${trackCount} songs`,
      trackCount,
      playTime: trackCount * 180000, // Average 3 minutes per track
      tracks
    };
  }

  private generateMockTracks(count: number, searchQuery?: string): Track[] {
    const mockTracks = [
      { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
      { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
      { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California' },
      { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction' },
      { title: 'Imagine', artist: 'John Lennon', album: 'Imagine' },
      { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller' },
      { title: 'Like a Rolling Stone', artist: 'Bob Dylan', album: 'Highway 61 Revisited' },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind' },
      { title: 'What\'s Going On', artist: 'Marvin Gaye', album: 'What\'s Going On' },
      { title: 'Purple Haze', artist: 'Jimi Hendrix', album: 'Are You Experienced' }
    ];

    return Array.from({ length: count }, (_, index) => {
      const track = mockTracks[index % mockTracks.length];
      return {
        id: `track_${this.generateId()}`,
        title: searchQuery ? `${track.title} (${searchQuery})` : track.title,
        artist: track.artist,
        album: track.album,
        duration: Math.floor(Math.random() * 300000) + 120000, // 2-7 minutes
        artworkUrl: `https://example.com/artwork_${index}.jpg`,
        platform: 'apple' as const,
        originalId: `track_${this.generateId()}`
      };
    });
  }

  private getMockUserPlaylists(): Playlist[] {
    return [
      {
        id: 'pl.u-user1',
        name: 'My Favorites',
        description: 'Songs I love',
        trackCount: 25,
        playTime: 5400000,
        tracks: this.generateMockTracks(5)
      },
      {
        id: 'pl.u-user2',
        name: 'Workout Mix',
        description: 'High energy tracks',
        trackCount: 40,
        playTime: 8400000,
        tracks: this.generateMockTracks(5)
      }
    ];
  }
}

// Export singleton instance
export const mockAppleMusicService = new MockAppleMusicService();

// Types are already exported as interfaces above

/**
 * Mock Amazon Music Service
 * Amazon Music API is not publicly available, so this provides mock functionality
 */
class MockAmazonMusicService {
  private isAuthenticated = false;

  async authenticate(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isAuthenticated = Math.random() > 0.1; // 90% success rate
    return this.isAuthenticated;
  }

  async getPlaylist(url: string): Promise<Playlist> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated. Please sign in to Amazon Music.');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      id: 'amz_' + Math.random().toString(36).substring(2, 15),
      name: 'Amazon Music Playlist',
      description: 'Imported from Amazon Music',
      trackCount: 25,
      playTime: 5400000,
      tracks: this.generateAmazonTracks(10)
    };
  }

  async createPlaylist(name: string, tracks: Track[]): Promise<CreatePlaylistResponse> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated.');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      playlistId: 'amz_' + Math.random().toString(36).substring(2, 15),
      url: `https://music.amazon.com/playlists/${name.toLowerCase().replace(/\s+/g, '-')}`
    };
  }

  async searchTracks(query: string, limit: number = 10): Promise<Track[]> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated.');
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    return this.generateAmazonTracks(limit, query);
  }

  private generateAmazonTracks(count: number, searchQuery?: string): Track[] {
    const amazonTracks = [
      { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' },
      { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3: OVER YOU' },
      { title: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', album: 'MONTERO' },
      { title: 'Bad Habits', artist: 'Ed Sheeran', album: '=' },
      { title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar & Giveon', album: 'Justice' }
    ];

    return Array.from({ length: count }, (_, index) => {
      const track = amazonTracks[index % amazonTracks.length];
      return {
        id: `amz_track_${Math.random().toString(36).substring(2, 15)}`,
        title: searchQuery ? `${track.title} (${searchQuery})` : track.title,
        artist: track.artist,
        album: track.album,
        duration: Math.floor(Math.random() * 300000) + 120000,
        artworkUrl: `https://example.com/amazon_artwork_${index}.jpg`,
        platform: 'amazon' as const,
        originalId: `amz_track_${Math.random().toString(36).substring(2, 15)}`
      };
    });
  }
}

export const mockAmazonMusicService = new MockAmazonMusicService();
