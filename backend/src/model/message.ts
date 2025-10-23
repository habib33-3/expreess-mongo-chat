import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
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
  mediaUrl: String,
  mediaType: String,
  createdAt: { type: Date, default: Date.now },
});

export const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);
