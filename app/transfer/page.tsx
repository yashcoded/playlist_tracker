"use client";

import { useState } from "react";
import Link from "next/link";

type Platform = "youtube" | "spotify" | "apple" | "amazon" | "";

export default function TransferPage() {
  const [sourcePlatform, setSourcePlatform] = useState<Platform>("");
  const [destinationPlatform, setDestinationPlatform] = useState<Platform>("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const platformNames = {
    youtube: "YouTube",
    spotify: "Spotify",
    apple: "Apple Music",
    amazon: "Amazon Music",
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
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
      youtube: /^https?:\/\/(www\.)?(youtube\.com\/playlist\?|youtu\.be\/)/,
      spotify: /^https?:\/\/open\.spotify\.com\/playlist\//,
      apple: /^https?:\/\/music\.apple\.com\/.+\/playlist\//,
      amazon: /^https?:\/\/music\.amazon\.com\/playlists\//,
    };

    if (!urlPatterns[sourcePlatform].test(playlistUrl)) {
      setError(`Please enter a valid ${platformNames[sourcePlatform]} playlist URL`);
      return;
    }

    setIsProcessing(true);

    // Simulate transfer process (in a real app, this would call API endpoints)
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  const platformOptions = [
    { id: "youtube", name: "YouTube", emoji: "🎬", color: "red" },
    { id: "spotify", name: "Spotify", emoji: "🎵", color: "green" },
    { id: "apple", name: "Apple Music", emoji: "🍎", color: "pink" },
    { id: "amazon", name: "Amazon Music", emoji: "🛒", color: "blue" },
  ];

  const getPlaceholderUrl = (platform: Platform) => {
    const placeholders = {
      youtube: "https://www.youtube.com/playlist?list=...",
      spotify: "https://open.spotify.com/playlist/...",
      apple: "https://music.apple.com/us/playlist/...",
      amazon: "https://music.amazon.com/playlists/...",
    };
    return platform ? placeholders[platform] : "Select a source platform first";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-3xl md:text-4xl font-bold">🎵 Playlist Tracker</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Transfer Your Playlist</h2>

            <form onSubmit={handleTransfer} className="space-y-6">
              {/* Source Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Source Platform
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platformOptions.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        setSourcePlatform(platform.id as Platform);
                        setPlaylistUrl("");
                        if (destinationPlatform === platform.id) {
                          setDestinationPlatform("");
                        }
                      }}
                      disabled={isProcessing}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        sourcePlatform === platform.id
                          ? `border-${platform.color}-500 bg-${platform.color}-50 dark:bg-${platform.color}-900/20`
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-3xl mb-2">{platform.emoji}</div>
                      <div className="font-semibold text-sm">{platform.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Playlist URL Input */}
              <div>
                <label htmlFor="playlist-url" className="block text-sm font-medium mb-2">
                  {sourcePlatform ? `${platformNames[sourcePlatform]} ` : ""}Playlist URL
                </label>
                <input
                  type="text"
                  id="playlist-url"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder={getPlaceholderUrl(sourcePlatform)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isProcessing || !sourcePlatform}
                />
              </div>

              {/* Destination Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Destination Platform
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platformOptions.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setDestinationPlatform(platform.id as Platform)}
                      disabled={isProcessing || sourcePlatform === platform.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        destinationPlatform === platform.id
                          ? `border-${platform.color}-500 bg-${platform.color}-50 dark:bg-${platform.color}-900/20`
                          : sourcePlatform === platform.id
                          ? "border-gray-200 dark:border-gray-700 opacity-40 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-3xl mb-2">{platform.emoji}</div>
                      <div className="font-semibold text-sm">{platform.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && sourcePlatform && destinationPlatform && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg p-4">
                  <p className="font-semibold mb-1">🎉 Success!</p>
                  <p className="text-sm">
                    Your playlist has been prepared for transfer from {platformNames[sourcePlatform]} to{" "}
                    {platformNames[destinationPlatform]}. You will be redirected to complete the process.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Start Transfer"}
              </button>
            </form>

            {/* Info Section */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3">How it works:</h3>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>1. Select your source platform (where your playlist currently is)</li>
                <li>2. Enter the playlist URL from the source platform</li>
                <li>3. Select your destination platform (where you want to transfer to)</li>
                <li>4. Authenticate with both platforms</li>
                <li>5. Review and confirm the transfer</li>
                <li>6. Your playlist will be created on the destination platform</li>
              </ol>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                Note: This is a demo interface. Full API integration requires authentication 
                credentials for all supported platforms.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-6 px-4 mt-auto">
        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© 2025 Playlist Tracker. Built with Next.js as a PWA.</p>
        </div>
      </footer>
    </div>
  );
}
