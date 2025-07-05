import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";

export const getTelegramMembers = async (url: string): Promise<number> => {
  console.log(
    `🔍 [TELEGRAM DEBUG] Starting getTelegramMembers for URL: ${url}`
  );

  if (!process.env.TELEGRAM_API_ID || !process.env.TELEGRAM_API_HASH) {
    console.warn(
      "❌ [TELEGRAM DEBUG] Telegram API credentials are not set in environment variables."
    );
    console.warn("📝 [TELEGRAM DEBUG] Missing:", {
      TELEGRAM_API_ID: !!process.env.TELEGRAM_API_ID,
      TELEGRAM_API_HASH: !!process.env.TELEGRAM_API_HASH,
      TELEGRAM_SESSION_STRING: !!process.env.TELEGRAM_SESSION_STRING,
    });
    return 0;
  }

  console.log(`✅ [TELEGRAM DEBUG] API credentials found`);
  console.log(`📱 [TELEGRAM DEBUG] API ID: ${process.env.TELEGRAM_API_ID}`);
  console.log(
    `🔑 [TELEGRAM DEBUG] API Hash: ${
      process.env.TELEGRAM_API_HASH ? "Set" : "Not set"
    }`
  );
  console.log(
    `📝 [TELEGRAM DEBUG] Session: ${
      process.env.TELEGRAM_SESSION_STRING ? "Set" : "Empty"
    }`
  );

  // Check if URL is an invite link (these are harder to get member counts for)
  if (url.includes("joinchat/") || url.includes("/+")) {
    console.log(`⚠️  [TELEGRAM DEBUG] Detected invite link: ${url}`);
    console.log(
      `📝 [TELEGRAM DEBUG] Invite links require special handling and often need membership`
    );

    // For invite links, we need a different approach
    if (!process.env.TELEGRAM_SESSION_STRING) {
      console.log(
        `❌ [TELEGRAM DEBUG] Invite links require an authenticated session. Session is empty.`
      );
      return 0;
    }
  }

  const session = new StringSession(process.env.TELEGRAM_SESSION_STRING || "");
  const client = new TelegramClient(
    session,
    parseInt(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    {
      connectionRetries: 5,
    }
  );

  try {
    console.log(`🔌 [TELEGRAM DEBUG] Attempting to connect to Telegram...`);
    await client.connect();
    console.log(`✅ [TELEGRAM DEBUG] Successfully connected to Telegram`);
    console.log(
      `📊 [TELEGRAM DEBUG] Client connected status: ${client.connected}`
    );

    // Better URL parsing for different Telegram URL formats
    let channelName = "";

    if (url.includes("joinchat/")) {
      // Handle invite links like https://t.me/joinchat/LEM0ELklmO1kODdh
      const inviteHash = url.split("joinchat/")[1];
      console.log(`🔗 [TELEGRAM DEBUG] Invite hash: ${inviteHash}`);

      try {
        console.log(`🔍 [TELEGRAM DEBUG] Attempting to check invite link...`);
        const inviteInfo = await client.invoke(
          new Api.messages.CheckChatInvite({
            hash: inviteHash,
          })
        );
        console.log(`✅ [TELEGRAM DEBUG] Invite info retrieved:`, {
          className: inviteInfo.className,
          title: "title" in inviteInfo ? inviteInfo.title : "N/A",
          participantsCount:
            "participantsCount" in inviteInfo
              ? inviteInfo.participantsCount
              : "N/A",
        });

        if ("participantsCount" in inviteInfo) {
          const memberCount = inviteInfo.participantsCount || 0;
          console.log(
            `✅ [TELEGRAM DEBUG] Found member count from invite: ${memberCount}`
          );
          return memberCount;
        }
      } catch (inviteError: any) {
        console.log(
          `❌ [TELEGRAM DEBUG] Failed to check invite: ${inviteError.message}`
        );
        return 0;
      }
    } else if (url.includes("/+")) {
      // Handle links like https://t.me/+ABC123
      const inviteHash = url.split("/+")[1];
      console.log(`🔗 [TELEGRAM DEBUG] Plus invite hash: ${inviteHash}`);

      try {
        const inviteInfo = await client.invoke(
          new Api.messages.CheckChatInvite({
            hash: inviteHash,
          })
        );

        if ("participantsCount" in inviteInfo) {
          const memberCount = inviteInfo.participantsCount || 0;
          console.log(
            `✅ [TELEGRAM DEBUG] Found member count from plus invite: ${memberCount}`
          );
          return memberCount;
        }
      } catch (inviteError: any) {
        console.log(
          `❌ [TELEGRAM DEBUG] Failed to check plus invite: ${inviteError.message}`
        );
        return 0;
      }
    } else {
      // Handle regular channel links like https://t.me/channelname
      channelName = url.includes("t.me/") ? url.split("t.me/")[1] : url;

      // Remove any trailing slashes or parameters
      channelName = channelName.split("/")[0].split("?")[0];

      console.log(
        `📢 [TELEGRAM DEBUG] Extracted channel name: '${channelName}'`
      );
      console.log(`🔗 [TELEGRAM DEBUG] Original URL: '${url}'`);

      // Try with @ prefix first (for usernames)
      const channelToTry = channelName.startsWith("@")
        ? channelName
        : `@${channelName}`;
      console.log(
        `🔍 [TELEGRAM DEBUG] Attempting to get entity for: ${channelToTry}`
      );

      try {
        const entity = await client.getEntity(channelToTry);
        console.log(`✅ [TELEGRAM DEBUG] Successfully got entity`);
        console.log(`📊 [TELEGRAM DEBUG] Entity type: ${entity.className}`);
        console.log(`📊 [TELEGRAM DEBUG] Entity details:`, {
          id: entity.id,
          className: entity.className,
          accessHash: "accessHash" in entity ? entity.accessHash : "N/A",
          title: "title" in entity ? entity.title : "N/A",
          username: "username" in entity ? entity.username : "N/A",
        });

        console.log(`🔍 [TELEGRAM DEBUG] Invoking GetFullChannel...`);
        const fullChannel = await client.invoke(
          new Api.channels.GetFullChannel({
            channel: entity,
          })
        );
        console.log(`✅ [TELEGRAM DEBUG] Successfully got full channel data`);

        if (
          "fullChat" in fullChannel &&
          fullChannel.fullChat &&
          "participantsCount" in fullChannel.fullChat
        ) {
          const memberCount = fullChannel.fullChat.participantsCount || 0;
          console.log(
            `✅ [TELEGRAM DEBUG] Found participants count: ${memberCount}`
          );
          return memberCount;
        }
      } catch (entityError: any) {
        console.log(
          `❌ [TELEGRAM DEBUG] Failed to get entity with @: ${entityError.message}`
        );

        // Try without @ prefix
        console.log(
          `🔍 [TELEGRAM DEBUG] Trying without @ prefix: ${channelName}`
        );
        try {
          const entity = await client.getEntity(channelName);
          console.log(`✅ [TELEGRAM DEBUG] Successfully got entity without @`);

          const fullChannel = await client.invoke(
            new Api.channels.GetFullChannel({
              channel: entity,
            })
          );

          if (
            "fullChat" in fullChannel &&
            fullChannel.fullChat &&
            "participantsCount" in fullChannel.fullChat
          ) {
            const memberCount = fullChannel.fullChat.participantsCount || 0;
            console.log(
              `✅ [TELEGRAM DEBUG] Found participants count: ${memberCount}`
            );
            return memberCount;
          }
        } catch (secondError: any) {
          console.log(
            `❌ [TELEGRAM DEBUG] Failed to get entity without @: ${secondError.message}`
          );
        }
      }
    }

    console.log(`❌ [TELEGRAM DEBUG] No member count found for ${url}`);
    return 0;
  } catch (error) {
    console.error(
      `❌ [TELEGRAM DEBUG] Failed to fetch Telegram members for ${url}:`,
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
        name: error instanceof Error ? error.name : "Unknown error type",
      }
    );

    // Provide specific guidance based on error type
    if (error instanceof Error) {
      if (error.message.includes("Cannot find any entity")) {
        console.log(
          `💡 [TELEGRAM DEBUG] Suggestion: Channel might be private, invite-only, or the username is incorrect`
        );
      } else if (error.message.includes("AUTH_KEY_UNREGISTERED")) {
        console.log(
          `💡 [TELEGRAM DEBUG] Suggestion: You need to authenticate and generate a session string`
        );
      } else if (error.message.includes("CHAT_ADMIN_REQUIRED")) {
        console.log(
          `💡 [TELEGRAM DEBUG] Suggestion: Member count requires admin privileges for this channel`
        );
      }
    }

    return 0;
  } finally {
    if (client.connected) {
      console.log(`🔌 [TELEGRAM DEBUG] Disconnecting client...`);
      await client.disconnect();
      console.log(`✅ [TELEGRAM DEBUG] Client disconnected`);
    } else {
      console.log(
        `📊 [TELEGRAM DEBUG] Client was not connected, skipping disconnect`
      );
    }
  }
};
