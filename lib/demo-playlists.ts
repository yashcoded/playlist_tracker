/**
 * Demo Playlists for Testing
 * 
 * This provides realistic demo data when real APIs aren't available
 */

import { Track, PlaylistInfo } from './playlist-fetcher';

export function createDemoPlaylist(url: string, platform: string): PlaylistInfo {
  // Extract some context from the URL to create relevant demo data
  const urlLower = url.toLowerCase();
  
  // Create contextually relevant demo tracks based on URL
  let demoTracks: Omit<Track, 'platform' | 'originalId'>[] = [];
  
  if (urlLower.includes('bollywood') || urlLower.includes('hindi') || urlLower.includes('indian')) {
    demoTracks = [
      { id: 'demo1', title: 'Shringaar', artist: 'Salim Sulaiman', album: 'Bhoomi 2025', duration: 245 },
      { id: 'demo2', title: 'Jai Ho', artist: 'Salim Sulaiman', album: 'Slumdog Millionaire', duration: 205 },
      { id: 'demo3', title: 'Arziyan', artist: 'Salim Sulaiman', album: 'Delhi 6', duration: 267 },
      { id: 'demo4', title: 'Maula', artist: 'Salim Sulaiman', album: 'Jab We Met', duration: 198 },
      { id: 'demo5', title: 'Ishq Dance', artist: 'Salim Sulaiman', album: 'Jab Tak Hai Jaan', duration: 223 }
    ];
  } else if (urlLower.includes('pop') || urlLower.includes('hits')) {
    demoTracks = [
      { id: 'demo1', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: 200 },
      { id: 'demo2', title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', duration: 167 },
      { id: 'demo3', title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: 238 },
      { id: 'demo4', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3', duration: 141 },
      { id: 'demo5', title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', duration: 178 }
    ];
  } else if (urlLower.includes('rock') || urlLower.includes('classic')) {
    demoTracks = [
      { id: 'demo1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: 355 },
      { id: 'demo2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration: 482 },
      { id: 'demo3', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: 391 },
      { id: 'demo4', title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', duration: 356 },
      { id: 'demo5', title: 'Imagine', artist: 'John Lennon', album: 'Imagine', duration: 183 }
    ];
  } else {
    // Default mixed playlist
    demoTracks = [
      { id: 'demo1', title: 'Shringaar', artist: 'Salim Sulaiman', album: 'Bhoomi 2025', duration: 245 },
      { id: 'demo2', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: 200 },
      { id: 'demo3', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: 355 },
      { id: 'demo4', title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: 238 },
      { id: 'demo5', title: 'Jai Ho', artist: 'Salim Sulaiman', album: 'Slumdog Millionaire', duration: 205 }
    ];
  }
  
  // Convert to full Track objects
  const tracks: Track[] = demoTracks.map(track => ({
    ...track,
    platform: platform as any,
    originalId: track.id,
    thumbnail: `https://picsum.photos/300/300?random=${track.id}`
  }));
  
  return {
    id: 'demo-playlist-' + Math.random().toString(36).substring(2, 15),
    name: `Demo Playlist (${platform})`,
    description: `Demo playlist for testing - based on URL: ${url}`,
    thumbnail: 'https://picsum.photos/400/400?random=playlist',
    trackCount: tracks.length,
    tracks
  };
}

// Specific demo playlists for common scenarios
export const DEMO_PLAYLISTS = {
  bollywood: {
    name: 'Bollywood Hits',
    tracks: [
      { id: 'demo1', title: 'Shringaar', artist: 'Salim Sulaiman', album: 'Bhoomi 2025' },
      { id: 'demo2', title: 'Jai Ho', artist: 'Salim Sulaiman', album: 'Slumdog Millionaire' },
      { id: 'demo3', title: 'Arziyan', artist: 'Salim Sulaiman', album: 'Delhi 6' },
      { id: 'demo4', title: 'Maula', artist: 'Salim Sulaiman', album: 'Jab We Met' },
      { id: 'demo5', title: 'Ishq Dance', artist: 'Salim Sulaiman', album: 'Jab Tak Hai Jaan' }
    ]
  },
  
  pop: {
    name: 'Pop Hits 2024',
    tracks: [
      { id: 'demo1', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights' },
      { id: 'demo2', title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House' },
      { id: 'demo3', title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland' },
      { id: 'demo4', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3' },
      { id: 'demo5', title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' }
    ]
  }
};
