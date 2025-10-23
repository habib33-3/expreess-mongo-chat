import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;

  avatar?: string;
  role: "customer" | "seller";
  isOnline?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
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
