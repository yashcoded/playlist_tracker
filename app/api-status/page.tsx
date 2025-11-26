import { getPlatformStatus } from '../config/apiConfig';
import Link from 'next/link';

export default function ApiStatusPage() {
  const status = getPlatformStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-cyan-500 via-pink-500 to-purple-600 dark:from-white dark:via-cyan-200 dark:via-pink-200 dark:to-purple-200 bg-clip-text text-transparent mb-4">
              API Status Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Check which music platform APIs are configured and working
            </p>
          </div>

          <div className="grid gap-6">
            {Object.entries(status).map(([platform, info]) => (
              <div
                key={platform}
                className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      info.configured 
                        ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                        : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                    }`} />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                      {platform.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    info.configured
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {info.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Status:</strong> {info.configured ? 'Real API configured' : 'Using mock implementation'}
                  </p>
                  
                  {!info.validation.valid && info.validation.missing.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        <strong>Missing environment variables:</strong>
                      </p>
                      <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                        {info.validation.missing.map((variable) => (
                          <li key={variable}>{variable}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {info.configured && info.validation.valid && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-green-800 dark:text-green-200 text-sm">
                        ✅ All required credentials are configured
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 backdrop-blur-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
              🚀 Getting Started
            </h3>
            <div className="space-y-3 text-blue-800 dark:text-blue-200">
              <p>
                <strong>No API keys?</strong> No problem! The app works perfectly with mock APIs for testing and development.
              </p>
              <p>
                <strong>Want real integration?</strong> Check out these setup guides:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Apple Music:</strong> See <code>APPLE_MUSIC_API_SETUP.md</code> for detailed instructions</li>
                <li><strong>Spotify:</strong> Visit <a href="https://developer.spotify.com/dashboard" className="underline" target="_blank" rel="noopener noreferrer">Spotify Developer Dashboard</a></li>
                <li><strong>YouTube:</strong> Visit <a href="https://console.developers.google.com/" className="underline" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                <li><strong>Amazon Music:</strong> API not publicly available (mock only)</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 hover:from-cyan-500 hover:via-pink-500 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
