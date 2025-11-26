import Link from "next/link";
import { YouTubeLogo, SpotifyLogo, AppleMusicLogo, AmazonMusicLogo } from "../app/components/PlatformLogo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-300/40 via-pink-300/40 to-purple-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-gradient-to-br from-pink-300/40 via-cyan-300/40 to-orange-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-300/30 via-cyan-300/30 to-pink-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-cyan-200/30 via-pink-200/30 to-purple-200/30 dark:from-cyan-500/20 dark:via-pink-500/20 dark:to-purple-500/20 rounded-full border border-cyan-300/60 dark:border-cyan-700/50">
              <span className="text-sm font-medium bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                ✨ Powered by Advanced AI Matching
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-gray-800 via-cyan-500 via-pink-500 to-purple-600 dark:from-white dark:via-cyan-200 dark:via-pink-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
              Your Music,<br />Every Platform
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              Transfer playlists between YouTube, Spotify, Apple Music, and Amazon Music with intelligent track matching and seamless synchronization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/transfer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 hover:from-cyan-500 hover:via-pink-500 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl shadow-pink-400/60 hover:shadow-2xl hover:shadow-cyan-400/60 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 text-lg"
              >
                <span>🚀 Get Started</span>
              </Link>
              <button className="inline-flex items-center gap-3 px-8 py-4 bg-white/90 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-cyan-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-pink-400 text-gray-700 dark:text-gray-200 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg">
                <span>📖 Watch Demo</span>
              </button>
            </div>
          </section>

          {/* Platform Showcase */}
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
              Supported Platforms
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "YouTube", color: "red", component: YouTubeLogo, available: true },
                { name: "Spotify", color: "green", component: SpotifyLogo, available: true },
                { name: "Apple Music", color: "pink", component: AppleMusicLogo, available: true },
                { name: "Amazon Music", color: "blue", component: AmazonMusicLogo, available: false, comingSoon: true }
              ].map((platform) => (
                <div
                  key={platform.name}
                  className={`group relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 shadow-lg ${
                    !platform.available
                      ? "bg-gray-100/60 dark:bg-gray-900/60 border-gray-300/50 dark:border-gray-700/50 opacity-75"
                      : "bg-white/60 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-purple-500/50 transform hover:scale-105 hover:-translate-y-2 cursor-pointer hover:shadow-2xl"
                  }`}
                >
                  <div className="flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <platform.component />
                  </div>
                  <h4 className="text-center font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {platform.name}
                  </h4>
                  {platform.comingSoon && (
                    <div className="mt-2 text-center">
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full border border-orange-200 dark:border-orange-800">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Features Grid */}
          <section className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Transfer thousands of tracks in seconds with our optimized engine",
                gradient: "from-cyan-300 to-cyan-500",
              },
              {
                icon: "🎯",
                title: "Smart Matching",
                description: "AI-powered track matching ensures perfect playlist recreation",
                gradient: "from-pink-300 to-pink-500",
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                description: "Your data is processed locally, never stored on our servers",
                gradient: "from-purple-300 to-purple-500",
              },
              {
                icon: "🔄",
                title: "Bidirectional",
                description: "Transfer from any platform to any other, in any direction",
                gradient: "from-cyan-400 via-pink-400 to-purple-500",
              },
              {
                icon: "🎨",
                title: "Smart Duplicates",
                description: "Automatically detects and handles duplicate tracks intelligently",
                gradient: "from-pink-400 to-purple-500",
              },
              {
                icon: "📱",
                title: "PWA Ready",
                description: "Install as an app and work offline with full PWA support",
                gradient: "from-cyan-400 to-pink-400",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-8 hover:border-transparent hover:bg-gradient-to-br hover:from-white/90 hover:to-white/70 dark:hover:from-gray-800/90 dark:hover:to-gray-800/70 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl"
              >
                <div className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-3xl transform group-hover:rotate-6 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </section>

          {/* CTA Section */}
          <section className="relative backdrop-blur-xl bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl shadow-purple-500/50 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xMDUiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />
            <div className="relative text-center">
              <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Ready to Transfer Your Playlists?
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of users migrating their music collections effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/transfer"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white hover:bg-gray-50 text-purple-600 font-bold rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-3xl text-lg"
                >
                  <span>Start Free Transfer</span>
                  <span className="text-2xl">🚀</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

    </div>
  );
}
