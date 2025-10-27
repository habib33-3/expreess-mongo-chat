import mongoose, { Schema, Document, Types, Model } from "mongoose";

export const messageStatuses = ["sent", "delivered", "read"] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  text?: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: Date;
  fileName: string;
  messageStatus?: MessageStatus;
}

const MessageSchema = new Schema<IMessage>({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: String,
  fileUrl: String,
  fileName: String,
  fileType: String,
  createdAt: { type: Date, default: Date.now },
  messageStatus: {
    type: String,
    enum: messageStatuses,
    default: messageStatuses[0],
  },
});


export const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);
