import { socket, SocketEvent } from "@/lib/socket";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import type { User } from "@/types/types";

import { useEffect } from "react";

type Props = {
  contact: User;
  lastMessage?: { text: string; count: number };
  messageStatus?: "sent" | "delivered" | "read";
};

const Contact = ({ contact, lastMessage }: Props) => {
  const { setContact, contact: activeContact } = useContactStore();
  const { user } = useUserStore();

  console.log("Rendering Contact:", contact.email);
  console.log("lastMessage:", lastMessage);

  // Emit when mounting / contact changes
  useEffect(() => {
    if (!user?._id || !contact._id) return;
    socket.emit(SocketEvent.LOAD_LAST_MESSAGE_AND_COUNT, {
      otherUserId: contact._id,
      currentUserId: user._id,
    });
  }, [contact._id, user?._id]);

  const count = lastMessage?.count ?? 0;

  return (
    <button
      onClick={() => setContact(contact)}
      className={`flex justify-between items-center w-full px-3 py-2 rounded-md
    ${
      activeContact?._id === contact._id
        ? "bg-blue-100"
        : count > 0
        ? "bg-blue-50" // ← NEW: unread highlight
        : "hover:bg-gray-100"
    }`}
    >
      <div className="flex flex-col text-left">
        <span className={count > 0 ? "font-semibold" : undefined}>
          {contact.email}
        </span>

        {lastMessage?.text && (
          <span
            className={`text-xs truncate max-w-[140px] ${
              count > 0 ? "font-semibold text-black" : "text-gray-500"
            }`}
          >
            {lastMessage.text}
          </span>
        )}
      </div>

      <div className="flex flex-col items-end">
        <span
          className={`text-sm ${
            contact.isOnline ? "text-green-500" : "text-gray-400"
          }`}
        >
          ● {contact.isOnline ? "Online" : "Offline"}
        </span>
        {count > 0 && (
          <span className="text-xs bg-blue-500 text-white px-2 rounded-full mt-1">
            {count}
          </span>
        )}
      </div>
    </button>
  );
};

export default Contact;
