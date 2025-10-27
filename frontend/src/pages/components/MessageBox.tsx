import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";
import { useEffect } from "react";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();
  const isOwnMessage = message.sender === user?._id;
  const { text, fileName, fileType, fileUrl } = message;

  const renderFile = () => {
    if (!fileUrl) return null;

    // Image preview
    if (fileType?.startsWith("image/")) {
      return (
        <img
          src={fileUrl}
          alt={fileName}
          className="w-32 h-32 object-cover rounded"
        />
      );
    }

    // Other files: PDF, Word, Excel, PPT, txt
    const icon = (() => {
      if (!fileType) return "📄";
      if (fileType.includes("pdf")) return "📕";
      if (fileType.includes("word")) return "📘";
      if (fileType.includes("excel")) return "📗";
      if (fileType.includes("powerpoint")) return "📙";
      if (fileType.includes("text")) return "📄";
      return "📎";
    })();

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 underline"
      >
        <span>{icon}</span>
        <span className="truncate max-w-32">{fileName}</span>
      </a>
    );
  };

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
          ${
            isOwnMessage
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
          }
        `}
      >
        {text && <div>{text}</div>}

        {renderFile()}

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
