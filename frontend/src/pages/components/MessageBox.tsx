import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();
  const { fileName, fileType, fileUrl, text } = message;

  const isOwnMessage = message.sender === user?._id;

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`p-2 rounded-lg max-w-xs wrap-break-word flex flex-col gap-2
          ${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
      >
        {/* Text Message */}
        {text && <div>{text}</div>}

        {/* File Preview */}
        {fileUrl && (
          <div className="flex flex-col gap-1">
            {fileType?.startsWith("image/") ? (
              <img
                src={fileUrl}
                alt={fileName}
                className="w-32 h-32 object-cover rounded"
              />
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline truncate ${
                  isOwnMessage ? "text-white" : "text-gray-800"
                }`}
              >
                {fileName || "Download file"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
