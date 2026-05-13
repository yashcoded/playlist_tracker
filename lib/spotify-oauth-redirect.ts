/**
 * Spotify redirect URI for local HTTP must use a loopback IP, not "localhost".
 * Dashboard shows "not secure" for http://localhost — migrate to 127.0.0.1 per Spotify.
 *
 * @see https://developer.spotify.com/documentation/web-api/tutorials/migration-insecure-redirect-uri
 */
export function spotifyOAuthRedirectUri(pageOrigin: string): string {
  try {
    const u = new URL(pageOrigin);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
    }
    return `${u.origin}/api/auth/spotify/callback`;
  } catch {
    const trimmed = pageOrigin.replace(/\/$/, "");
    return `${trimmed}/api/auth/spotify/callback`;
  }
}
