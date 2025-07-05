import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

/**
 * Run this script to authenticate with Telegram and get a session string
 *
 * Usage:
 * 1. Set your TELEGRAM_API_ID and TELEGRAM_API_HASH in environment variables
 * 2. Run this function
 * 3. You'll get a phone number prompt and verification code
 * 4. Copy the generated session string to your TELEGRAM_SESSION env var
 */
export async function authenticateTelegram(): Promise<string> {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    throw new Error(
      "Please set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables"
    );
  }

  console.log("🔐 Starting Telegram authentication...");
  console.log("📱 You'll need your phone number and verification code");

  const session = new StringSession(""); // Empty session for new auth
  const client = new TelegramClient(session, parseInt(apiId), apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.connect();
    console.log("✅ Connected to Telegram");

    // This will prompt for phone number and verification code
    await client.start({
      phoneNumber: async () => {
        console.log(
          "📞 Please enter your phone number (with country code, e.g., +1234567890):"
        );
        // In a real implementation, you'd get this from user input
        // For now, this is just a template
        throw new Error(
          "Please implement phone number input for your environment"
        );
      },
      password: async () => {
        console.log("🔐 Please enter your 2FA password:");
        // In a real implementation, you'd get this from user input
        throw new Error("Please implement password input for your environment");
      },
      phoneCode: async () => {
        console.log(
          "📱 Please enter the verification code sent to your phone:"
        );
        // In a real implementation, you'd get this from user input
        throw new Error(
          "Please implement verification code input for your environment"
        );
      },
      onError: (err) => {
        console.error("❌ Authentication error:", err);
        throw err;
      },
    });

    // Get the session string
    const sessionString = (client.session as StringSession).save();
    console.log("✅ Authentication successful!");
    console.log("📝 Your session string:");
    console.log(sessionString);
    console.log(
      "🔧 Add this to your .env file as TELEGRAM_SESSION=<session_string>"
    );

    return sessionString;
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw error;
  } finally {
    await client.disconnect();
  }
}

// Alternative: Simple session string generator for manual authentication
export function generateAuthInstructions(): void {
  console.log(`
🔐 TELEGRAM AUTHENTICATION SETUP

To get member counts from Telegram channels, you need to authenticate:

1. Go to https://my.telegram.org/auth
2. Log in with your phone number
3. Go to 'API Development Tools'
4. Create a new application:
   - App title: Your app name
   - Short name: Your app short name
   - Platform: Other
   - Description: Token data fetching

5. Copy the API ID and API Hash to your .env file:
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash

6. Run a separate authentication script to get session string
7. Add the session string to your .env file:
   TELEGRAM_SESSION=your_session_string

⚠️  IMPORTANT NOTES:
- Most crypto Telegram channels are private/invite-only
- You need to be a member of the channel to get member counts
- Some channels require admin privileges to see member counts
- Public channels with usernames (like @channelname) work better than invite links

🔧 ALTERNATIVE APPROACH:
Consider using the CoinGecko community data instead:
- It already includes telegram member counts for many tokens
- No authentication required
- More reliable for public data
  `);
}
