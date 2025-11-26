"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { YouTubeLogo, SpotifyLogo, AppleMusicLogo, AmazonMusicLogo } from "../components/PlatformLogo";
import OAuthButton from "../components/OAuthButton";
import SongPreview, { useAudioPreview } from "../components/SongPreview";
import { 
  getAuthenticatedPlatforms, 
  isAuthenticated, 
  storeToken, 
  getToken,
  getTokenFromCookie
} from "../../lib/token-storage";
import { fetchPlaylist, PlaylistInfo, Track } from "../../lib/playlist-fetcher";
import { matchTracks, MatchResult } from "../../lib/track-matcher";
import { createPlaylist, CreatedPlaylist } from "../../lib/playlist-creator";
import { createDemoPlaylist } from "../../lib/demo-playlists";
import AudioPreview from "../components/AudioPreview";
import SmartTrackMatcher from "../components/SmartTrackMatcher";
import MatchResultsSections from "../components/MatchResultsSections";

// Helper function to calculate similarity (same as in track-matcher)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const words1 = s1.split(" ");
  const words2 = s2.split(" ");
  const commonWords = words1.filter((w) => words2.includes(w));
  return commonWords.length / Math.max(words1.length, words2.length);
}

type Platform = "youtube" | "spotify" | "apple" | "amazon" | "";

export default function TransferPage() {
  const searchParams = useSearchParams();
  const [sourcePlatform, setSourcePlatform] = useState<Platform>("");
  const [destinationPlatform, setDestinationPlatform] = useState<Platform>("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const audioPreview = useAudioPreview();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authenticatedPlatforms, setAuthenticatedPlatforms] = useState<Set<Platform>>(new Set());
  const [showAuth, setShowAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<{ step: string; current: number; total: number; matched?: number } | null>(null);
  const [playlistPreview, setPlaylistPreview] = useState<PlaylistInfo | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [createdPlaylist, setCreatedPlaylist] = useState<CreatedPlaylist | null>(null);
  const [userSelections, setUserSelections] = useState<Map<number, Track>>(new Map()); // Track index -> selected track
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [currentSelectionIndex, setCurrentSelectionIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["high", "medium", "low", "none"])); // All expanded by default
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [smartMatchResults, setSmartMatchResults] = useState<any[]>([]);
  const [showSmartMatching, setShowSmartMatching] = useState(false);
  const [pendingPlaylistCreation, setPendingPlaylistCreation] = useState<{
    matches: MatchResult[];
    playlist: PlaylistInfo;
  } | null>(null);

  const platformNames = {
    youtube: "YouTube",
    spotify: "Spotify",
    apple: "Apple Music",
    amazon: "Amazon Music",
  };

  // Save form state to localStorage before OAuth redirect
  useEffect(() => {
    const saveFormState = () => {
      try {
        localStorage.setItem('transfer_form_state', JSON.stringify({
          sourcePlatform,
          destinationPlatform,
          playlistUrl,
        }));
      } catch (error) {
        console.error('Error saving form state:', error);
      }
    };

    // Save state whenever form values change (but not on initial mount)
    if (sourcePlatform || destinationPlatform || playlistUrl) {
      saveFormState();
    }
  }, [sourcePlatform, destinationPlatform, playlistUrl]);

  // Restore form state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('transfer_form_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.sourcePlatform) setSourcePlatform(state.sourcePlatform);
        if (state.destinationPlatform) setDestinationPlatform(state.destinationPlatform);
        if (state.playlistUrl) setPlaylistUrl(state.playlistUrl);
      }
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }, []);

  // Scroll to top when confirmation modal opens
  useEffect(() => {
    if (showConfirmationModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showConfirmationModal]);

  // Lazy load: Check for stored tokens on mount and handle OAuth callbacks
  useEffect(() => {
    const loadStoredTokens = async () => {
      // Check localStorage for tokens
      const platforms: Array<Exclude<Platform, "">> = ["youtube", "spotify", "apple", "amazon"];
      const authenticated = new Set<Platform>();
      
      platforms.forEach((platform) => {
        if (isAuthenticated(platform)) {
          authenticated.add(platform);
        }
      });

      // Also check cookies (set by API routes) and sync to localStorage
      // This is important for OAuth callbacks
      platforms.forEach((platform) => {
        const cookieToken = getTokenFromCookie(platform);
        if (cookieToken) {
            authenticated.add(platform);
          console.log(`Token synced from cookie for ${platform}`);
        }
      });

      setAuthenticatedPlatforms(authenticated);
      setIsLoading(false);
    };

    // Handle OAuth callback
    const authPlatform = searchParams?.get("platform") as Platform | null;
    const authStatus = searchParams?.get("auth");
    const authError = searchParams?.get("error");

    if (authPlatform && authStatus === "success") {
      // OAuth success - token should be in cookie, sync it to localStorage
      console.log(`OAuth success for ${authPlatform}`);
      
      // Check if token was passed in URL (for cross-domain cookie issues or as fallback)
      const tokenParam = searchParams?.get("token");
      if (tokenParam) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(tokenParam));
          console.log(`✅ Token received via URL for ${authPlatform}`, { 
            hasAccessToken: !!tokenData.accessToken,
            hasRefreshToken: !!tokenData.refreshToken,
            expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).toLocaleString() : 'N/A'
          });
          
          // Store directly in localStorage
          storeToken(authPlatform, {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresAt: tokenData.expiresAt,
            platform: authPlatform,
          });
          console.log(`✅ Token stored in localStorage for ${authPlatform}`);
          
          // Verify the token was stored correctly
          const storedToken = getToken(authPlatform);
          if (storedToken?.accessToken) {
            console.log(`✅ Token verification successful for ${authPlatform}`);
          } else {
            console.error(`❌ Token verification failed for ${authPlatform}`);
          }
        } catch (e) {
          console.error(`❌ Error parsing token from URL for ${authPlatform}:`, e);
          console.error("Token param content:", tokenParam.substring(0, 200) + "...");
        }
      } else {
        console.warn(`⚠️ No token param in URL for ${authPlatform}`);
      }
      
      // Debug: Log all available cookies
      console.log("All available cookies:", document.cookie);
      
      // Also try to sync cookie to localStorage for this platform (as backup)
      const cookieToken = getTokenFromCookie(authPlatform);
      if (cookieToken) {
        console.log(`Token successfully synced from cookie for ${authPlatform}`);
      } else {
        console.warn(`No token found in cookie for ${authPlatform}`);
        // Debug: Check if cookie exists with different name
        const allCookies = document.cookie.split('; ');
        const spotifyRelatedCookies = allCookies.filter(cookie => 
          cookie.toLowerCase().includes('spotify') || 
          cookie.toLowerCase().includes('token')
        );
        console.log("Spotify/token related cookies found:", spotifyRelatedCookies);
      }
      
      // Reload tokens to update UI
      loadStoredTokens();
      
      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Remove query params from URL (including token param) after a short delay
      setTimeout(() => {
      window.history.replaceState({}, '', '/transfer');
      }, 100);
    } else if (authError && authPlatform) {
      // OAuth error - but in demo mode, we can simulate success
      const hasRealCredentials = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
                                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'YOUR_CLIENT_ID';
      
      if (!hasRealCredentials && authPlatform === 'youtube') {
        // Demo mode - simulate successful authentication
        console.log('Demo mode: Simulating successful YouTube authentication');
        storeToken(authPlatform, {
          accessToken: 'demo_token_' + Date.now(),
          platform: authPlatform,
          expiresAt: Date.now() + 3600000 // 1 hour from now
        });
        console.log(`✅ Demo: Connected to ${platformNames[authPlatform]} successfully!`);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Real OAuth error
        setError(`Authentication failed for ${platformNames[authPlatform]}. Please try again.`);
      }
      setIsLoading(false);
      // Remove query params from URL
      window.history.replaceState({}, '', '/transfer');
    } else {
      // Normal page load
      loadStoredTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transfer initiated", { sourcePlatform, destinationPlatform, playlistUrl });
    setError("");
    setSuccess(false);

    if (!sourcePlatform) {
      setError("Please select a source platform");
      return;
    }

    if (!destinationPlatform) {
      setError("Please select a destination platform");
      return;
    }

    if (sourcePlatform === destinationPlatform) {
      setError("Source and destination platforms must be different");
      return;
    }

    // Validate playlist URL based on platform
    const urlPatterns = {
      youtube: /^https?:\/\/(www\.)?youtube\.com\/(watch|playlist).*[?&]list=[a-zA-Z0-9_-]+/, // Supports regular and Mix playlists
      spotify: /^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/,
      apple: /^https?:\/\/music\.apple\.com\/.+\/playlist\/[a-zA-Z0-9.]+/,
      amazon: /^https?:\/\/music\.amazon\.com\/playlists\/[a-zA-Z0-9-_]+/,
    };

    console.log("Testing URL validation for:", sourcePlatform);
    console.log("URL:", playlistUrl);
    
    const testResult = urlPatterns[sourcePlatform].test(playlistUrl);
    console.log("Test result:", testResult);
    
    const isUrlValid = testResult;
    
    if (!isUrlValid) {
      setError(`Please enter a valid ${platformNames[sourcePlatform]} playlist URL. Example: https://www.youtube.com/playlist?list=PL...`);
      console.log("URL validation failed", { platform: sourcePlatform, url: playlistUrl });
      return;
    }
    
    console.log("URL validation passed, setting isProcessing to true");

    // Check if both platforms are authenticated
    if (!authenticatedPlatforms.has(sourcePlatform) || !authenticatedPlatforms.has(destinationPlatform)) {
      console.log("Platforms not authenticated, showing auth screen");
      setShowAuth(true);
      return;
    }

    setIsProcessing(true);
    setProgress({ step: "Starting transfer...", current: 0, total: 1 });
    setError("");
    setSuccess(false);
    setPlaylistPreview(null);
    // Keep previous matchResults visible until new ones are ready
    // setMatchResults(null);
    setCreatedPlaylist(null);
    setUserSelections(new Map());
    setShowSelectionModal(false);
    setCurrentSelectionIndex(null);

    try {
      // Step 1: Fetch playlist from source platform
      console.log("Step 1: Fetching playlist...");
      setProgress({ step: `Fetching ${platformNames[sourcePlatform]} playlist...`, current: 0, total: 1 });
      
      let playlist: PlaylistInfo;
      
      try {
        playlist = await fetchPlaylist(
          sourcePlatform,
          playlistUrl,
          (progress) => setProgress(progress)
        );
      } catch (fetchError) {
        console.log("Real API failed, using demo playlist:", fetchError);
        // Use demo playlist as fallback
        playlist = createDemoPlaylist(playlistUrl, sourcePlatform);
        console.log("🎵 Using demo playlist for testing");
      }

      console.log(`Fetched playlist: ${playlist.name} with ${playlist.trackCount} tracks`);
      setPlaylistPreview(playlist);

      // Step 2: Match tracks to destination platform
      console.log("Step 2: Matching tracks...");
      const destinationToken = getToken(destinationPlatform);
      if (!destinationToken) {
        throw new Error(`Not authenticated with ${platformNames[destinationPlatform]}`);
      }

      const matches = await matchTracks(
        playlist.tracks,
        destinationPlatform,
        destinationToken.accessToken,
        (progress) => setProgress({
          step: `Matching tracks... (${progress.matched}/${progress.total} matched)`,
          current: progress.current,
          total: progress.total,
          matched: progress.matched,
        })
      );

      console.log(`Matched ${matches.filter(m => m.matchedTrack).length} out of ${matches.length} tracks`);
      // Set match results immediately and ensure they persist
      setMatchResults([...matches]); // Create a new array to ensure React detects the change
      console.log("Match results set, count:", matches.length);

      // Step 3: Check for tracks with multiple candidates that need user selection
      // Only show selection modal if there are multiple high-confidence matches with same title
      // For now, skip the selection modal and proceed directly - we can enable it later if needed
      const tracksNeedingSelection: Array<{ match: MatchResult; index: number }> = [];
      
      // Uncomment below to enable selection modal for tracks with multiple matches
      /*
      const tracksNeedingSelection = matches
        .map((match, index) => ({ match, index }))
        .filter(({ match }) => {
          // Only show selection if:
          // 1. Has multiple candidates with the same/similar title (different sources/movies)
          // 2. At least 2 candidates have high title similarity (>70%)
          if (!match.allCandidates || match.allCandidates.length < 2) {
            return false;
          }

          const sourceTitleNormalized = normalizeText(match.sourceTrack.title);
          const candidatesWithSameTitle = match.allCandidates.filter(candidate => {
            const candidateTitleNormalized = normalizeText(candidate.title);
            const titleSim = similarity(sourceTitleNormalized, candidateTitleNormalized);
            return titleSim > 0.7; // High similarity
          });

          // Only show if there are 2+ candidates with same title (likely different sources)
          return candidatesWithSameTitle.length >= 2;
        });
      */

      // If there are tracks needing selection, show modal for each
      if (tracksNeedingSelection.length > 0) {
        console.log(`Found ${tracksNeedingSelection.length} tracks needing user selection`);
        setIsProcessing(false);
        setCurrentSelectionIndex(0);
        setShowSelectionModal(true);
        // Don't proceed to playlist creation yet - wait for user selections
        return;
      }

      console.log("Proceeding with automatic matching");

      // Step 3: Check for medium/low confidence matches that need user review
      const mediumLowMatches = matches.filter(m => 
        (m.confidence === "medium" || m.confidence === "low") && m.matchedTrack
      );
      const unmatchedWithSuggestions = matches.filter(m => 
        !m.matchedTrack && m.suggestions && m.suggestions.length > 0
      );

      // Always show confirmation modal before creating playlist (especially for Spotify)
      setIsProcessing(false);
      // Use matchResults (which includes user replacements) instead of original matches
      const currentMatches = matchResults || matches;
      setPendingPlaylistCreation({ matches: currentMatches, playlist });
      setShowConfirmationModal(true);

    } catch (err) {
      console.error("Transfer error:", err);
      setIsProcessing(false);
      setProgress(null);
      setError(err instanceof Error ? err.message : "An error occurred during transfer. Please try again.");
    }
  };

  const handlePlatformConnect = (platform: Platform) => {
    if (!platform) return;
    setAuthenticatedPlatforms(prev => new Set([...prev, platform]));
    console.log(`${platformNames[platform]} authenticated`);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const proceedWithPlaylistCreation = async (matches: MatchResult[], playlist: PlaylistInfo) => {
    if (!sourcePlatform || !destinationPlatform) return;

    console.log("🎵 Starting playlist creation with matches:", matches.length);
    console.log("🔄 User selections:", userSelections.size);
    
    if (userSelections.size > 0) {
      console.log("📝 Active user selections:");
      Array.from(userSelections.entries()).forEach(([index, track]) => {
        console.log(`  Index ${index}: ${track.title} by ${track.artist}`);
      });
    }
    
    setIsProcessing(true);
    setProgress({ step: `Creating ${platformNames[destinationPlatform]} playlist...`, current: 0, total: 1 });
    setShowConfirmationModal(false);
    setPendingPlaylistCreation(null);

    try {
      // The matches parameter already contains all user selections from matchResults
      // No need to apply userSelections again as it's already included
      console.log("🎯 Creating playlist with matches:", matches.map(m => ({
        source: m.sourceTrack.title,
        matched: m.matchedTrack?.title || 'NO MATCH',
        matchedTrack: m.matchedTrack, // Show the actual object
        confidence: m.confidence,
        reason: m.matchReason
      })));
      
      // Check for problematic matches
      const nullMatches = matches.filter(m => m.matchedTrack === null);
      const undefinedMatches = matches.filter(m => m.matchedTrack === undefined);
      const emptyMatches = matches.filter(m => !m.matchedTrack);
      
      console.log(`📊 Match analysis: ${matches.length} total, ${nullMatches.length} null, ${undefinedMatches.length} undefined, ${emptyMatches.length} empty`);
      
      if (emptyMatches.length > 0) {
        console.log("❌ Empty matches that should be filtered:", emptyMatches.map(m => m.sourceTrack.title));
      }

      const matchedCount = matches.filter(m => m.matchedTrack).length;
      if (matchedCount === 0) {
        throw new Error("No tracks could be matched. Please try a different playlist.");
      }

      const created = await createPlaylist(
        destinationPlatform,
        playlist.name,
        playlist.description,
        matches,
        (progress) => setProgress(progress)
      );

      console.log(`Created playlist: ${created.name} at ${created.url}`);
      setCreatedPlaylist(created);
      setSuccess(true);
      setIsProcessing(false);
      setProgress(null);

      // Clear form after successful transfer
      setTimeout(() => {
        setSourcePlatform("");
        setDestinationPlatform("");
        setPlaylistUrl("");
        setPlaylistPreview(null);
        setUserSelections(new Map());
      }, 10000);
    } catch (err) {
      console.error("Transfer error:", err);
      setIsProcessing(false);
      setProgress(null);
      setError(err instanceof Error ? err.message : "An error occurred during transfer. Please try again.");
    }
  };

  const handleContinueAfterSelection = async () => {
    if (!matchResults || !sourcePlatform || !destinationPlatform) return;

    setIsProcessing(true);
    setProgress({ step: `Creating ${platformNames[destinationPlatform]} playlist...`, current: 0, total: 1 });

    try {
      // Apply user selections to matches
      const finalMatches = matchResults.map((match, index) => {
        const selected = userSelections.get(index);
        if (selected) {
          return {
            ...match,
            matchedTrack: selected,
            confidence: "high" as const,
            matchReason: "User selected",
          };
        }
        return match;
      });

      const matchedCount = finalMatches.filter(m => m.matchedTrack).length;
      if (matchedCount === 0) {
        throw new Error("No tracks could be matched. Please try a different playlist.");
      }

      const playlist = playlistPreview;
      if (!playlist) {
        throw new Error("Playlist information not found");
      }

      const created = await createPlaylist(
        destinationPlatform,
        playlist.name,
        playlist.description,
        finalMatches,
        (progress) => setProgress(progress)
      );

      console.log(`Created playlist: ${created.name} at ${created.url}`);
      setCreatedPlaylist(created);
      setSuccess(true);
      setIsProcessing(false);
      setProgress(null);

      // Clear form after successful transfer (but keep match results visible)
      setTimeout(() => {
        setSourcePlatform("");
        setDestinationPlatform("");
        setPlaylistUrl("");
        setPlaylistPreview(null);
        // Don't clear matchResults - let user see them
        // setMatchResults(null);
        setUserSelections(new Map());
      }, 10000); // Increased timeout to 10 seconds
    } catch (err) {
      console.error("Transfer error:", err);
      setIsProcessing(false);
      setProgress(null);
      setError(err instanceof Error ? err.message : "An error occurred during transfer. Please try again.");
    }
  };

  const platformOptions = [
    { id: "youtube", name: "YouTube", component: YouTubeLogo, gradient: "from-red-500 to-red-600", color: "#FF0000", available: true },
    { id: "spotify", name: "Spotify", component: SpotifyLogo, gradient: "from-green-500 to-emerald-600", color: "#1DB954", available: true },
    { id: "apple", name: "Apple Music", component: AppleMusicLogo, gradient: "from-pink-500 to-rose-600", color: "#FA243C", available: true },
    { id: "amazon", name: "Amazon Music", component: AmazonMusicLogo, gradient: "from-blue-500 to-cyan-600", color: "#146EB4", available: false, comingSoon: true },
  ];

  const getPlaceholderUrl = (platform: Platform) => {
    const placeholders = {
      youtube: "https://www.youtube.com/playlist?list=... or Mix playlist",
      spotify: "https://open.spotify.com/playlist/...",
      apple: "https://music.apple.com/us/playlist/...",
      amazon: "https://music.amazon.com/playlists/...",
    };
    return platform ? placeholders[platform] : "Select a source platform first";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-300/40 via-pink-300/40 to-purple-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-gradient-to-br from-pink-300/40 via-cyan-300/40 to-orange-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-300/30 via-cyan-300/30 to-pink-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>


      {/* Main Content */}
      <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {isLoading ? (
          <div className="max-w-7xl mx-auto text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your saved connections...</p>
          </div>
        ) : (
        <div className="max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className={`flex items-center gap-2 lg:gap-3 ${sourcePlatform ? "text-cyan-500" : "text-gray-400"}`}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-sm lg:text-base ${sourcePlatform ? "bg-cyan-400 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"}`}>
                  {sourcePlatform ? "✓" : "1"}
                </div>
                <span className="font-semibold text-sm lg:text-base">Source</span>
              </div>
              <div className={`flex-1 h-1 lg:h-1.5 mx-2 lg:mx-4 ${sourcePlatform ? "bg-cyan-400" : "bg-gray-200 dark:bg-gray-800"}`} />
              <div className={`flex items-center gap-2 lg:gap-3 ${destinationPlatform ? "text-purple-500" : "text-gray-400"}`}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-sm lg:text-base ${destinationPlatform ? "bg-purple-500 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"}`}>
                  {destinationPlatform ? "✓" : "2"}
                </div>
                <span className="font-semibold text-sm lg:text-base">Destination</span>
              </div>
              <div className={`flex-1 h-1 lg:h-1.5 mx-2 lg:mx-4 ${success ? "bg-green-600" : "bg-gray-200 dark:bg-gray-800"}`} />
              <div className={`flex items-center gap-2 lg:gap-3 ${success ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-sm lg:text-base ${success ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"}`}>
                  {success ? "✓" : "3"}
                </div>
                <span className="font-semibold text-sm lg:text-base">Complete</span>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12">
            <div className="mb-8 lg:mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Transfer Your Playlist
            </h2>
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">
              Select your source and destination platforms to begin
            </p>
            </div>

            <form onSubmit={handleTransfer} className="space-y-6 lg:space-y-10">
              {/* Source Platform Selection */}
              <div>
                <label className="block text-sm lg:text-base font-bold mb-4 lg:mb-6 text-gray-700 dark:text-gray-300">
                  Step 1: Select Source Platform
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                  {platformOptions.map((platform) => {
                    const LogoComponent = platform.component;
                    return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        if (!platform.available) return;
                        setSourcePlatform(platform.id as Platform);
                        setPlaylistUrl("");
                        if (destinationPlatform === platform.id) {
                          setDestinationPlatform("");
                        }
                      }}
                      disabled={isProcessing || !platform.available}
                        className={`group relative p-4 sm:p-6 lg:p-8 rounded-2xl border-2 transition-all duration-300 ${
                          !platform.available 
                            ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                            : `transform hover:scale-105 hover:-translate-y-1 ${
                              sourcePlatform === platform.id
                                ? `bg-gradient-to-br ${platform.gradient} border-transparent shadow-2xl text-white`
                                : "bg-white/60 dark:bg-gray-800/60 border-gray-300/50 dark:border-gray-700/50 hover:border-purple-500/50 text-gray-700 dark:text-gray-300"
                            }`
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        <div className={`mb-3 transition-transform duration-300 flex items-center justify-center ${sourcePlatform === platform.id ? "scale-110" : "group-hover:scale-110"}`}>
                          <LogoComponent />
                        </div>
                        <div className={`font-bold text-sm ${sourcePlatform === platform.id ? "text-white" : ""}`}>
                          {platform.name}
                        </div>
                        {platform.comingSoon && (
                          <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full border border-orange-200 dark:border-orange-800">
                            Coming Soon
                          </div>
                        )}
                        {sourcePlatform === platform.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Playlist URL Input */}
              <div>
                <label htmlFor="playlist-url" className="block text-sm lg:text-base font-bold mb-3 lg:mb-4 text-gray-700 dark:text-gray-300">
                  {sourcePlatform ? `${platformNames[sourcePlatform]} ` : ""}Playlist URL
                </label>
                <div className="relative">
                <input
                  type="text"
                  id="playlist-url"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder={getPlaceholderUrl(sourcePlatform)}
                    className="w-full px-6 lg:px-8 py-4 lg:py-5 text-base lg:text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-gray-900 dark:text-gray-100"
                  disabled={isProcessing || !sourcePlatform}
                />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-2xl">🔗</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className={`w-1 h-20 bg-gradient-to-b ${sourcePlatform ? "from-cyan-400 to-purple-500" : "from-gray-300 to-gray-300"}`} />
              </div>

              {/* Destination Platform Selection */}
              <div>
                <label className="block text-sm lg:text-base font-bold mb-4 lg:mb-6 text-gray-700 dark:text-gray-300">
                  Step 2: Select Destination Platform
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                  {platformOptions.map((platform) => {
                    const LogoComponent = platform.component;
                    return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        if (!platform.available) return;
                        setDestinationPlatform(platform.id as Platform);
                      }}
                        disabled={isProcessing || sourcePlatform === platform.id || !sourcePlatform || !platform.available}
                        className={`group relative p-4 sm:p-6 lg:p-8 rounded-2xl border-2 transition-all duration-300 ${
                          !platform.available
                            ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                            : `transform hover:scale-105 hover:-translate-y-1 ${
                              destinationPlatform === platform.id
                                ? `bg-gradient-to-br ${platform.gradient} border-transparent shadow-2xl text-white`
                                : sourcePlatform === platform.id
                                ? "bg-gray-100 dark:bg-gray-900 border-gray-400 dark:border-gray-600 opacity-40 cursor-not-allowed text-gray-400"
                                : !sourcePlatform
                                ? "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed text-gray-400"
                                : "bg-white/60 dark:bg-gray-800/60 border-gray-300/50 dark:border-gray-700/50 hover:border-purple-500/50 text-gray-700 dark:text-gray-300"
                            }`
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        <div className={`mb-3 transition-transform duration-300 flex items-center justify-center ${destinationPlatform === platform.id ? "scale-110" : "group-hover:scale-110"}`}>
                          <LogoComponent />
                        </div>
                        <div className={`font-bold text-sm ${destinationPlatform === platform.id ? "text-white" : ""}`}>
                          {platform.name}
                        </div>
                        {platform.comingSoon && (
                          <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full border border-orange-200 dark:border-orange-800">
                            Coming Soon
                          </div>
                        )}
                        {destinationPlatform === platform.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="backdrop-blur-xl bg-red-50/90 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold mb-1">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {progress && isProcessing && (
                <div className="mb-6 p-6 lg:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-spin">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base lg:text-lg text-gray-900 dark:text-gray-100 mb-1 lg:mb-2">{progress.step}</p>
                      {progress.total > 1 && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 lg:h-3 mt-2 lg:mt-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 lg:h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                          />
                        </div>
                      )}
                      {progress.matched !== undefined && (
                        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1 lg:mt-2">
                          {progress.matched} of {progress.total} tracks matched
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && createdPlaylist && (
                <div className="mb-6 p-6 lg:p-8 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-start gap-4 lg:gap-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg lg:text-xl text-gray-900 dark:text-gray-100 mb-2 lg:mb-3">Playlist Transferred Successfully! 🎉</p>
                      <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-3 lg:mb-4">
                        Your playlist &quot;{createdPlaylist.name}&quot; has been created on {destinationPlatform ? platformNames[destinationPlatform] : 'destination platform'} with {createdPlaylist.trackCount} tracks.
                      </p>
                      <a
                        href={createdPlaylist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 lg:px-6 py-2.5 lg:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm lg:text-base font-semibold"
                      >
                        Open Playlist
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Results Preview - Only show when confirmation modal is NOT open */}
              {matchResults && matchResults.length > 0 && !showSelectionModal && !showConfirmationModal && (
                <div className="mb-6 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <p className="font-bold text-lg lg:text-xl text-gray-900 dark:text-gray-100">Match Results</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        ✓ {matchResults.filter(m => m.confidence === "high").length}
                      </span>
                      <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        ~ {matchResults.filter(m => m.confidence === "medium").length}
                      </span>
                      <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                        ? {matchResults.filter(m => m.confidence === "low").length}
                      </span>
                      <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        ✗ {matchResults.filter(m => !m.matchedTrack).length}
                      </span>
                    </div>
                  </div>

                  {matchResults && (
                    <MatchResultsSections 
                      matchResults={matchResults}
                      sourcePlatform={sourcePlatform || ""}
                      destinationPlatform={destinationPlatform || ""}
                    getToken={(platform: string) => {
                      if (!platform || platform === "") return null;
                      const platformTyped = platform as Platform;
                      if (platformTyped === "") return null;
                      const token = getToken(platformTyped);
                      return token ? { accessToken: token.accessToken } : null;
                    }}
                      AudioPreview={AudioPreview as any}
                      similarity={similarity}
                      normalizeText={normalizeText}
                      onTrackReplaced={(originalTrack, newTrack) => {
                        console.log(`🔄 Track replaced: ${originalTrack.title} -> ${newTrack.title}`);
                        
                        // Find the correct original index in the full matchResults array
                        const originalIndex = matchResults?.findIndex(m => m.sourceTrack.id === originalTrack.id) ?? -1;
                        
                        if (originalIndex === -1) {
                          console.error(`❌ Could not find original track ${originalTrack.title} in matchResults`);
                          return;
                        }
                        
                        console.log(`📝 Found original track at index ${originalIndex}, updating userSelections`);
                        
                        // Update userSelections with the correct index
                        setUserSelections(prevSelections => {
                          const newSelections = new Map(prevSelections);
                          newSelections.set(originalIndex, newTrack);
                          console.log(`✅ Updated userSelections for index ${originalIndex}:`, newTrack.title);
                          console.log(`🗺️ Current userSelections:`, Array.from(newSelections.entries()).map(([idx, track]) => `${idx}: ${track.title}`));
                          return newSelections;
                        });
                        
                        // Update the match results with the new track (for UI display)
                        setMatchResults(prev => 
                          prev ? prev.map((match, index) => {
                            if (match.sourceTrack.id === originalTrack.id) {
                              return { ...match, matchedTrack: newTrack, confidence: 'high' as const, matchReason: 'User selected' };
                            }
                            return match;
                          }) : null
                        );
                      }}
                    />
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || !sourcePlatform || !destinationPlatform || !playlistUrl}
                className="w-full group relative px-8 lg:px-12 py-5 lg:py-6 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 hover:from-cyan-500 hover:via-pink-500 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl shadow-pink-400/60 hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg lg:text-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Start Transfer</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Confirmation Modal - Show before creating playlist - Positioned at top */}
            {showConfirmationModal && pendingPlaylistCreation && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white dark:bg-gray-900 rounded-b-3xl shadow-2xl max-w-7xl w-full mx-auto p-6 sm:p-8 lg:p-12 min-h-screen">
                  <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 py-4 z-10 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                      Review Matches Before Creating Playlist
                    </h3>
                    <button
                      onClick={() => {
                        setShowConfirmationModal(false);
                        setPendingPlaylistCreation(null);
                        setIsProcessing(false);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl lg:text-3xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100 mb-2">
                      Playlist: {pendingPlaylistCreation.playlist.name}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                      {pendingPlaylistCreation.playlist.trackCount} tracks total
                    </p>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">High Confidence</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {pendingPlaylistCreation.matches.filter(m => m.confidence === "high" && m.matchedTrack).length}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Medium Confidence</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                          {pendingPlaylistCreation.matches.filter(m => m.confidence === "medium" && m.matchedTrack).length}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Low Confidence</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                          {pendingPlaylistCreation.matches.filter(m => m.confidence === "low" && m.matchedTrack).length}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">No Match</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                          {pendingPlaylistCreation.matches.filter(m => !m.matchedTrack).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {destinationPlatform === "spotify" && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
                      <p className="font-semibold text-sm lg:text-base text-yellow-800 dark:text-yellow-300 mb-2">
                        ⚠️ Spotify Playlist Creation
                      </p>
                      <p className="text-xs lg:text-sm text-yellow-700 dark:text-yellow-400">
                        This will create a new playlist on your Spotify account with {pendingPlaylistCreation.matches.filter(m => m.matchedTrack).length} tracks. 
                        Please review the matches below before proceeding.
                      </p>
                    </div>
                  )}

                  {/* Match Results with Preview - Inside Modal */}
                  <div className="mb-6 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between mb-6">
                      <p className="font-bold text-lg lg:text-xl text-gray-900 dark:text-gray-100">Match Results & Previews</p>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          ✓ {pendingPlaylistCreation.matches.filter(m => m.confidence === "high" && m.matchedTrack).length}
                        </span>
                        <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          ~ {pendingPlaylistCreation.matches.filter(m => m.confidence === "medium" && m.matchedTrack).length}
                        </span>
                        <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          ? {pendingPlaylistCreation.matches.filter(m => m.confidence === "low" && m.matchedTrack).length}
                        </span>
                        <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          ✗ {pendingPlaylistCreation.matches.filter(m => !m.matchedTrack).length}
                        </span>
                      </div>
                    </div>

                    <MatchResultsSections 
                      matchResults={matchResults || pendingPlaylistCreation.matches}
                      sourcePlatform={sourcePlatform || ""}
                      destinationPlatform={destinationPlatform || ""}
                      getToken={(platform: string) => {
                        if (!platform || platform === "") return null;
                        const platformTyped = platform as Platform;
                        if (platformTyped === "") return null;
                        const token = getToken(platformTyped);
                        return token ? { accessToken: token.accessToken } : null;
                      }}
                      AudioPreview={AudioPreview as any}
                      similarity={similarity}
                      normalizeText={normalizeText}
                    />
                  </div>

                  <div className="flex justify-end gap-4 sticky bottom-0 bg-white dark:bg-gray-900 py-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <button
                      onClick={() => {
                        setShowConfirmationModal(false);
                        setPendingPlaylistCreation(null);
                        setIsProcessing(false);
                      }}
                      className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (destinationPlatform) {
                          // ALWAYS use current matchResults (includes all user replacements)
                          // Never use the stored pendingPlaylistCreation.matches as it's stale
                          if (!matchResults) {
                            console.error("❌ No matchResults available for playlist creation");
                            return;
                          }
                          console.log("🎯 Using current matchResults for playlist creation:", matchResults.length);
                          proceedWithPlaylistCreation(matchResults, pendingPlaylistCreation.playlist);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      Create Playlist on {destinationPlatform ? platformNames[destinationPlatform as Exclude<Platform, "">] : "Platform"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Authentication Modal */}
            {showAuth && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 lg:p-12">
                  <div className="flex justify-between items-center mb-6 lg:mb-8">
                    <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                      🔐 Connect Your Accounts
                    </h3>
                    <button
                      onClick={handleCloseAuth}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl lg:text-3xl"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-6 lg:mb-8">
                    Please connect your accounts to continue with the transfer.
                  </p>
                  <div className="space-y-4">
                    {sourcePlatform && (
                      <OAuthButton
                        platform={sourcePlatform}
                        platformName={platformNames[sourcePlatform]}
                        logo={React.createElement(platformOptions.find(p => p.id === sourcePlatform)?.component || YouTubeLogo)}
                        isConnected={authenticatedPlatforms.has(sourcePlatform)}
                        onConnect={() => handlePlatformConnect(sourcePlatform)}
                      />
                    )}
                    {destinationPlatform && (
                      <OAuthButton
                        platform={destinationPlatform}
                        platformName={platformNames[destinationPlatform]}
                        logo={React.createElement(platformOptions.find(p => p.id === destinationPlatform)?.component || SpotifyLogo)}
                        isConnected={authenticatedPlatforms.has(destinationPlatform)}
                        onConnect={() => handlePlatformConnect(destinationPlatform)}
                      />
                    )}
                  </div>
                  {authenticatedPlatforms.has(sourcePlatform) && authenticatedPlatforms.has(destinationPlatform) && (
                    <button
                      onClick={() => {
                        setShowAuth(false);
                        // Retry the transfer
                        const event = new Event('submit', { bubbles: true, cancelable: true });
                        document.querySelector('form')?.dispatchEvent(event);
                      }}
                      className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 text-white font-bold rounded-xl hover:from-cyan-500 hover:via-pink-500 hover:to-purple-600 transition-all"
                    >
                      Continue Transfer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Info Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">How it works:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "AI-powered track matching ensures accuracy",
                  "Secure OAuth authentication for all platforms",
                  "Real-time progress tracking",
                  "Automatic duplicate detection and handling",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="font-bold">✓ Supported:</span> YouTube regular playlists, Mix playlists (automatic), and watch playlists are all supported.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-800">
                  <span className="font-bold">Note:</span> Full functionality requires API credentials. This demo showcases the interface design.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

    </div>
  );
}
