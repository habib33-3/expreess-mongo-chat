import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";
import {
  userJoinService,
  userLeaveService,
  loadConversationMessagesService,
  sendMessageServiceLayer,
  handleTypingService,
} from "../../services/chat.services";

export const multiUserChatFeature = {
  register: (io: Server, socket: Socket) => {
    // --- User joins ---
    socket.on(SocketEvent.JOIN, async (userId: string) => {
      await userJoinService(userId);
      socket.data.userId = userId;
      console.log(`🟢 User joined: ${userId}`);
    });

    // --- Load messages and join conversation room ---
    socket.on(SocketEvent.LOAD_MESSAGES, async ({ senderId, receiverId }) => {
      const data = await loadConversationMessagesService(senderId, receiverId);
      if (!data) return;

      const { conversation, messages } = data;

      socket.emit(SocketEvent.LOAD_MESSAGES, messages);

      socket.join(conversation._id!.toString());
      console.log(`User ${senderId} joined room ${conversation._id}`);
    });

    // --- Send message ---
    socket.on(
      SocketEvent.SEND_MESSAGE,
      async ({ senderId, receiverId, text, fileName, fileType, fileUrl }) => {
        const result = await sendMessageServiceLayer(
          io,
          senderId,
          receiverId,
          text,
          fileName,
          fileType,
          fileUrl
        );
        if (!result) return;

        console.log(
          `Message sent in room ${result.conversation._id}:`,
          result.message
        );
      }
    );

    // --- Typing indicators ---
    socket.on(SocketEvent.TYPING, ({ senderId, receiverId }) =>
      handleTypingService(io, SocketEvent.TYPING, senderId, receiverId)
    );

    socket.on(SocketEvent.STOP_TYPING, ({ senderId, receiverId }) =>
      handleTypingService(io, SocketEvent.STOP_TYPING, senderId, receiverId)
    );

    // --- Disconnect ---
    socket.on("disconnect", async () => {
      const userId = socket.data.userId;
      if (!userId) return;
      await userLeaveService(userId);
      console.log(`🔴 User left: ${userId}`);
    });
  },
};
