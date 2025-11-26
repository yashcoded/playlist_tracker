# 🎵 Playlist Tracker

A Progressive Web App (PWA) built with Next.js that helps you transfer playlists bidirectionally between YouTube, Spotify, Apple Music, Amazon Music, and other music platforms.

## Features

- 🔄 **Bidirectional Transfer** - Transfer playlists from any platform to any other platform
- 🎬 **YouTube Integration** - Import/export playlists from/to YouTube
- 🎵 **Multi-Platform Support** - Works with Spotify, Apple Music (Amazon Music coming soon)
- ⚡ **Fast Transfer** - Quick and efficient playlist migration
- 🔒 **Secure** - Your data is never stored on our servers
- 📱 **PWA Support** - Install as an app on your device
- 🌙 **Dark Mode** - Automatic dark mode support
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yashcoded/playlist_tracker.git
cd playlist_tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
playlist_tracker/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with PWA metadata
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── transfer/          # Transfer page
│       └── page.tsx       # Playlist transfer interface
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   └── icons/             # App icons
├── components/            # Reusable components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── next.config.js         # Next.js configuration with PWA

```

## How It Works

1. **Select Source Platform** - Choose where your playlist currently is (YouTube, Spotify, Apple Music, Amazon Music)
2. **Enter Playlist URL** - Paste the URL of the playlist you want to transfer
3. **Select Destination Platform** - Choose where you want to transfer the playlist to
4. **Authenticate** - Connect with both platforms (requires API credentials)
5. **Transfer** - The app will match songs and create your playlist on the destination platform

## PWA Features

- **Installable**: Can be installed on mobile and desktop devices
- **Offline Support**: Basic functionality works offline
- **Fast Loading**: Optimized for quick loading times
- **App-like Experience**: Full-screen mode and native feel

## Future Enhancements

- [ ] YouTube API integration for fetching/creating playlist data
- [ ] Spotify API integration for fetching/creating playlists
- [ ] Apple Music API integration for fetching/creating playlists
- [ ] Amazon Music API integration for fetching/creating playlists
- [ ] Batch playlist transfers
- [ ] Playlist editing before transfer
- [ ] Track matching algorithm improvements
- [ ] Transfer history and analytics

## API Configuration

### Quick Start (No API Keys Required)

The app works out of the box with **mock APIs** for all platforms. You can test all functionality without any API keys!

### Real API Integration (Optional)

To connect to real music platforms, you'll need API credentials:

- **YouTube Data API v3**: Free with Google account
- **Spotify Web API**: Free with Spotify Developer account  
- **Apple Music API**: Requires $99/year Apple Developer account
- **Amazon Music API**: Not publicly available

### Setup Instructions

1. **Copy environment file**:
   ```bash
   cp env.example .env.local
   ```

2. **Choose your approach**:
   - **Option A**: Use mock APIs (no setup required)
   - **Option B**: Set up real APIs (see guides below)

3. **Platform-specific guides**:
   - **YouTube**: See `YOUTUBE_API_SETUP.md` for step-by-step instructions
   - **Spotify**: Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - **Apple Music**: Already configured (if you have Apple Developer account)

### Apple Music API Challenges

**Can't get Apple Developer account?** No problem! Here are alternatives:

1. **Use Mock API**: Full functionality with simulated data
2. **Manual Transfer**: Copy/paste playlist data
3. **Third-party Services**: Use existing playlist transfer services
4. **Student Account**: Free Apple Developer access for students

See `APPLE_MUSIC_API_SETUP.md` for complete details and workarounds.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- PWA support by [next-pwa](https://github.com/shadowwalker/next-pwa)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
