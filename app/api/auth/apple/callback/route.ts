import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Handle OAuth errors
  if (error) {
    console.error("Apple Music OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/transfer?error=${encodeURIComponent(error)}&platform=apple`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/transfer?error=no_code&platform=apple", request.url)
    );
  }

  try {
    // Apple Music uses JWT for token exchange
    // This is a simplified version - full implementation requires JWT signing
    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "",
        client_secret: process.env.APPLE_CLIENT_SECRET || "", // This should be a JWT
        redirect_uri: `${request.nextUrl.origin}/api/auth/apple/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/transfer?error=token_exchange_failed&platform=apple", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    
    // Store token in cookie
    const cookieStore = await cookies();
    cookieStore.set("apple_token", JSON.stringify({
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
      new URL("/transfer?auth=success&platform=apple", request.url)
    );
  } catch (error) {
    console.error("Apple Music OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/transfer?error=callback_error&platform=apple", request.url)
    );
  }
}

