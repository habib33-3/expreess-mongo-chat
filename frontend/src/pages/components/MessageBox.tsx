import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";
import { useEffect } from "react";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();
  const isOwnMessage = message.sender === user?._id;

  useEffect(() => {
    document
      .getElementById(`message-${message._id}`)
      ?.scrollIntoView({ behavior: "smooth" });
  }, [message._id]);

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

        {isOwnMessage && message.messageStatus && (
          <div className="text-xs text-gray-300 self-end">
            {message.messageStatus === "sent" && "✓ Sent"}
            {message.messageStatus === "delivered" && "✓ Delivered"}
            {message.messageStatus === "read" && "✓ Read"}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
