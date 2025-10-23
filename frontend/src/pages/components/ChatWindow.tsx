import { useContactStore } from "@/store/chat";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

const ChatWindow = () => {
  const { contact } = useContactStore();

  if (!contact)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <h1 className="text-xl">Select a contact to start chatting</h1>
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-gray-200 p-2 font-semibold text-gray-700">
        {contact.email}
      </header>
      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-md shadow-inner">
        <ChatMessages />
      </div>
      <div className="mt-2">
        <ChatInput />
      </div>
    </div>
  );
};

export default ChatWindow;
