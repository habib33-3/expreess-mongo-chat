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

    // load history
    socket.emit(SocketEvent.LOAD_MESSAGES, {
      senderId: user._id,
      receiverId: contact._id,
    });

    const handleLoadMessages = (msgs: Message[]) => {
      setMessages(msgs);

      // auto mark seen for all incoming un-read messages
      msgs.forEach((m) => {
        if (m.sender !== user._id && m.messageStatus !== "read") {
          socket.emit(SocketEvent.MESSAGE_SEEN, {
            messageId: m._id,
            receiverId: user._id,
          });
        }
      });
    };

    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);

      if (msg.sender !== user._id) {
        socket.emit(SocketEvent.MESSAGE_DELIVERED, {
          messageId: msg._id,
          receiverId: user._id,
        });
      }
    };

    const handleDelivered = (updated: Message) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === updated._id
            ? { ...m, messageStatus: updated.messageStatus }
            : m
        )
      );
    };

    const handleSeen = (updated: Message) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === updated._id
            ? { ...m, messageStatus: updated.messageStatus }
            : m
        )
      );
    };

    socket.on(SocketEvent.LOAD_MESSAGES, handleLoadMessages);
    socket.on(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SocketEvent.MESSAGE_DELIVERED, handleDelivered);
    socket.on(SocketEvent.MESSAGE_SEEN, handleSeen);

    return () => {
      socket.off(SocketEvent.LOAD_MESSAGES, handleLoadMessages);
      socket.off(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SocketEvent.MESSAGE_DELIVERED, handleDelivered);
      socket.off(SocketEvent.MESSAGE_SEEN, handleSeen);
    };
  }, [contact?._id, user?._id]);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-2">
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
