"use client";

import { getToken } from "./token-storage";

type Platform = "youtube" | "spotify" | "apple" | "amazon";

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: number; // in seconds
  album?: string;
  thumbnail?: string;
  platform: Platform;
  originalId: string; // Original ID from source platform
}

export interface PlaylistInfo {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  trackCount: number;
  tracks: Track[];
}

/**
 * Extract playlist ID from URL
 */
export function extractPlaylistId(platform: Platform, url: string): string | null {
  try {
    switch (platform) {
      case "youtube":
        // Supports: https://www.youtube.com/playlist?list=PLxxx
        // Supports: https://www.youtube.com/watch?v=xxx&list=PLxxx (Mix playlists)
        const youtubeMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        return youtubeMatch ? youtubeMatch[1] : null;
      
      case "spotify":
        // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
        const spotifyMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
        return spotifyMatch ? spotifyMatch[1] : null;
      
      case "apple":
        // https://music.apple.com/us/playlist/xxx
        const appleMatch = url.match(/playlist\/([a-zA-Z0-9.]+)/);
        return appleMatch ? appleMatch[1] : null;
      
      case "amazon":
        // https://music.amazon.com/playlists/xxx
        const amazonMatch = url.match(/playlists\/([a-zA-Z0-9-_]+)/);
        return amazonMatch ? amazonMatch[1] : null;
      
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error extracting playlist ID for ${platform}:`, error);
    return null;
  }
}

/**
 * Fetch playlist from YouTube
 */
async function fetchYouTubePlaylist(playlistId: string, accessToken: string): Promise<PlaylistInfo> {
  // First, get playlist info
  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!playlistResponse.ok) {
    throw new Error(`YouTube API error: ${playlistResponse.statusText}`);
  }

  const playlistData = await playlistResponse.json();
  if (!playlistData.items || playlistData.items.length === 0) {
    throw new Error("Playlist not found");
  }

  const playlist = playlistData.items[0];
  const playlistName = playlist.snippet.title;
  const playlistDescription = playlist.snippet.description;
  const playlistThumbnail = playlist.snippet.thumbnails?.default?.url;

  // Fetch playlist items
  const items: Track[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const itemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    itemsUrl.searchParams.set("part", "snippet,contentDetails");
    itemsUrl.searchParams.set("playlistId", playlistId);
    itemsUrl.searchParams.set("maxResults", "50");
    if (nextPageToken) {
      itemsUrl.searchParams.set("pageToken", nextPageToken);
    }

    const itemsResponse = await fetch(itemsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!itemsResponse.ok) {
      throw new Error(`YouTube API error: ${itemsResponse.statusText}`);
    }

    const itemsData = await itemsResponse.json();
    
    if (!itemsData.items || itemsData.items.length === 0) {
      nextPageToken = itemsData.nextPageToken;
      continue;
    }

    // Get video details for duration - batch in chunks of 50 (YouTube API limit)
    const videoIds = itemsData.items
      .map((item: any) => item.contentDetails?.videoId)
      .filter(Boolean);

    if (videoIds.length > 0) {
      // Process in batches of 50
      for (let i = 0; i < videoIds.length; i += 50) {
        const batch = videoIds.slice(i, i + 50);
        const videoIdsString = batch.join(",");

        try {
          const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIdsString}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            const videoMap = new Map(
              (videosData.items || []).map((video: any) => [
                video.id,
                {
                  duration: parseDuration(video.contentDetails?.duration || ""),
                  thumbnail: video.snippet?.thumbnails?.default?.url || video.snippet?.thumbnails?.medium?.url,
                },
              ])
            );

            // Process items that correspond to this batch
            const batchStartIndex = i;
            const batchEndIndex = Math.min(i + 50, itemsData.items.length);
            
            for (let j = batchStartIndex; j < batchEndIndex; j++) {
              const item = itemsData.items[j];
              
              // Skip deleted or private videos
              if (item.snippet?.title === "Deleted video" || item.snippet?.title === "Private video") {
                console.warn(`Skipping deleted/private video: ${item.id}`);
                continue;
              }

              const videoId = item.contentDetails?.videoId;
              if (!videoId) {
                console.warn(`Skipping item without videoId: ${item.id}`);
                continue;
              }

              const videoInfo = videoMap.get(videoId) as { duration?: number; thumbnail?: string } | undefined;
              const title = item.snippet?.title || "Unknown Title";
              const artist = item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown Artist";

              // Better title cleaning - preserve the title but clean it
              let cleanTitle = title.trim();
              
              // Remove common prefixes/suffixes but keep the core title
              cleanTitle = cleanTitle
                .replace(/^\[.*?\]\s*/, "") // Remove [Official Video] etc at start
                .replace(/\s*\(.*?Official.*?\)/gi, "") // Remove (Official Audio)
                .replace(/\s*\(.*?Lyrics.*?\)/gi, "") // Remove (Lyrics)
                .replace(/\s*\[.*?\]/g, "") // Remove [HD], [4K] etc
                .trim();

              // Better artist cleaning
              let cleanArtist = artist
                .replace(/ - Topic$/i, "") // Remove YouTube channel suffix
                .replace(/\s*-\s*VEVO$/i, "") // Remove VEVO
                .replace(/\s*Official.*$/i, "") // Remove "Official"
                .trim();

              // If title cleaning removed everything, use original
              if (!cleanTitle || cleanTitle.length < 2) {
                cleanTitle = title;
              }

              items.push({
                id: videoId,
                title: cleanTitle,
                artist: cleanArtist || artist,
                duration: videoInfo?.duration,
                thumbnail: videoInfo?.thumbnail || item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url,
                platform: "youtube",
                originalId: videoId,
              });
            }
          } else {
            console.error(`Failed to fetch video details for batch ${i / 50 + 1}:`, videosResponse.statusText);
            // Still add items without video details
            for (let j = i; j < Math.min(i + 50, itemsData.items.length); j++) {
              const item = itemsData.items[j];
              const videoId = item.contentDetails?.videoId;
              if (videoId && item.snippet?.title !== "Deleted video" && item.snippet?.title !== "Private video") {
                items.push({
                  id: videoId,
                  title: item.snippet?.title || "Unknown Title",
                  artist: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown Artist",
                  platform: "youtube",
                  originalId: videoId,
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching video details for batch ${i / 50 + 1}:`, error);
          // Still add items without video details
          for (let j = i; j < Math.min(i + 50, itemsData.items.length); j++) {
            const item = itemsData.items[j];
            const videoId = item.contentDetails?.videoId;
            if (videoId && item.snippet?.title !== "Deleted video" && item.snippet?.title !== "Private video") {
              items.push({
                id: videoId,
                title: item.snippet?.title || "Unknown Title",
                artist: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown Artist",
                platform: "youtube",
                originalId: videoId,
              });
            }
          }
        }
      }
    } else {
      // No video IDs, but still try to add items if they have titles
      itemsData.items.forEach((item: any) => {
        if (item.snippet?.title && item.snippet.title !== "Deleted video" && item.snippet.title !== "Private video") {
          items.push({
            id: item.id || `unknown-${items.length}`,
            title: item.snippet.title,
            artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || "Unknown Artist",
            platform: "youtube",
            originalId: item.id || `unknown-${items.length}`,
          });
        }
      });
    }

    nextPageToken = itemsData.nextPageToken;
  } while (nextPageToken);

  return {
    id: playlistId,
    name: playlistName,
    description: playlistDescription,
    thumbnail: playlistThumbnail,
    trackCount: items.length,
    tracks: items,
  };
}

/**
 * Parse YouTube duration (PT1H2M10S format) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch playlist from Spotify
 */
async function fetchSpotifyPlaylist(playlistId: string, accessToken: string): Promise<PlaylistInfo> {
  // Get playlist info
  const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!playlistResponse.ok) {
    throw new Error(`Spotify API error: ${playlistResponse.statusText}`);
  }

  const playlist = await playlistResponse.json();
  const tracks: Track[] = [];

  // Fetch all tracks (handle pagination)
  let nextUrl: string | null = playlist.tracks.href;
  
  while (nextUrl) {
    const tracksResponse = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!tracksResponse.ok) {
      throw new Error(`Spotify API error: ${tracksResponse.statusText}`);
    }

    const tracksData = await tracksResponse.json();
    
    tracksData.items.forEach((item: any) => {
      if (item.track && !item.track.is_local) {
        const track = item.track;
        tracks.push({
          id: track.id,
          title: track.name,
          artist: track.artists.map((a: any) => a.name).join(", "),
          duration: Math.floor(track.duration_ms / 1000),
          album: track.album?.name,
          thumbnail: track.album?.images?.[0]?.url,
          platform: "spotify",
          originalId: track.id,
        });
      }
    });

    nextUrl = tracksData.next;
  }

  return {
    id: playlistId,
    name: playlist.name,
    description: playlist.description,
    thumbnail: playlist.images?.[0]?.url,
    trackCount: tracks.length,
    tracks,
  };
}

/**
 * Fetch playlist from Apple Music
 * Note: Apple Music API requires server-side JWT signing
 */
async function fetchApplePlaylist(playlistId: string, accessToken: string): Promise<PlaylistInfo> {
  // This will need to be implemented via server-side API route
  // For now, return a placeholder
  throw new Error("Apple Music playlist fetching requires server-side implementation");
}

/**
 * Fetch playlist from Amazon Music
 * Note: Amazon Music API is not publicly available
 */
async function fetchAmazonPlaylist(playlistId: string, accessToken: string): Promise<PlaylistInfo> {
  throw new Error("Amazon Music API is not publicly available");
}

/**
 * Main function to fetch playlist from any platform
 */
export async function fetchPlaylist(
  platform: Platform,
  url: string,
  onProgress?: (progress: { step: string; current: number; total: number }) => void
): Promise<PlaylistInfo> {
  const playlistId = extractPlaylistId(platform, url);
  if (!playlistId) {
    throw new Error(`Could not extract playlist ID from URL: ${url}`);
  }

  const token = getToken(platform);
  if (!token) {
    throw new Error(`Not authenticated with ${platform}. Please connect your account.`);
  }

  onProgress?.({ step: `Fetching ${platform} playlist...`, current: 0, total: 1 });

  switch (platform) {
    case "youtube":
      return await fetchYouTubePlaylist(playlistId, token.accessToken);
    case "spotify":
      return await fetchSpotifyPlaylist(playlistId, token.accessToken);
    case "apple":
      return await fetchApplePlaylist(playlistId, token.accessToken);
    case "amazon":
      return await fetchAmazonPlaylist(playlistId, token.accessToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

