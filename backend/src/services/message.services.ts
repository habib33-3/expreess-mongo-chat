import { getObjectId } from "../lib/util";
import { Message } from "../model/message.model";
import { findOrCreateConversation } from "./conversation.services";

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

export const sendMessageService = async (
  senderId: string,
  receiverId: string,
  text: string,
  fileUrl?: string
) => {
  const conversation = await findOrCreateConversation(senderId, receiverId);

console.log(fileUrl)

  return await Message.create({
    sender: getObjectId(senderId),
    receiver: getObjectId(receiverId),
    conversation: conversation?._id,
    text,
    fileUrl,
  });
};
