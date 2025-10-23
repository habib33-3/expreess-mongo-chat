import { getObjectId } from "../lib/util";
import { Message } from "../model/message";
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
