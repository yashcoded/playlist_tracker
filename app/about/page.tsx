import Link from "next/link";
import { YouTubeLogo, SpotifyLogo, AppleMusicLogo, AmazonMusicLogo } from "../components/PlatformLogo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-300/40 via-pink-300/40 to-purple-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-gradient-to-br from-pink-300/40 via-cyan-300/40 to-orange-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              About Playlist Transfer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Seamlessly move your music playlists between your favorite platforms
            </p>
          </div>

          {/* What is it */}
          <section className="mb-16 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              What is Playlist Transfer?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              Playlist Transfer is a modern web application that allows you to seamlessly transfer your music playlists 
              between different music streaming platforms. Whether you want to move your favorite YouTube playlists to 
              Spotify, or sync your Apple Music collection to Amazon Music, this tool makes it easy.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Built with cutting-edge web technologies, Playlist Transfer provides a fast, secure, and user-friendly 
              experience for managing your music across platforms. No more manual track-by-track copying—just select your 
              source and destination, and let the magic happen.
            </p>
          </section>

          {/* Supported Platforms */}
          <section className="mb-16 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Supported Platforms
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800/50">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <YouTubeLogo />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">YouTube</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800/50">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <SpotifyLogo />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Spotify</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border border-pink-200 dark:border-pink-800/50">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <AppleMusicLogo />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Apple Music</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border border-cyan-200 dark:border-cyan-800/50 opacity-75 relative">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <AmazonMusicLogo />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Amazon Music</h3>
                <div className="mt-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full border border-orange-200 dark:border-orange-800">
                  Coming Soon
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-16 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-purple-50 dark:from-cyan-900/20 dark:to-purple-900/20 border border-cyan-200 dark:border-cyan-800/50">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">🔐 Secure OAuth</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Your credentials are stored securely in your browser. We never see or store your passwords.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">⚡ Fast & Reliable</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Built with Next.js for optimal performance and reliability. Transfer playlists in seconds.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800/50">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">🎨 Beautiful UI</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Modern, responsive design with dark mode support. Works perfectly on all devices.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800/50">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">🔄 Smart Matching</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Intelligent track matching algorithm finds the right songs across different platforms.
                </p>
              </div>
            </div>
          </section>

          {/* About the Developer */}
          <section className="mb-16 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              About the Developer
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  Playlist Transfer is built by <strong className="text-gray-900 dark:text-white">Yash</strong> from{' '}
                  <a 
                    href="https://yashcoded.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold transition-colors"
                  >
                    yashcoded.com
                  </a>, a passionate 
                  developer who loves creating tools that make life easier. With a focus on modern web technologies and 
                  user experience, this project represents the intersection of music, technology, and innovation.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  As a full-stack developer, Yash specializes in building scalable web applications using technologies like 
                  Next.js, React, TypeScript, and modern CSS frameworks. This project showcases expertise in OAuth integration, 
                  API design, and creating seamless user experiences.
                </p>
                <div className="flex gap-4 mt-6">
                  <a
                    href="https://yashcoded.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 hover:from-cyan-500 hover:via-pink-500 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Visit Portfolio
                  </a>
                  <a
                    href="https://github.com/yashcoded"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="mb-16 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Technology Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Next.js", desc: "React Framework" },
                { name: "TypeScript", desc: "Type Safety" },
                { name: "Tailwind CSS", desc: "Styling" },
                { name: "OAuth 2.0", desc: "Authentication" },
              ].map((tech, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{tech.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{tech.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/transfer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 hover:from-cyan-500 hover:via-pink-500 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-pink-400/60 hover:shadow-xl hover:shadow-cyan-400/60 transition-all duration-300 transform hover:-translate-y-0.5 text-lg"
            >
              Start Transferring Playlists
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

