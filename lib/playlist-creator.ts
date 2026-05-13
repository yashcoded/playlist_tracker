"use client";

import { getToken } from "./token-storage";
import { Track } from "./playlist-fetcher";
import { MatchResult } from "./track-matcher";

type Platform = "youtube" | "spotify" | "apple" | "amazon";

export interface CreatedPlaylist {
  id: string;
  name: string;
  url: string;
  trackCount: number;
}

async function spotifyErrorDetail(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { error?: { message?: string } | string };
    if (typeof data?.error === "object" && data.error?.message) return data.error.message;
    if (typeof data?.error === "string") return data.error;
  } catch {
    /* use raw */
  }
  const trimmed = text.trim().slice(0, 400);
  if (trimmed) return trimmed;
  const scopeHint = response.headers.get("www-authenticate") || "";
  return [response.statusText, scopeHint].filter(Boolean).join(" ");
}

/** Spotify track IDs are typically 22 base62 characters. */
function isLikelySpotifyTrackId(id: string | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9A-Za-z]{22}$/.test(id);
}

/**
 * Create a playlist on Spotify
 */
async function createSpotifyPlaylist(
  name: string,
  description: string | undefined,
  tracks: Track[],
  accessToken: string
): Promise<CreatedPlaylist> {
  const meResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!meResponse.ok) {
    const detail = await spotifyErrorDetail(meResponse);
    throw new Error(
      `Spotify profile request failed (${meResponse.status}): ${detail}. Try disconnecting and reconnecting Spotify.`
    );
  }

  // Current API: create for the authenticated user (avoid legacy /users/{id}/playlists issues)
  const createResponse = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description: description || `Playlist transferred from another platform`,
      public: false,
    }),
  });

  if (!createResponse.ok) {
    const detail = await spotifyErrorDetail(createResponse);
    throw new Error(
      `Spotify could not create playlist (${createResponse.status}): ${detail}. Ensure your app requests playlist-modify-public and playlist-modify-private, then reconnect Spotify.`
    );
  }

  const playlist = await createResponse.json();

  // Build URIs only for real Spotify track IDs (wrong IDs often cause API failures)
  const trackUris: string[] = [];
  const seen = new Set<string>();
  for (const track of tracks) {
    if (!isLikelySpotifyTrackId(track.id)) continue;
    const uri = `spotify:track:${track.id}`;
    if (seen.has(uri)) continue;
    seen.add(uri);
    trackUris.push(uri);
  }

  if (trackUris.length === 0) {
    throw new Error(
      "No tracks have valid Spotify track IDs to add. Pick matches from Spotify search or reconnect and try again."
    );
  }

  if (trackUris.length < tracks.length) {
    console.warn(
      `Spotify playlist: skipped ${tracks.length - trackUris.length} tracks with invalid or duplicate Spotify IDs`
    );
  }

  // Add tracks (max 100 per request). Use /items — /tracks is deprecated and may fail for some apps.
  let addedCount = 0;
  for (let i = 0; i < trackUris.length; i += 100) {
    const chunk = trackUris.slice(i, i + 100);
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: chunk,
        }),
      }
    );

    if (!addResponse.ok) {
      const detail = await spotifyErrorDetail(addResponse);
      const hint403 =
        addResponse.status === 403
          ? " Reconnect Spotify so the token includes playlist-modify-public and playlist-modify-private. If the app is in Development mode, add your Spotify user under User management in developer.spotify.com/dashboard."
          : "";
      console.error("Spotify add tracks error:", detail);
      throw new Error(
        `Spotify could not add tracks to the playlist (${addResponse.status}): ${detail}.${hint403}`
      );
    }
    addedCount += chunk.length;
  }
  console.log(`Spotify playlist created: ${addedCount} tracks added`);

  return {
    id: playlist.id,
    name: playlist.name,
    url: playlist.external_urls.spotify,
    trackCount: addedCount,
  };
}

/**
 * Create a playlist on YouTube
 */
async function createYouTubePlaylist(
  name: string,
  description: string | undefined,
  tracks: Track[],
  accessToken: string,
  onProgress?: (current: number, total: number) => void
): Promise<CreatedPlaylist> {
  // Create playlist
  const createResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          title: name,
          description: description || `Playlist transferred from another platform`,
        },
        status: {
          privacyStatus: "private",
        },
      }),
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error("YouTube playlist creation error:", errorText);
    throw new Error(`YouTube API error: ${createResponse.statusText}`);
  }

  const playlist = await createResponse.json();
  const playlistId = playlist.id;

  // Add videos to playlist with progress tracking
  let addedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    try {
      const addResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: "youtube#video",
                videoId: track.id,
              },
            },
          }),
        }
      );

      if (addResponse.ok) {
        addedCount++;
      } else {
        failedCount++;
        const errorText = await addResponse.text();
        console.warn(`Failed to add track "${track.title}" to YouTube playlist:`, errorText);
      }

      // Update progress
      onProgress?.(i + 1, tracks.length);
    } catch (error) {
      failedCount++;
      console.error(`Error adding track "${track.title}":`, error);
    }

    // Small delay to avoid rate limiting
    if (i < tracks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`YouTube playlist created: ${addedCount} tracks added, ${failedCount} failed`);

  return {
    id: playlistId,
    name: playlist.snippet.title,
    url: `https://www.youtube.com/playlist?list=${playlistId}`,
    trackCount: addedCount,
  };
}

/**
 * Create a playlist on Apple Music
 * Note: Requires server-side implementation
 */
async function createApplePlaylist(
  name: string,
  description: string | undefined,
  tracks: Track[],
  accessToken: string
): Promise<CreatedPlaylist> {
  throw new Error("Apple Music playlist creation requires server-side implementation");
}

/**
 * Create a playlist on Amazon Music
 * Note: Amazon Music API is not publicly available
 */
async function createAmazonPlaylist(
  name: string,
  description: string | undefined,
  tracks: Track[],
  accessToken: string
): Promise<CreatedPlaylist> {
  throw new Error("Amazon Music API is not publicly available");
}

/**
 * Main function to create a playlist on any platform
 */
export async function createPlaylist(
  platform: Platform,
  name: string,
  description: string | undefined,
  matchedTracks: MatchResult[],
  onProgress?: (progress: { step: string; current: number; total: number }) => void
): Promise<CreatedPlaylist> {
  const token = getToken(platform);
  if (!token) {
    throw new Error(`Not authenticated with ${platform}. Please connect your account.`);
  }

  // Filter out tracks that couldn't be matched
  const tracksToAdd = matchedTracks
    .filter((match) => match.matchedTrack !== null)
    .map((match) => match.matchedTrack!);

  if (tracksToAdd.length === 0) {
    throw new Error("No tracks could be matched to create a playlist");
  }

  onProgress?.({ step: `Creating ${platform} playlist...`, current: 0, total: tracksToAdd.length });

  let createdPlaylist: CreatedPlaylist;
  
  switch (platform) {
    case "spotify":
      createdPlaylist = await createSpotifyPlaylist(name, description, tracksToAdd, token.accessToken);
      break;
    case "youtube":
      // Update progress as we add tracks
      createdPlaylist = await createYouTubePlaylist(
        name, 
        description, 
        tracksToAdd, 
        token.accessToken,
        (current, total) => {
          onProgress?.({ 
            step: `Adding tracks to ${platform} playlist...`, 
            current, 
            total 
          });
        }
      );
      break;
    case "apple":
      return await createApplePlaylist(name, description, tracksToAdd, token.accessToken);
    case "amazon":
      return await createAmazonPlaylist(name, description, tracksToAdd, token.accessToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  onProgress?.({ step: `Playlist created successfully!`, current: tracksToAdd.length, total: tracksToAdd.length });
  return createdPlaylist;
}

