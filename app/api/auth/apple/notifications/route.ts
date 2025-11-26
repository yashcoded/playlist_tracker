import { NextRequest, NextResponse } from "next/server";

/**
 * Apple Sign in with Apple Server-to-Server Notification Endpoint
 * 
 * This endpoint receives notifications from Apple when:
 * - Users change mail forwarding preferences
 * - Users delete their app account
 * - Users permanently delete their Apple Account
 * 
 * For this playlist transfer app, we mainly use this to:
 * - Clean up user data when accounts are deleted
 * - Handle account status changes
 * 
 * Documentation: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user
 */
export async function POST(request: NextRequest) {
  try {
    // Apple sends notifications as JWT tokens
    const body = await request.text();
    
    // Parse the notification payload
    // Note: In production, you should verify the JWT signature from Apple
    let notification;
    try {
      notification = JSON.parse(body);
    } catch {
      // If not JSON, it might be a JWT token
      // You would need to decode and verify it using Apple's public keys
      console.log("Received notification (possibly JWT):", body.substring(0, 100));
    }

    // Handle different notification types
    // Common types: "email-disabled", "email-enabled", "consent-withdrawn", "account-delete"
    
    if (notification) {
      console.log("Apple notification received:", notification);
      
      // Example: Handle account deletion
      if (notification.type === "account-delete" || notification.events?.includes("account-delete")) {
        // Clean up user data from your database/storage
        // const userId = notification.sub; // User identifier
        // await deleteUserData(userId);
        console.log("Account deletion notification received");
      }
      
      // Example: Handle email forwarding changes
      if (notification.type === "email-disabled" || notification.events?.includes("email-disabled")) {
        console.log("Email forwarding disabled");
      }
    }

    // Always return 200 OK to acknowledge receipt
    // Apple will retry if you return an error
    return NextResponse.json({ 
      success: true,
      message: "Notification received" 
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing Apple notification:", error);
    
    // Still return 200 to prevent Apple from retrying
    // Log the error for investigation
    return NextResponse.json({ 
      success: false,
      error: "Error processing notification" 
    }, { status: 200 });
  }
}

// Apple may also send GET requests to verify the endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: "active",
    message: "Apple notification endpoint is active" 
  });
}

