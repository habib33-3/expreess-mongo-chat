import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";

const MessageBox = ({ message }: { message: Message }) => {
  const { user } = useUserStore();

  return (
    <div
      className={`flex ${
        message.sender === user?._id ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`p-2 rounded-lg max-w-xs wrap-break-word ${
          message.sender === user?._id
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

export default MessageBox;
