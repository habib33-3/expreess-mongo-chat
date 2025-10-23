import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { socket, SocketEvent } from "@/lib/socket";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { useState } from "react";

const ChatInput = () => {
  const [text, setText] = useState("");
  const { user } = useUserStore();
  const { contact } = useContactStore();

  const handleSendMessage = () => {
    socket.emit(SocketEvent.SEND_MESSAGE, {
      text,
      senderId: user?._id,
      receiverId: contact?._id,
    });
    setText("");
  };

  return (
    <div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={handleSendMessage}>Send</Button>
    </div>
  );
};

export default ChatInput;
