import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { socket, SocketEvent } from "@/lib/socket";
import type { Message } from "@/types/types";
import { useEffect, useState } from "react";
import MessageBox from "./MessageBox";

const ChatMessages = () => {
  const { user } = useUserStore();
  const { contact } = useContactStore();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user?._id || !contact?._id) return;

    // --- Load chat history and join conversation room ---
    socket.emit(SocketEvent.LOAD_MESSAGES, {
      senderId: user._id,
      receiverId: contact._id,
    });

    const handleLoadMessages = (msgs: Message[]) => setMessages(msgs);

    const handleReceiveMessage = (msg: Message) => {
      // Simply append the message — backend ensures it's for this conversation
      setMessages((prev) => [...prev, msg]);
    };

    // --- Register socket listeners ---
    socket.on(SocketEvent.LOAD_MESSAGES, handleLoadMessages);
    socket.on(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage);

    // --- Cleanup ---
    return () => {
      socket.off(SocketEvent.LOAD_MESSAGES, handleLoadMessages);
      socket.off(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage);
    };
  }, [contact?._id, user?._id]);

  console.log(messages);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] p-2">
      {messages.map((msg) => (
        <MessageBox
          message={msg}
          key={msg._id}
        />
      ))}
    </div>
  );
};

export default ChatMessages;
