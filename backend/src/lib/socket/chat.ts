import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";
import {
  userJoinService,
  userLeaveService,
  loadConversationMessagesService,
  sendMessageServiceLayer,
  handleTypingService,
} from "../../services/chat.services";
import { User } from "../../model/user.model";

// Track online users per socket
const onlineUsers = new Set<string>();

export const multiUserChatFeature = {
  register: (io: Server, socket: Socket) => {
    const broadcastOnlineUsers = async () => {
      // Fetch full user objects for all online user IDs
      const users = await User.find({ _id: { $in: Array.from(onlineUsers) } });
      io.emit(SocketEvent.ONLINE_USERS, users); // emit full objects
    };

    // --- User joins ---
    socket.on(SocketEvent.JOIN, async (userId: string) => {
      socket.data.userId = userId;

      await userJoinService(userId); // mark online in DB
      onlineUsers.add(userId);

      await broadcastOnlineUsers();
      console.log(`🟢 User joined: ${userId}`);
    });

    // --- Explicit leave ---
    socket.on(SocketEvent.LEAVE, async () => {
      const userId = socket.data.userId;
      if (!userId) return;

      await userLeaveService(userId); // mark offline in DB
      onlineUsers.delete(userId);

      await broadcastOnlineUsers();
      console.log(`🟠 User left (LEAVE): ${userId}`);
    });

    // --- Load messages ---
    socket.on(SocketEvent.LOAD_MESSAGES, async ({ senderId, receiverId }) => {
      const data = await loadConversationMessagesService(senderId, receiverId);
      if (!data) return;
      const { conversation, messages } = data;
      socket.emit(SocketEvent.LOAD_MESSAGES, messages);
      socket.join(conversation._id!.toString());
    });

    // --- Send message ---
    socket.on(
      SocketEvent.SEND_MESSAGE,
      async ({ senderId, receiverId, text, fileName, fileType, fileUrl }) => {
        const result = await sendMessageServiceLayer(
          io,
          senderId,
          receiverId,
          text || "",
          fileName || "",
          fileType || "",
          fileUrl || ""
        );
        if (!result) return;
        console.log(
          `Message sent in room ${result.conversation._id}:`,
          result.message
        );
      }
    );

    // --- Typing ---
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

      await userLeaveService(userId); // mark offline in DB
      onlineUsers.delete(userId);

      await broadcastOnlineUsers();
      console.log(`🔴 User disconnected: ${userId}`);
    });
  },
};
