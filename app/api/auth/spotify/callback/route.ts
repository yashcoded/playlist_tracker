import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  
  // Get the original origin from state to redirect back to the correct domain
  // This is important because Spotify requires 127.0.0.1, but user might be on localhost
  let redirectOrigin = request.nextUrl.origin;
  if (state) {
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      if (stateData.origin) {
        redirectOrigin = stateData.origin;
        console.log("Original origin from state:", redirectOrigin);
      }
    } catch (e) {
      // State might not be JSON, ignore
      console.log("State is not JSON, using current origin");
    }
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
    // Spotify requires 127.0.0.1 instead of localhost
    const redirectUri = request.nextUrl.origin.includes('localhost')
      ? request.nextUrl.origin.replace('localhost', '127.0.0.1') + '/api/auth/spotify/callback'
      : `${request.nextUrl.origin}/api/auth/spotify/callback`;
    
    console.log("Spotify callback - redirect URI:", redirectUri);
    console.log("Spotify callback - code received:", code ? "yes" : "no");
    
    // Exchange authorization code for access token
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
    console.log("Spotify token received:", { hasAccessToken: !!tokenData.access_token, hasRefreshToken: !!tokenData.refresh_token });
    
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
    
    console.log("Setting cookie with options:", cookieOptions);
    cookieStore.set("spotify_token", JSON.stringify(tokenPayload), cookieOptions);
    
    console.log("Spotify token stored in cookie");
    console.log("Redirect origin:", redirectOrigin);
    console.log("Request origin:", request.nextUrl.origin);
    console.log("Token payload:", { hasAccessToken: !!tokenPayload.accessToken, hasRefreshToken: !!tokenPayload.refreshToken });

    // Always pass token in URL as fallback (in case cookie doesn't work)
    // This ensures token is stored even if cookie fails
    const tokenJson = JSON.stringify(tokenPayload);
    const tokenParam = `&token=${encodeURIComponent(tokenJson)}`;
    console.log("Token param length:", tokenParam.length);
    console.log("Token param preview:", tokenParam.substring(0, 100) + "...");
    
    // Redirect back to transfer page with success
    // Use the original origin (localhost) if user was on localhost, otherwise use current origin
    const redirectPath = `/transfer?auth=success&platform=spotify${tokenParam}`;
    const finalRedirectUrl = redirectOrigin.includes('localhost') && request.nextUrl.origin.includes('127.0.0.1')
      ? new URL(redirectPath, redirectOrigin)
      : new URL(redirectPath, request.url);
    
    console.log("Redirecting to:", finalRedirectUrl.toString().substring(0, 200) + "...");
    console.log("Full redirect URL length:", finalRedirectUrl.toString().length);
    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error("Spotify OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/transfer?error=callback_error&platform=spotify&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}

