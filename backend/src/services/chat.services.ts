// chat.services.ts

import { Server } from "socket.io";
import { getObjectId } from "../lib/util";
import { Message, messageStatuses } from "../model/message.model";
import { User } from "../model/user.model";
import { findOrCreateConversation } from "./conversation.services";
import { SocketEvent } from "../constants";
import { Conversation } from "../model/conversation.model";

export const userJoinService = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { isOnline: true });
};

export const userLeaveService = async (userId: string) => {
  await User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen: new Date(),
  });
};

export const loadConversationMessagesService = async (
  senderId: string,
  receiverId: string
) => {
  const conversation = await findOrCreateConversation(senderId, receiverId);
  if (!conversation) return null;

  const messages = await Message.find({
    conversation: getObjectId(conversation._id),
  }).sort({ createdAt: 1 });

  return { conversation, messages };
};

export const sendMessageServiceLayer = async (
  io: Server,
  senderId: string,
  receiverId: string,
  text: string,
  fileName: string,
  fileType: string,
  fileUrl: string
) => {
  if (!text && !fileUrl) return null;

  const conversation = await findOrCreateConversation(senderId, receiverId);
  if (!conversation) return null;

  const message = await Message.create({
    sender: getObjectId(senderId),
    receiver: getObjectId(receiverId),
    text,
    conversation: getObjectId(conversation._id),
    fileName,
    fileType,
    fileUrl,
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id,
  });

  const roomId = conversation._id!.toString();
  io.to(roomId).emit(SocketEvent.RECEIVE_MESSAGE, message);

  return { conversation, message };
};

export const handleTypingService = (
  io: Server,
  event: "typing" | "stop_typing",
  senderId: string,
  receiverId: string
) => {
  const conversationId = [senderId, receiverId].sort().join("_");
  io.to(conversationId).emit(event, senderId);
};

export const markDeliveredService = async (messageId: string) => {
  return Message.findByIdAndUpdate(
    messageId,
    { messageStatus: messageStatuses[1] },
    { new: true }
  );
};

export const markSeenService = async (messageId: string) => {
  return Message.findByIdAndUpdate(
    messageId,
    { messageStatus: messageStatuses[2] },
    { new: true }
  );
};
