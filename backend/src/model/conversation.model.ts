import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  createdAt: Date;
  lastMessage?: Types.ObjectId;
}

const ConversationSchema = new Schema<IConversation>({
  participants: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    required: true,
    validate: [
      (val: Types.ObjectId[]) => val.length === 2,
      "Must have exactly 2 participants",
    ],
  },
  createdAt: { type: Date, default: Date.now },
  lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
});

ConversationSchema.pre("save", function (next) {
  this.participants.sort();
  next();
});

ConversationSchema.index(
  { "participants.0": 1, "participants.1": 1 },
  { unique: true }
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
