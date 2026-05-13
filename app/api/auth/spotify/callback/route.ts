import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function isDevLocalHostname(host: string) {
  return host === "localhost" || host === "127.0.0.1";
}

/** Prevent open redirects: only allow state origin if it matches safe rules vs this request. */
function allowedSpotifyReturnOrigin(origin: string, requestOrigin: string): boolean {
  try {
    const o = new URL(origin);
    const req = new URL(requestOrigin);
    if (o.protocol !== "http:" && o.protocol !== "https:") return false;
    if (process.env.NODE_ENV !== "production") {
      return isDevLocalHostname(o.hostname) && isDevLocalHostname(req.hostname);
    }
    return o.origin === req.origin;
  } catch {
    return false;
  }
}

/** Spotify redirect_uri used in /authorize must be byte-identical in the token POST. */
function parseSpotifyState(state: string | null): {
  origin?: string;
  spotifyRedirectUri?: string;
} {
  if (!state) return {};
  try {
    return JSON.parse(decodeURIComponent(state)) as {
      origin?: string;
      spotifyRedirectUri?: string;
    };
  } catch {
    return {};
  }
}

function isAllowedSpotifyTokenRedirectUri(
  redirectUri: string,
  requestOrigin: string
): boolean {
  try {
    const u = new URL(redirectUri);
    if (u.pathname !== "/api/auth/spotify/callback" || u.search || u.hash) {
      return false;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const req = new URL(requestOrigin);
    if (process.env.NODE_ENV !== "production") {
      return (
        isDevLocalHostname(u.hostname) &&
        isDevLocalHostname(req.hostname) &&
        u.port === req.port
      );
    }
    return u.origin === req.origin;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const stateData = parseSpotifyState(state);

  // Where to send the user after success (browser page they started from)
  let redirectOrigin = request.nextUrl.origin;
  if (stateData.origin && allowedSpotifyReturnOrigin(stateData.origin, request.nextUrl.origin)) {
    redirectOrigin = stateData.origin;
  }

  // Handle OAuth errors
  if (error) {
    console.error("Spotify OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/transfer?error=${encodeURIComponent(error)}&platform=spotify`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/transfer?error=no_code&platform=spotify", request.url)
    );
  }

  try {
    // Must exactly match redirect_uri in /authorize (Spotify compares to the issued code).
    const fallbackRedirectUri = `${request.nextUrl.origin}/api/auth/spotify/callback`;
    const redirectUri =
      stateData.spotifyRedirectUri &&
      isAllowedSpotifyTokenRedirectUri(stateData.spotifyRedirectUri, request.nextUrl.origin)
        ? stateData.spotifyRedirectUri
        : fallbackRedirectUri;
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        code: code!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Spotify token exchange failed:", errorData);
      console.error("Status:", tokenResponse.status);
      return NextResponse.redirect(
        new URL(`/transfer?error=token_exchange_failed&platform=spotify&details=${encodeURIComponent(errorData)}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    
    // Store token in cookie
    const cookieStore = await cookies();
    const tokenPayload = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
    };
    
    // Determine the domain for the cookie
    // For localhost/127.0.0.1, don't set domain (let browser handle it)
    const cookieOptions: any = {
      httpOnly: false, // Allow client-side access
      secure: false, // Set to false for localhost development
      sameSite: "lax" as const,
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    };
    
    // For production, use secure cookies
    if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true;
      if (!request.nextUrl.hostname.includes('localhost') && !request.nextUrl.hostname.includes('127.0.0.1')) {
        cookieOptions.domain = request.nextUrl.hostname;
      }
    }
    
    cookieStore.set("spotify_token", JSON.stringify(tokenPayload), cookieOptions);

    // URL token fallback if cookie is blocked; avoid logging token contents
    const tokenJson = JSON.stringify(tokenPayload);
    const tokenParam = `&token=${encodeURIComponent(tokenJson)}`;
    const redirectPath = `/transfer?auth=success&platform=spotify${tokenParam}`;

    const useStateOrigin =
      redirectOrigin !== request.nextUrl.origin &&
      allowedSpotifyReturnOrigin(redirectOrigin, request.nextUrl.origin);

    const finalRedirectUrl = new URL(
      redirectPath,
      useStateOrigin ? redirectOrigin : request.url
    );

    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error("Spotify OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/transfer?error=callback_error&platform=spotify&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}

