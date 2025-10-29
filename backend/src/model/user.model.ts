import mongoose, { Document, Schema, Model } from "mongoose";

export type Roles = "customer" | "seller";

export interface IUser extends Document {
  name?: string;
  email: string;

  avatar?: string;
  role: Roles;
  isOnline?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "seller"],
      default: "customer",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
