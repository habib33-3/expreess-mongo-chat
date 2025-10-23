import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { User } from "../../model/user";
import { IMessage, Message } from "../../model/message";
import { Conversation } from "../../model/conversation";
import { SocketEvent } from "../../constants";
import { getObjectId } from "../util";
import { sendMessageService } from "../../services/message.services";
import { findOrCreateConversation } from "../../services/conversation.services";

// Maps for online users
const onlineUsers = new Map<string, string>(); // userId -> socketId
const socketToUser = new Map<string, string>(); // socketId -> userId

export const multiUserChatFeature = {
  register: (io: Server, socket: Socket) => {
    // --- User joins ---
    socket.on(SocketEvent.JOIN, async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socketToUser.set(socket.id, userId);

      await User.findByIdAndUpdate(userId, { isOnline: true });

      console.log(`🟢 User joined: ${userId}`);

      // Broadcast online users
      const online = Array.from(onlineUsers.keys());
      io.emit(SocketEvent.ONLINE_USERS, online);
    });

    // --- Send message ---
    socket.on(
      SocketEvent.SEND_MESSAGE,
      async (data: {
        senderId: string;
        receiverId: string;
        text?: string;
        mediaUrl?: string;
        mediaType?: string;
      }) => {
        const { senderId, receiverId, text, mediaUrl, mediaType } = data;

        // Create message
        const message = await sendMessageService(senderId, receiverId, text!);

        // Emit to receiver if online
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket)
          io.to(receiverSocket).emit(SocketEvent.RECEIVE_MESSAGE, message);

        // Emit back to sender
        socket.emit(SocketEvent.RECEIVE_MESSAGE, message);
      }
    );

    // --- Load past messages ---
    socket.on(
      SocketEvent.LOAD_MESSAGES,
      async (data: { senderId: string; receiverId: string }) => {
        const { senderId, receiverId } = data;

        const conversation = await findOrCreateConversation(
          senderId,
          receiverId
        );

        const messages = await Message.find({
          conversation: conversation?._id!,
        }).sort({ createdAt: 1 });

        socket.emit(SocketEvent.LOAD_MESSAGES, messages);
      }
    );

    // --- Typing indicators ---
    const typingHandler =
      (event: SocketEvent.TYPING | SocketEvent.STOP_TYPING) =>
      ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) io.to(receiverSocket).emit(event, senderId);
      };

    socket.on(SocketEvent.TYPING, typingHandler(SocketEvent.TYPING));
    socket.on(SocketEvent.STOP_TYPING, typingHandler(SocketEvent.STOP_TYPING));

    socket.on(SocketEvent.LEAVE, async (userId: string) => {
      onlineUsers.delete(userId);
      socketToUser.delete(socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      console.log(`🔴 User left: ${userId}`);

      // Broadcast updated online users
      io.emit(SocketEvent.ONLINE_USERS, Array.from(onlineUsers.keys()));
    });

    // --- Handle disconnect ---
    socket.on("disconnect", async () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        socketToUser.delete(socket.id);

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Broadcast online users
        const online = Array.from(onlineUsers.keys());
        io.emit(SocketEvent.ONLINE_USERS, online);
      }
    });
  },
};
