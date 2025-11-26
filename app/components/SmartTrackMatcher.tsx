"use client";

import { useState } from 'react';
import { Track } from '../services/mockAppleMusic';
import AudioPreview from './AudioPreview';

export interface MatchOption {
  track: Track;
  confidence: number;
  matchType: 'exact' | 'good' | 'possible' | 'ai_suggested';
  isSelected?: boolean;
  isRecommended?: boolean;
}

interface SmartTrackMatcherProps {
  originalTrack: Track;
  matchOptions: MatchOption[];
  onTrackSelected: (selectedTrack: Track | null) => void;
  platform: "youtube" | "spotify" | "apple" | "amazon";
  accessToken?: string;
}

export default function SmartTrackMatcher({ 
  originalTrack, 
  matchOptions, 
  onTrackSelected, 
  platform,
  accessToken 
}: SmartTrackMatcherProps) {
  const [selectedOption, setSelectedOption] = useState<MatchOption | null>(
    matchOptions.find(option => option.isSelected) || 
    matchOptions.find(option => option.isRecommended) || 
    null
  );
  const [showAllOptions, setShowAllOptions] = useState(false);

  const handleOptionSelect = (option: MatchOption) => {
    setSelectedOption(option);
    onTrackSelected(option.track);
  };

  const handleSkipTrack = () => {
    setSelectedOption(null);
    onTrackSelected(null);
  };

  const getConfidenceColor = (matchType: string, confidence: number) => {
    if (matchType === 'exact' || confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (matchType === 'good' || confidence >= 0.7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (matchType === 'possible' || confidence >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getConfidenceLabel = (matchType: string, confidence: number) => {
    if (matchType === 'exact' || confidence >= 0.9) return 'Excellent Match';
    if (matchType === 'good' || confidence >= 0.7) return 'Good Match';
    if (matchType === 'possible' || confidence >= 0.4) return 'Possible Match';
    if (matchType === 'ai_suggested') return 'AI Suggested';
    return 'Low Confidence';
  };

  // Show top 3 options by default, with option to show all
  const displayOptions = showAllOptions ? matchOptions : matchOptions.slice(0, 3);
  const hasMoreOptions = matchOptions.length > 3;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Original Track */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Looking for matches for:
        </h4>
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {originalTrack.title}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              by {originalTrack.artist}
            </div>
          </div>
          <AudioPreview 
            track={originalTrack} 
            platform={originalTrack.platform as any} 
            accessToken={accessToken}
          />
        </div>
      </div>

      {/* Match Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Found {matchOptions.length} potential matches:
        </h4>
        
        {displayOptions.map((option, index) => (
          <div
            key={`${option.track.id}-${index}`}
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedOption?.track.id === option.track.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
            onClick={() => handleOptionSelect(option)}
          >
            {/* Confidence Badge */}
            <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full border ${getConfidenceColor(option.matchType, option.confidence)}`}>
              {getConfidenceLabel(option.matchType, option.confidence)}
            </div>

            {/* Recommended Badge */}
            {option.isRecommended && (
              <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                ⭐ Recommended
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              {/* Selection Radio */}
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedOption?.track.id === option.track.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedOption?.track.id === option.track.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.track.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  by {option.track.artist}
                  {option.track.album && ` • ${option.track.album}`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Confidence: {Math.round(option.confidence * 100)}%
                </div>
              </div>

              {/* Preview Button */}
              <AudioPreview 
                track={option.track} 
                platform={platform} 
                accessToken={accessToken}
              />
            </div>
          </div>
        ))}

        {/* Show More Options */}
        {hasMoreOptions && !showAllOptions && (
          <button
            onClick={() => setShowAllOptions(true)}
            className="w-full p-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Show {matchOptions.length - 3} more options
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSkipTrack}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Skip This Track
          </button>
          
          <button
            disabled={!selectedOption}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedOption
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            {selectedOption ? `Use "${selectedOption.track.title}"` : 'Select an Option'}
          </button>
        </div>
      </div>
    </div>
  );
}
