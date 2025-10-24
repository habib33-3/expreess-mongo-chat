import type { Role } from "@/constants";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isOnline: boolean;
};

export type Message = {
  _id: string;
  sender: string;
  text: string;
  receiver: string;
  mediaUrl?: string;
  mediaType?: string;
};
