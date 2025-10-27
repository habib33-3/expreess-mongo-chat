import { Conversation } from "../model/conversation.model";
import { getObjectId } from "../lib/util";
import { Types } from "mongoose";
import { Message } from "../model/message.model";

export const findOrCreateConversation = async (
  userId1: string,
  userId2: string
) => {
  const [id1, id2] = [getObjectId(userId1), getObjectId(userId2)].sort();

  // Index-aligned query
  const existing = await Conversation.findOne({
    participants: [id1, id2],
  });

  if (existing) return existing;

  try {
    // Attempt to create new
    return await Conversation.create({
      participants: [id1, id2],
    });
  } catch (err: any) {
    // Handle concurrency race: if another process created it simultaneously
    if (err.code === 11000) {
      return await Conversation.findOne({ participants: [id1, id2] });
    }
    throw err;
  }
};

export const getLastMessageInConversationAndCount = async (
  otherUserId: string,
  currentUserId: string
) => {
  const [id1, id2] = [getObjectId(otherUserId), getObjectId(currentUserId)].sort();

  // --- do NOT create if not exists ---
  const conversation = await Conversation.findOne({
    participants: [id1, id2],
  }).lean();

  if (!conversation) {
    return { lastMessage: null, unreadCount: 0 };
  }

  // --- populate lastMessage directly ---
  const lastMessage = conversation.lastMessage
    ? await Message.findById(conversation.lastMessage).lean()
    : null;

  // --- unread = messages sent BY otherUser TO currentUser ---
  const unreadCount = await Message.countDocuments({
    conversation: conversation._id,
    sender: id1,                     // messages from other user
    receiver: id2,                   // to current user
    messageStatus: { $in: ["sent", "delivered"] },
  });

  return { lastMessage, unreadCount };
};
