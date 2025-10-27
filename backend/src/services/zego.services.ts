import { generateToken04 } from "../../zego_server_assistant/token/nodejs/server/zegoServerAssistant";

export const createZegoTokenService = (userID: number, roomID: string) => {
  const appID = Number(process.env.ZEGO_APPID);
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  const effectiveTimeInSeconds = "3600"; // 1h

  return generateToken04(
    appID,
    serverSecret!,
    roomID,
    userID,
    effectiveTimeInSeconds
  );
};
