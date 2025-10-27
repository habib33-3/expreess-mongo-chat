import { socket, SocketEvent } from "@/lib/socket";
import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";
import { useEffect, useRef } from "react";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();
  const isOwnMessage = message.sender === user?._id;
  const seenSentRef = useRef(false);

  useEffect(() => {
    // Scroll into view
    document
      .getElementById(`message-${message._id}`)
      ?.scrollIntoView({ behavior: "smooth" });

    // Mark as seen ONCE if not my message
    if (!isOwnMessage && !seenSentRef.current) {
      seenSentRef.current = true;
      socket.emit(SocketEvent.MESSAGE_SEEN, {
        messageId: message._id,
        receiverId: user?._id,
      });
    }
  }, [isOwnMessage, message._id, user?._id]);

  console.log(message)

  return (
    <div
      id={`message-${message._id}`}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} my-1`}
    >
      <div
        className={`p-2 rounded-lg max-w-xs wrap-break-word flex flex-col gap-2
          ${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}
        `}
      >
        {message.text && <div>{message.text}</div>}
        {
          message.messageStatus && isOwnMessage && (
            <div className="text-xs text-gray-300 self-end">
              {message.messageStatus === "sent" && "✓ Sent"}
              {message.messageStatus === "delivered" && "✓ Delivered"}
              {message.messageStatus === "read" && "✓ Read"}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default MessageBox;
