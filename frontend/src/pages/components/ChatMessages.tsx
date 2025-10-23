import { socket, SocketEvent } from "@/lib/socket";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import type { Message } from "@/types/types";
import { useEffect, useState } from "react";

const ChatMessages = () => {
  const { user } = useUserStore();
  const { contact } = useContactStore();

  const [messages,setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user?._id || !contact?._id) return;

    socket.emit(SocketEvent.LOAD_MESSAGES, {
      senderId: user._id,
      receiverId: contact._id,
    });

    const handleMessages = (messages: Message[]) => {
      setMessages(messages);
    };

    socket.on(SocketEvent.LOAD_MESSAGES, handleMessages);

    return () => {
      socket.off(SocketEvent.LOAD_MESSAGES, handleMessages);
    };
  }, [contact?._id, user?._id]);

  return <div>
    {messages.map((message) => (
      <div key={message._id}>
        <strong>{message.senderId === user?._id ? "You" : contact?.name}</strong>: {message.text}
      </div>
    ))}
  </div>;
};

export default ChatMessages;
