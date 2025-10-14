import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">🎵 Playlist Tracker</h1>
          <p className="mt-2 text-sm md:text-base opacity-90">
            Transfer your playlists between YouTube and your favorite music platforms
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">
              Seamlessly Transfer Your Music
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Move your playlists from YouTube to Spotify, Apple Music, Amazon Music, and more with just a few clicks.
            </p>
          </section>

          {/* Platform Selection Cards */}
          <section className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-2xl">
                  🎬
                </div>
                <h3 className="ml-4 text-xl font-semibold">From YouTube</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Import your YouTube playlists by providing the playlist URL
              </p>
              <Link
                href="/transfer"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-2xl">
                  🎵
                </div>
                <h3 className="ml-4 text-xl font-semibold">To Music Platform</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Export to Spotify, Apple Music, Amazon Music, and more
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                  Spotify
                </span>
                <span className="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-xs font-semibold px-3 py-1 rounded-full">
                  Apple Music
                </span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                  Amazon Music
                </span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 md:p-8">
            <h3 className="text-xl font-bold mb-6 text-center">Why Use Playlist Tracker?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold mb-2">Fast Transfer</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quick and efficient playlist migration
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="font-semibold mb-2">Secure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your data is never stored on our servers
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-semibold mb-2">Works Offline</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PWA support for offline functionality
                </p>
              </div>
            </div>
          </section>
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
