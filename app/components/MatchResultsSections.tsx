"use client";

import { useState } from "react";
import { MatchResult } from "../../lib/track-matcher";
import { Track } from "../../lib/playlist-fetcher";
import AudioPreview from "./AudioPreview";
import PlatformSearchChatbot from "./PlatformSearchChatbot";

type Platform = "youtube" | "spotify" | "apple" | "amazon";

interface MatchResultsSectionsProps {
  matchResults: MatchResult[];
  sourcePlatform: string;
  destinationPlatform: string;
  getToken: (platform: string) => { accessToken: string } | null;
  AudioPreview: React.ComponentType<{ track: Track; platform: Platform; accessToken?: string }>;
  similarity: (str1: string, str2: string) => number;
  normalizeText: (text: string) => string;
  onTrackReplaced?: (originalTrack: Track, newTrack: Track) => void;
}

export default function MatchResultsSections({
  matchResults,
  sourcePlatform,
  destinationPlatform,
  getToken,
  AudioPreview,
  similarity,
  normalizeText,
  onTrackReplaced,
}: MatchResultsSectionsProps) {
  // Prioritize medium/low matches and unmatched tracks
  const highMatches = matchResults.filter(m => m.confidence === "high" && m.matchedTrack);
  const mediumMatches = matchResults.filter(m => m.confidence === "medium" && m.matchedTrack);
  const lowMatches = matchResults.filter(m => m.confidence === "low" && m.matchedTrack);
  const noMatches = matchResults.filter(m => !m.matchedTrack);
  
  // Filter state - which confidence level to show (null = show all)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchChatbot, setSearchChatbot] = useState<{
    isOpen: boolean;
    originalTrack: Track | null;
  }>({ isOpen: false, originalTrack: null });
  const [selectedTracks, setSelectedTracks] = useState<Map<string, Track>>(new Map());

  const handleFilterClick = (section: string) => {
    // If clicking the same section, toggle it off (show all)
    // If clicking a different section, show only that section
    setSelectedFilter(prev => prev === section ? null : section);
  };

  const handleTrackReplaced = (originalTrack: Track, newTrack: Track) => {
    // Update the selected tracks map to highlight the replacement
    setSelectedTracks(prev => {
      const newMap = new Map(prev);
      newMap.set(originalTrack.id, newTrack);
      return newMap;
    });
    
    if (onTrackReplaced) {
      onTrackReplaced(originalTrack, newTrack);
    }
    setSearchChatbot({ isOpen: false, originalTrack: null });
    
    // Scroll to the original track to show the replacement
    setTimeout(() => {
      const element = document.getElementById(`track-${originalTrack.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const renderMatchCard = (match: MatchResult, index: number) => {
    const replacedTrack = selectedTracks.get(match.sourceTrack.id);
    const displayTrack = replacedTrack || match.matchedTrack;
    const isReplaced = !!replacedTrack;
    
    return (
      <div
        key={index}
        id={`track-${match.sourceTrack.id}`}
        className={`p-4 rounded-lg border transition-all duration-200 ${
          isReplaced
            ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 ring-2 ring-purple-200 dark:ring-purple-800'
            : match.confidence === 'high' 
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
            : match.confidence === 'medium'
            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100 truncate">
                  {match.sourceTrack.title}
                </p>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {match.sourceTrack.artist || "Unknown Artist"}
                </p>
              </div>
            </div>
            {displayTrack && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {displayTrack.title}
                          </p>
                          {/* Status Badge */}
                          {isReplaced ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              🔄 Manually Selected
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              match.confidence === 'high' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : match.confidence === 'medium'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {match.confidence === 'high' ? '✅ Excellent' : 
                               match.confidence === 'medium' ? '👍 Good' : 
                               '⚠️ Possible'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-500 truncate">
                          {displayTrack.artist || "Unknown Artist"}
                        </p>
                        {/* Similarity Score */}
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                          {isReplaced ? 'Manually selected from search' : 
                           `Match: ${Math.round((similarity(
                             normalizeText(`${match.sourceTrack.title} ${match.sourceTrack.artist}`),
                             normalizeText(`${displayTrack.title} ${displayTrack.artist}`)
                           )) * 100)}%`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {destinationPlatform && (
                          <AudioPreview
                            track={displayTrack}
                            platform={destinationPlatform as Platform}
                            accessToken={getToken(destinationPlatform)?.accessToken}
                          />
                        )}
                        <button
                          onClick={() => {
                            console.log(`🎯 Opening search chatbot for destination platform: ${destinationPlatform}`);
                            setSearchChatbot({ 
                              isOpen: true, 
                              originalTrack: match.sourceTrack 
                            });
                          }}
                          className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap flex-shrink-0"
                          title="Search for a different version on the destination platform"
                        >
                          <span className="hidden sm:inline">Not the same?</span>
                          <span className="sm:hidden">🔍</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-500">Source:</span>
                    {sourcePlatform && (
                      <AudioPreview
                        track={match.sourceTrack}
                        platform={sourcePlatform as Platform}
                        accessToken={getToken(sourcePlatform)?.accessToken}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
            {match.matchReason && (
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-500 mt-1 italic">
                {match.matchReason}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Determine which sections to show based on filter
  const shouldShowSection = (section: string) => {
    return selectedFilter === null || selectedFilter === section;
  };

  return (
    <>
      {/* Filter Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter by confidence level:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter(null)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedFilter === null
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Show All
          </button>
          {highMatches.length > 0 && (
            <button
              onClick={() => handleFilterClick("high")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === "high"
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              ✓ High Confidence ({highMatches.length})
            </button>
          )}
          {mediumMatches.length > 0 && (
            <button
              onClick={() => handleFilterClick("medium")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === "medium"
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              }`}
            >
              ~ Medium Confidence ({mediumMatches.length})
            </button>
          )}
          {lowMatches.length > 0 && (
            <button
              onClick={() => handleFilterClick("low")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === "low"
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
              }`}
            >
              ? Low Confidence ({lowMatches.length})
            </button>
          )}
          {noMatches.length > 0 && (
            <button
              onClick={() => handleFilterClick("none")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === "none"
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              }`}
            >
              ✗ No Match ({noMatches.length})
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* High Confidence Matches */}
        {highMatches.length > 0 && shouldShowSection("high") && (
          <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <span className="text-lg">✓</span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  High Confidence ({highMatches.length})
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {highMatches.map((match, index) => renderMatchCard(match, index))}
            </div>
          </div>
        )}

        {/* Medium Confidence Matches */}
        {mediumMatches.length > 0 && shouldShowSection("medium") && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <span className="text-lg">~</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">
                  Medium Confidence ({mediumMatches.length})
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {mediumMatches.map((match, index) => renderMatchCard(match, index))}
            </div>
          </div>
        )}

        {/* Low Confidence Matches */}
        {lowMatches.length > 0 && shouldShowSection("low") && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center gap-3">
                <span className="text-lg">?</span>
                <span className="font-bold text-orange-700 dark:text-orange-400">
                  Low Confidence ({lowMatches.length})
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {lowMatches.map((match, index) => renderMatchCard(match, index))}
            </div>
          </div>
        )}

        {/* No Matches */}
        {noMatches.length > 0 && shouldShowSection("none") && (
          <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <span className="text-lg">✗</span>
                <span className="font-bold text-red-700 dark:text-red-400">
                  No Match ({noMatches.length})
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {noMatches.map((match, index) => {
                const replacedTrack = selectedTracks.get(match.sourceTrack.id);
                const isReplaced = !!replacedTrack;
                
                return (
                  <div 
                    key={index} 
                    id={`track-${match.sourceTrack.id}`}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isReplaced
                        ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-200 dark:ring-purple-800'
                        : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="mb-3">
                      <p className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100">
                        {match.sourceTrack.title}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                        by {match.sourceTrack.artist || "Unknown Artist"}
                      </p>
                    </div>
                    
                    {/* Show replaced track if available */}
                    {isReplaced && replacedTrack && (
                      <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Manually Selected:</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {replacedTrack.title}
                              </p>
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex-shrink-0">
                                🔄 Selected
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              by {replacedTrack.artist || "Unknown Artist"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {destinationPlatform && (
                              <AudioPreview
                                track={replacedTrack}
                                platform={destinationPlatform as Platform}
                                accessToken={getToken(destinationPlatform)?.accessToken}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs lg:text-sm font-medium ${
                        isReplaced 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isReplaced ? 'Match found manually' : 'No automatic match found'}
                      </p>
                      <div className="flex items-center gap-2">
                        {!isReplaced && sourcePlatform && (
                          <AudioPreview
                            track={match.sourceTrack}
                            platform={sourcePlatform as Platform}
                            accessToken={getToken(sourcePlatform)?.accessToken}
                          />
                        )}
                        <button
                          onClick={() => {
                            setSearchChatbot({ 
                              isOpen: true, 
                              originalTrack: match.sourceTrack 
                            });
                          }}
                          className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
                          title={isReplaced ? "Search for a different match" : "Search manually on the destination platform"}
                        >
                          <span className="hidden sm:inline">
                            {isReplaced ? '🔍 Change Selection' : '🔍 Search Manually'}
                          </span>
                          <span className="sm:hidden">🔍</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Search Chatbot */}
      {searchChatbot.originalTrack && (
        <PlatformSearchChatbot
          isOpen={searchChatbot.isOpen}
          onClose={() => setSearchChatbot({ isOpen: false, originalTrack: null })}
          originalTrack={searchChatbot.originalTrack}
          platform={destinationPlatform as Platform}
          accessToken={getToken(destinationPlatform)?.accessToken}
          onTrackSelected={(newTrack) => handleTrackReplaced(searchChatbot.originalTrack!, newTrack)}
        />
      )}
    </>
  );
}