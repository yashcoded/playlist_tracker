# 🎵 Playlist Tracker

A Progressive Web App (PWA) built with Next.js that helps you transfer playlists from YouTube to Spotify, Apple Music, Amazon Music, and other music platforms.

## Features

- 🎬 **YouTube Integration** - Import playlists from YouTube
- 🎵 **Multi-Platform Support** - Export to Spotify, Apple Music, Amazon Music
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

1. **Enter YouTube Playlist URL** - Paste the URL of the YouTube playlist you want to transfer
2. **Select Platform** - Choose your destination music platform (Spotify, Apple Music, Amazon Music)
3. **Authenticate** - Connect with your chosen platform (requires API credentials)
4. **Transfer** - The app will match songs and create your playlist on the selected platform

## PWA Features

- **Installable**: Can be installed on mobile and desktop devices
- **Offline Support**: Basic functionality works offline
- **Fast Loading**: Optimized for quick loading times
- **App-like Experience**: Full-screen mode and native feel

## Future Enhancements

- [ ] YouTube API integration for fetching playlist data
- [ ] Spotify API integration for creating playlists
- [ ] Apple Music API integration
- [ ] Amazon Music API integration
- [ ] Batch playlist transfers
- [ ] Playlist editing before transfer
- [ ] Track matching algorithm improvements
- [ ] Transfer history and analytics
- [ ] Reverse transfer (from streaming to YouTube)

## API Configuration

To fully implement the transfer functionality, you'll need API credentials:

- **YouTube Data API v3**: For fetching playlist information
- **Spotify Web API**: For creating playlists on Spotify
- **Apple Music API**: For Apple Music integration
- **Amazon Music API**: For Amazon Music integration

Add these to your `.env.local` file:

```env
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
APPLE_MUSIC_KEY=your_apple_music_key
AMAZON_MUSIC_KEY=your_amazon_music_key
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- PWA support by [next-pwa](https://github.com/shadowwalker/next-pwa)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
