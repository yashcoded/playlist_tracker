import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Handle OAuth errors
  if (error) {
    console.error("YouTube OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/transfer?error=${encodeURIComponent(error)}&platform=youtube`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/transfer?error=no_code&platform=youtube", request.url)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${request.nextUrl.origin}/api/auth/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/transfer?error=token_exchange_failed&platform=youtube", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    
    // Store token in cookie (encrypted in production)
    const cookieStore = await cookies();
    cookieStore.set("youtube_token", JSON.stringify({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
    }), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
    });

    // Redirect back to transfer page with success
    return NextResponse.redirect(
      new URL("/transfer?auth=success&platform=youtube", request.url)
    );
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/transfer?error=callback_error&platform=youtube", request.url)
    );
  }
}

