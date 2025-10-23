import { useContactStore } from "@/store/chat";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

const ChatWindow = () => {
  const { contact } = useContactStore();

  if (!contact) {
    return (
      <div className="">
        <h1 className="text-center text-2xl">Please select a contact</h1>
      </div>
    );
  }

  return (
    <div>
      <ChatMessages />
      <ChatInput />
    </div>
  );
};

export default ChatWindow;
