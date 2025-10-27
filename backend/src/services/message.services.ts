import { getObjectId } from "../lib/util";
import { Message, messageStatuses } from "../model/message.model";
import { findOrCreateConversation } from "./conversation.services";

export const sendMessageService = async (
  senderId: string,
  receiverId: string,
  text: string
) => {
  let conversation = await findOrCreateConversation(senderId, receiverId);

  return await Message.create({
    sender: getObjectId(senderId),
    receiver: getObjectId(receiverId),
    text,
    conversation: getObjectId(conversation?._id!),
  });
};

export const getConversationMessages = async (
  senderId: string,
  receiverId: string
) => {
  const conversation = await findOrCreateConversation(senderId, receiverId);
  if (!conversation) return { conversation: null, messages: [] };

  const messages = await Message.find({
    conversation: getObjectId(conversation._id),
  }).sort({ createdAt: 1 });

  return { conversation, messages };
};

export const createAndSendMessage = async (
  senderId: string,
  receiverId: string,
  text: string
) => {
  const conversation = await findOrCreateConversation(senderId, receiverId);
  if (!conversation) return null;

  const message = await sendMessageService(senderId, receiverId, text);

  return { conversationId: conversation._id!.toString(), message };
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
