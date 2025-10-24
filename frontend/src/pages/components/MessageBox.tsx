import { dbUrl } from "@/constants";
import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();
  const isOwn = message.sender === user?._id;


  console.log(message);

  const renderMedia = () => {
    if (!message.mediaUrl) return null;
    const src = `${dbUrl}${message.mediaUrl}`;
    const type = message.mediaType;

    if (type === "image")
      return <img src={src} alt="sent media" className="max-w-xs rounded-lg mb-1" />;
    if (type === "video")
      return <video src={src} controls className="max-w-xs rounded-lg mb-1" />;
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-sm text-blue-600 mb-1"
      >
        📎 {message.mediaUrl.split("/").pop()}
      </a>
    );
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 rounded-lg max-w-xs wrap-break-word ${
          isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {renderMedia()}
        {message.text && <p className="whitespace-pre-line">{message.text}</p>}
      </div>
    </div>
  );
};

export default MessageBox;
