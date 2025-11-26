# YouTube API Setup Guide

## Quick Setup for YouTube Integration

### 1. **Go to Google Cloud Console**
Visit: [Google Cloud Console](https://console.developers.google.com/)

### 2. **Create or Select Project**
- Click "Select a project" → "New Project"
- Name: `Playlist Tracker`
- Click "Create"

### 3. **Enable YouTube Data API**
- Go to "APIs & Services" → "Library"
- Search for "YouTube Data API v3"
- Click on it and press "Enable"

### 4. **Create Credentials**

#### For API Key (Public Data):
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "API Key"
- Copy the API key
- **Restrict the key**: Click "Restrict Key"
  - Under "API restrictions", select "YouTube Data API v3"
  - Save

#### For OAuth Client (User Authentication):
- Click "Create Credentials" → "OAuth client ID"
- Choose "Web application"
- Name: `Playlist Tracker Web Client`
- **Authorized redirect URIs**: Add this:
  - `http://localhost:3000/api/auth/youtube/callback`
  
  **Note**: Make sure this matches exactly - no trailing slashes!
- Click "Create"
- Copy the **Client ID** and **Client Secret**

### 5. **Add to Environment File**

Create `.env.local` in your project root:

```env
# YouTube API Configuration
YOUTUBE_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Other platforms (if you have them)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
APPLE_MUSIC_KEY_ID=your_apple_music_key_id
APPLE_MUSIC_ISSUER_ID=your_apple_music_issuer_id
APPLE_MUSIC_TEAM_ID=your_apple_music_team_id
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_apple_music_private_key
-----END PRIVATE KEY-----"
```

### 6. **Restart Development Server**

```bash
npm run dev
```

### 7. **Test the Integration**

- Visit: `http://localhost:3001/transfer`
- The YouTube warning should disappear
- You should be able to authenticate with YouTube

## 🚨 **Important Notes**

1. **NEXT_PUBLIC_ Prefix**: The Google Client ID must have `NEXT_PUBLIC_` prefix to work in the browser
2. **Redirect URIs**: Must match exactly what you configure in Google Console
3. **API Restrictions**: Restrict your API key to only YouTube Data API v3 for security
4. **Quotas**: YouTube API has daily quotas - monitor usage in Google Console

## 🆘 **Troubleshooting**

### "Invalid Client ID" Error
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Verify the redirect URI matches your Google Console settings

### "API Key Invalid" Error  
- Check that `YOUTUBE_API_KEY` is set correctly
- Ensure the API key has YouTube Data API v3 enabled

### "Quota Exceeded" Error
- You've hit the daily API limit
- Wait until tomorrow or request quota increase

## 🎯 **For Demo/Development**

If you don't want to set up real APIs right now:
- The app works with mock data
- Just ignore the warning - it's only informational
- All functionality works without real API keys

## 💡 **Cost Information**

- **YouTube Data API**: Free tier with quotas
- **Google OAuth**: Free
- **No credit card required** for basic usage

The setup takes about 10 minutes and gives you full YouTube integration!
