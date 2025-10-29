import { generateToken04 } from "../../zego_server_assistant/token/nodejs/server/zegoServerAssistant";

export const createZegoTokenService = (userID: string, roomID: string) => {
  try {
    const appID = Number(process.env.ZEGO_APPID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET!;
    const effectiveTimeInSeconds = 3600; // number (not string)



    const token = generateToken04(
      appID,                   // OK
      userID,                  // 2nd param must be userID
      serverSecret,            // 3rd param must be secret
      effectiveTimeInSeconds,  // 4th
      ""                       // 5th = optional payload
    );

    return {
      token,
      appID,
    };
  } catch (error) {
    console.error("Error generating Zego token:", error);
    throw error;
  }
};
