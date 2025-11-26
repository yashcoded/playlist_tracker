import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Handle OAuth errors
  if (error) {
    console.error("Amazon Music OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/transfer?error=${encodeURIComponent(error)}&platform=amazon`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/transfer?error=no_code&platform=amazon", request.url)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://api.amazon.com/auth/o2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID || "",
        client_secret: process.env.AMAZON_CLIENT_SECRET || "",
        redirect_uri: `${request.nextUrl.origin}/api/auth/amazon/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/transfer?error=token_exchange_failed&platform=amazon", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    
    // Store token in cookie
    const cookieStore = await cookies();
    cookieStore.set("amazon_token", JSON.stringify({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
    });

    // Redirect back to transfer page with success
    return NextResponse.redirect(
      new URL("/transfer?auth=success&platform=amazon", request.url)
    );
  } catch (error) {
    console.error("Amazon Music OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/transfer?error=callback_error&platform=amazon", request.url)
    );
  }
}

