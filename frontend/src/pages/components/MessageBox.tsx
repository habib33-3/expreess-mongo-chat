import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();
  const { text, fileName, fileType, fileUrl } = message;
  const isOwnMessage = message.sender === user?._id;

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
        className="flex items-center gap-1 underline text-sm truncate max-w-xs"
      >
        <span>{icon}</span>
        <span>{fileName || "Download file"}</span>
      </a>
    );
  };

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} my-1`}
    >
      <div
        className={`p-2 rounded-lg max-w-xs wrap-break-word flex flex-col gap-2
          ${
            isOwnMessage
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
      >
        {/* Text */}
        {text && <div>{text}</div>}

        {/* File */}
        {renderFile()}
      </div>
    </div>
  );
};

export default MessageBox;
