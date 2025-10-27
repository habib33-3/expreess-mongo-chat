import type { Role } from "@/constants";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isOnline: boolean;
  avatar?: string;
};

export type Message = {
  _id: string;
  sender: string;
  text: string;
  receiver: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  messageStatus?: "sent" | "delivered" | "read";
};
