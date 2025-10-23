import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { socket, SocketEvent } from "@/lib/socket";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";

const ChatInput = () => {
  const [text, setText] = useState("");
  const { user } = useUserStore();
  const { contact } = useContactStore();

  const handleSendMessage = () => {
    if (!text.trim() || !user?._id || !contact?._id) return;

    socket.emit(SocketEvent.SEND_MESSAGE, {
      text,
      senderId: user._id,
      receiverId: contact._id,
    });
    setText("");
  };

  return (
    <div className="flex gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 resize-none"
        rows={2}
      />
      <Button onClick={handleSendMessage} className="self-end">
        Send
      </Button>
    </div>
  );
};

export default ChatInput;
