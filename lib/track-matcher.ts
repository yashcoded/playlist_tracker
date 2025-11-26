"use client";

import { Track } from "./playlist-fetcher";

type Platform = "youtube" | "spotify" | "apple" | "amazon";

export interface MatchResult {
  sourceTrack: Track;
  matchedTrack: Track | null;
  confidence: "high" | "medium" | "low" | "none";
  matchReason?: string;
  suggestions?: Track[]; // Alternative suggestions when no match found
  allCandidates?: Track[]; // All candidates found during search (for user selection)
}

/**
 * Normalize text for matching (lowercase, remove special chars, trim)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract artist and title from a track title (for YouTube)
 * Handles formats like "Artist - Title", "Title - Artist", etc.
 */
function parseTrackTitle(title: string): { artist: string; title: string } {
  const separators = [" - ", " – ", " — ", " | "];
  
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length === 2) {
      // Try both orders
      return {
        artist: parts[0].trim(),
        title: parts[1].trim(),
      };
    }
  }
  
  // If no separator found, assume whole thing is title
  return {
    artist: "",
    title: title.trim(),
  };
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word overlap
  const words1 = s1.split(" ");
  const words2 = s2.split(" ");
  const commonWords = words1.filter((w) => words2.includes(w));
  return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * Match a single track against a list of candidate tracks
 */
function matchTrack(
  sourceTrack: Track,
  candidates: Track[],
  platform: Platform
): MatchResult {
  if (candidates.length === 0) {
    return {
      sourceTrack,
      matchedTrack: null,
      confidence: "none",
    };
  }

  // Parse source track title if needed (for YouTube)
  let sourceArtist = sourceTrack.artist;
  let sourceTitle = sourceTrack.title;
  
  if (sourceTrack.platform === "youtube" && !sourceArtist) {
    const parsed = parseTrackTitle(sourceTrack.title);
    sourceArtist = parsed.artist;
    sourceTitle = parsed.title;
  }

  let bestMatch: Track | null = null;
  let bestScore = 0;
  let matchReason = "";

  for (const candidate of candidates) {
    // Calculate title similarity
    const titleScore = similarity(sourceTitle, candidate.title);
    
    // Calculate artist similarity
    const artistScore = sourceArtist && candidate.artist
      ? similarity(sourceArtist, candidate.artist)
      : 0;

    // If no artist in source, rely more on title
    const artistWeight = sourceArtist ? 0.4 : 0.1;
    const titleWeight = sourceArtist ? 0.6 : 0.9;

    // Combined score (weighted: title weight, artist weight)
    let score = titleScore * titleWeight + artistScore * artistWeight;

    // Bonus for duration match (if both have duration)
    if (sourceTrack.duration && candidate.duration) {
      const durationDiff = Math.abs(sourceTrack.duration - candidate.duration);
      const durationTolerance = 10; // 10 seconds tolerance (increased from 5)
      if (durationDiff <= durationTolerance) {
        score += 0.15; // Bonus for duration match
      } else if (durationDiff <= 30) {
        score += 0.05; // Small bonus for close duration
      }
    }

    // Bonus if title is very similar even without artist match
    if (titleScore > 0.85 && artistScore < 0.5) {
      score += 0.1; // Boost for strong title match
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
      
      if (titleScore > 0.9 && artistScore > 0.9) {
        matchReason = "Exact match";
      } else if (titleScore > 0.8 && artistScore > 0.7) {
        matchReason = "High similarity";
      } else if (titleScore > 0.6) {
        matchReason = "Title match";
      } else {
        matchReason = "Partial match";
      }
    }
  }

  // Determine confidence level (lowered thresholds for better matching)
  let confidence: "high" | "medium" | "low" | "none";
  if (bestScore >= 0.7) {
    confidence = "high";
  } else if (bestScore >= 0.5) {
    confidence = "medium";
  } else if (bestScore >= 0.3) {
    confidence = "low";
  } else {
    confidence = "none";
    bestMatch = null;
  }

  return {
    sourceTrack,
    matchedTrack: bestMatch,
    confidence,
    matchReason: bestMatch ? matchReason : undefined,
    allCandidates: candidates, // Include all candidates for user selection
  };
}

/**
 * Search for tracks on a platform
 */
async function searchTracks(
  platform: Platform,
  query: string,
  accessToken: string
): Promise<Track[]> {
  switch (platform) {
    case "spotify": {
      // Remove quotes from query for Spotify (it doesn't support quoted phrases well)
      const cleanQuery = query.replace(/["']/g, "");
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery)}&type=track&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Spotify search error:", response.status, errorText);
        throw new Error(`Spotify search error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
        return [];
      }

      return data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        duration: Math.floor(track.duration_ms / 1000),
        album: track.album?.name,
        thumbnail: track.album?.images?.[0]?.url,
        platform: "spotify",
        originalId: track.id,
      }));
    }

    case "youtube": {
      // YouTube API doesn't require Bearer token for search, just the API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!apiKey) {
        throw new Error("YouTube API key not configured");
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`,
        {
          method: "GET",
          // Don't send Bearer token for YouTube search API
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube search error:", response.status, errorText);
        throw new Error(`YouTube search error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.default?.url,
        platform: "youtube",
        originalId: item.id.videoId,
      }));
    }

    default:
      return [];
  }
}

/**
 * Build optimized search query for better matching
 */
function buildSearchQuery(track: Track, platform: Platform): string {
  // Clean up the title and artist
  let title = track.title.trim();
  let artist = track.artist?.trim() || "";

  // Remove common YouTube suffixes and prefixes
  title = title
    .replace(/^\[.*?\]\s*/, "") // Remove [Official Video] etc
    .replace(/\s*\(.*?\)\s*$/, "") // Remove (Official Video) etc
    .replace(/\s*-\s*Official.*$/i, "") // Remove "- Official Video"
    .replace(/\s*\(.*?Official.*?\)/i, "") // Remove (Official Audio)
    .replace(/\s*\(.*?Lyrics.*?\)/i, "") // Remove (Lyrics)
    .replace(/\s*\(.*?Audio.*?\)/i, "") // Remove (Audio)
    .replace(/\s*\[.*?\]/g, "") // Remove [HD], [4K] etc
    .trim();

  // Remove common artist suffixes
  artist = artist
    .replace(/\s*-\s*Topic$/i, "") // Remove "- Topic" from YouTube
    .replace(/\s*VEVO$/i, "") // Remove "VEVO"
    .replace(/\s*Official.*$/i, "") // Remove "Official"
    .trim();

  // Build query based on platform
  if (platform === "spotify") {
    // Spotify works better with simple queries
    if (artist && title) {
      return `${artist} ${title}`;
    } else if (title) {
      return title;
    }
  } else if (platform === "youtube") {
    // YouTube also works better with simple queries
    if (artist && title) {
      return `${artist} ${title}`;
    } else if (title) {
      return title;
    }
  }

  return title || "";
}

/**
 * Match tracks from source platform to destination platform
 */
export async function matchTracks(
  sourceTracks: Track[],
  destinationPlatform: Platform,
  accessToken: string,
  onProgress?: (progress: { current: number; total: number; matched: number }) => void
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  let matchedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sourceTracks.length; i++) {
    const sourceTrack = sourceTracks[i];
    
    // Build optimized search query
    const query = buildSearchQuery(sourceTrack, destinationPlatform);
    
    if (!query) {
      console.warn(`Skipping track with no searchable content: ${sourceTrack.title}`);
      results.push({
        sourceTrack,
        matchedTrack: null,
        confidence: "none",
      });
      continue;
    }

    try {
      // Search for tracks on destination platform
      const candidates = await searchTracks(destinationPlatform, query, accessToken);
      
      if (candidates.length === 0) {
        // Try a simpler query if first search failed
        const simpleQuery = sourceTrack.title.trim();
        if (simpleQuery && simpleQuery !== query) {
          const fallbackCandidates = await searchTracks(destinationPlatform, simpleQuery, accessToken);
          
          if (fallbackCandidates.length > 0) {
            // Match the track with fallback results
            const match = matchTrack(sourceTrack, fallbackCandidates, destinationPlatform);
            results.push(match);
            
            if (match.matchedTrack) {
              matchedCount++;
            }
          } else {
            // Try searching by artist name only, then compare titles
            if (sourceTrack.artist && sourceTrack.artist.trim() && sourceTrack.artist !== "Unknown Artist") {
              const artistQuery = sourceTrack.artist.trim();
              const artistCandidates = await searchTracks(destinationPlatform, artistQuery, accessToken);
              
              if (artistCandidates.length > 0) {
                // Filter candidates by title similarity to source title
                const titleNormalized = normalizeText(sourceTrack.title);
                const filteredCandidates = artistCandidates
                  .map(candidate => {
                    const candidateTitleNormalized = normalizeText(candidate.title);
                    const titleSim = similarity(titleNormalized, candidateTitleNormalized);
                    return { candidate, titleSim };
                  })
                  .filter(item => item.titleSim > 0.3) // At least 30% title similarity
                  .sort((a, b) => b.titleSim - a.titleSim)
                  .map(item => item.candidate);
                
                if (filteredCandidates.length > 0) {
                  const match = matchTrack(sourceTrack, filteredCandidates, destinationPlatform);
                  
                  // Include all artist candidates as suggestions
                  results.push({
                    ...match,
                    suggestions: artistCandidates.slice(0, 5), // Top 5 suggestions from artist search
                  });
                  
                  if (match.matchedTrack) {
                    matchedCount++;
                  }
                } else {
                  // No good title matches from artist search, but provide suggestions
                  results.push({
                    sourceTrack,
                    matchedTrack: null,
                    confidence: "none",
                    suggestions: artistCandidates.slice(0, 5), // Top 5 suggestions from artist search
                  });
                }
              } else {
                // Try even simpler - just the main words from title
                const words = simpleQuery.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(" ");
                if (words && words !== simpleQuery) {
                  const wordCandidates = await searchTracks(destinationPlatform, words, accessToken);
                  const match = matchTrack(sourceTrack, wordCandidates, destinationPlatform);
                  
                  // Include suggestions even if no match
                  results.push({
                    ...match,
                    suggestions: wordCandidates.slice(0, 5), // Top 5 suggestions
                  });
                  
                  if (match.matchedTrack) {
                    matchedCount++;
                  }
                } else {
                  // No candidates found - provide empty result with no suggestions
                  results.push({
                    sourceTrack,
                    matchedTrack: null,
                    confidence: "none",
                    suggestions: [],
                  });
                }
              }
            } else {
              // No artist available, try even simpler - just the main words from title
              const words = simpleQuery.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(" ");
              if (words && words !== simpleQuery) {
                const wordCandidates = await searchTracks(destinationPlatform, words, accessToken);
                const match = matchTrack(sourceTrack, wordCandidates, destinationPlatform);
                
                // Include suggestions even if no match
                results.push({
                  ...match,
                  suggestions: wordCandidates.slice(0, 5), // Top 5 suggestions
                });
                
                if (match.matchedTrack) {
                  matchedCount++;
                }
              } else {
                // No candidates found - provide empty result with no suggestions
                results.push({
                  sourceTrack,
                  matchedTrack: null,
                  confidence: "none",
                  suggestions: [],
                });
              }
            }
          }
        } else {
          // No title query available - try searching by artist name only
          if (sourceTrack.artist && sourceTrack.artist.trim() && sourceTrack.artist !== "Unknown Artist") {
            const artistQuery = sourceTrack.artist.trim();
            const artistCandidates = await searchTracks(destinationPlatform, artistQuery, accessToken);
            
            if (artistCandidates.length > 0) {
              // Filter candidates by title similarity to source title
              const titleNormalized = normalizeText(sourceTrack.title);
              const filteredCandidates = artistCandidates
                .map(candidate => {
                  const candidateTitleNormalized = normalizeText(candidate.title);
                  const titleSim = similarity(titleNormalized, candidateTitleNormalized);
                  return { candidate, titleSim };
                })
                .filter(item => item.titleSim > 0.3) // At least 30% title similarity
                .sort((a, b) => b.titleSim - a.titleSim)
                .map(item => item.candidate);
              
              if (filteredCandidates.length > 0) {
                const match = matchTrack(sourceTrack, filteredCandidates, destinationPlatform);
                
                // Include all artist candidates as suggestions
                results.push({
                  ...match,
                  suggestions: artistCandidates.slice(0, 5), // Top 5 suggestions from artist search
                });
                
                if (match.matchedTrack) {
                  matchedCount++;
                }
              } else {
                // No good title matches from artist search, but provide suggestions
                results.push({
                  sourceTrack,
                  matchedTrack: null,
                  confidence: "none",
                  suggestions: artistCandidates.slice(0, 5), // Top 5 suggestions from artist search
                });
              }
            } else {
              // No candidates found - try to get suggestions based on title only
              const titleOnlyQuery = sourceTrack.title.split(/\s+/).slice(0, 5).join(" ");
              const suggestionCandidates = await searchTracks(destinationPlatform, titleOnlyQuery, accessToken);
              
              results.push({
                sourceTrack,
                matchedTrack: null,
                confidence: "none",
                suggestions: suggestionCandidates.slice(0, 5), // Top 5 suggestions
              });
            }
          } else {
            // No artist available - try to get suggestions based on title only
            const titleOnlyQuery = sourceTrack.title.split(/\s+/).slice(0, 5).join(" ");
            const suggestionCandidates = await searchTracks(destinationPlatform, titleOnlyQuery, accessToken);
            
            results.push({
              sourceTrack,
              matchedTrack: null,
              confidence: "none",
              suggestions: suggestionCandidates.slice(0, 5), // Top 5 suggestions
            });
          }
        }
      } else {
        // Match the track
        const match = matchTrack(sourceTrack, candidates, destinationPlatform);
        
        // If no match found, try artist-only search as fallback
        if (!match.matchedTrack && sourceTrack.artist && sourceTrack.artist.trim() && sourceTrack.artist !== "Unknown Artist") {
          const artistQuery = sourceTrack.artist.trim();
          const artistCandidates = await searchTracks(destinationPlatform, artistQuery, accessToken);
          
          if (artistCandidates.length > 0) {
            // Filter candidates by title similarity to source title
            const titleNormalized = normalizeText(sourceTrack.title);
            const filteredCandidates = artistCandidates
              .map(candidate => {
                const candidateTitleNormalized = normalizeText(candidate.title);
                const titleSim = similarity(titleNormalized, candidateTitleNormalized);
                return { candidate, titleSim };
              })
              .filter(item => item.titleSim > 0.3) // At least 30% title similarity
              .sort((a, b) => b.titleSim - a.titleSim)
              .map(item => item.candidate);
            
            if (filteredCandidates.length > 0) {
              // Try matching again with artist-filtered candidates
              const artistMatch = matchTrack(sourceTrack, filteredCandidates, destinationPlatform);
              if (artistMatch.matchedTrack) {
                // Found a match via artist search!
                match.matchedTrack = artistMatch.matchedTrack;
                match.confidence = artistMatch.confidence;
                match.matchReason = artistMatch.matchReason || "Matched by artist + title comparison";
                matchedCount++;
              }
            }
            
            // Always include artist candidates as suggestions
            match.suggestions = [...(match.suggestions || []), ...artistCandidates.slice(0, 5)];
            // Remove duplicates
            const seen = new Set();
            match.suggestions = match.suggestions.filter(s => {
              const key = `${s.id}-${s.platform}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }).slice(0, 5);
          }
        }
        
        // If still no match found, include suggestions from original candidates
        if (!match.matchedTrack && candidates.length > 0) {
          match.suggestions = candidates.slice(0, 5); // Top 5 suggestions
        }
        
        results.push(match);

        if (match.matchedTrack) {
          matchedCount++;
        }
      }

      onProgress?.({
        current: i + 1,
        total: sourceTracks.length,
        matched: matchedCount,
      });

      // Rate limiting: small delay between searches to avoid hitting rate limits
      if (i < sourceTracks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Reduced from 200ms
      }
    } catch (error) {
      errorCount++;
      console.error(`Error matching track "${sourceTrack.title}":`, error);
      
      // If we're getting too many errors, log a warning
      if (errorCount > 10 && errorCount % 10 === 0) {
        console.warn(`High error rate: ${errorCount} errors out of ${i + 1} tracks processed`);
      }
      
      results.push({
        sourceTrack,
        matchedTrack: null,
        confidence: "none",
      });
    }
  }

  console.log(`Matching complete: ${matchedCount}/${sourceTracks.length} matched, ${errorCount} errors`);
  return results;
}

