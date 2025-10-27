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

  const count = lastMessage?.count ?? 0;
  const isActive = activeContact?._id === contact._id;

  useEffect(() => {
    if (!user?._id || !contact._id) return;
    socket.emit(SocketEvent.LOAD_LAST_MESSAGE_AND_COUNT, {
      otherUserId: contact._id,
      currentUserId: user._id,
    });
  }, [contact._id, user?._id]);

  return (
    <button
      onClick={() => setContact(contact)}
      className={`
        flex items-center gap-3 w-full px-3 py-2 rounded-md
        ${
          isActive
            ? "bg-blue-100"
            : count > 0
            ? "bg-blue-50"
            : "hover:bg-gray-100"
        }
      `}
    >
      {/* Avatar */}
      <img
        src={contact.avatar}
        className="w-10 h-10 rounded-full object-cover shrink-0"
        alt={contact.name}
      />

      {/* Main text */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className={count > 0 ? "font-semibold" : undefined}>
          {contact.name || contact.email}
        </span>

        {lastMessage?.text && (
          <span
            className={`text-xs truncate max-w-40 ${
              count > 0 ? "font-semibold text-black" : "text-gray-500"
            }`}
          >
            {lastMessage.text}
          </span>
        )}
      </div>

      {/* Right side status */}
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
