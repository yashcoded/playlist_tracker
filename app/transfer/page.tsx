"use client";

import { useState } from "react";
import Link from "next/link";

type Platform = "spotify" | "apple" | "amazon" | "";

export default function TransferPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate YouTube URL
    if (!youtubeUrl.includes("youtube.com/playlist")) {
      setError("Please enter a valid YouTube playlist URL");
      return;
    }

    if (!platform) {
      setError("Please select a destination platform");
      return;
    }

    setIsProcessing(true);

    // Simulate transfer process (in a real app, this would call API endpoints)
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
    }, 2000);
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
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Transfer Your Playlist</h2>

            <form onSubmit={handleTransfer} className="space-y-6">
              {/* YouTube URL Input */}
              <div>
                <label htmlFor="youtube-url" className="block text-sm font-medium mb-2">
                  YouTube Playlist URL
                </label>
                <input
                  type="text"
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isProcessing}
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Destination Platform
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlatform("spotify")}
                    disabled={isProcessing}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      platform === "spotify"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-green-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-3xl mb-2">🎵</div>
                    <div className="font-semibold">Spotify</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform("apple")}
                    disabled={isProcessing}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      platform === "apple"
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-pink-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-3xl mb-2">🍎</div>
                    <div className="font-semibold">Apple Music</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform("amazon")}
                    disabled={isProcessing}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      platform === "amazon"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-3xl mb-2">🛒</div>
                    <div className="font-semibold">Amazon Music</div>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg p-4">
                  <p className="font-semibold mb-1">🎉 Success!</p>
                  <p className="text-sm">
                    Your playlist has been prepared for transfer. You will be redirected to{" "}
                    {platform === "spotify" && "Spotify"}
                    {platform === "apple" && "Apple Music"}
                    {platform === "amazon" && "Amazon Music"} to complete the process.
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
                <li>1. Enter your YouTube playlist URL</li>
                <li>2. Select your preferred music platform</li>
                <li>3. Authenticate with the chosen platform</li>
                <li>4. Review and confirm the transfer</li>
                <li>5. Your playlist will be created on the selected platform</li>
              </ol>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                Note: This is a demo interface. Full API integration requires authentication 
                credentials for YouTube and your chosen music platform.
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
