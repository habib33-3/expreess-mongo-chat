import { Conversation } from "../model/conversation";
import { getObjectId } from "../lib/util";
import { Types } from "mongoose";

export const findOrCreateConversation = async (userId1: string, userId2: string) => {
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
