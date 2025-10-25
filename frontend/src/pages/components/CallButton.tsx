import { Button } from "@/components/ui/button";
import { socket, SocketEvent } from "@/lib/socket";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { PhoneCallIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";

const CallButton = () => {
  const { user } = useUserStore();
  const { contact } = useContactStore();
  const navigate = useNavigate();

  if (!contact || !user) return null;

  const generateCallLink = () => `/video-call/${uuidv4()}`;

  const handleCall = () => {
    const callLink = generateCallLink();

    socket.emit(SocketEvent.CALL_REQUEST, {
      caller: { id: user._id, name: user.name },
      calleeId: contact._id,
      callLink,
    });

    // Navigate only as initiator after the call is confirmed
    navigate(callLink, { state: { initiator: true, contact } });
  };

  return (
    <Button
      onClick={handleCall}
      variant="outline"
      className="rounded-full hover:bg-green-100"
      title={`Call ${contact.name}`}
    >
      <PhoneCallIcon className="w-5 h-5 text-green-600" />
    </Button>
  );
};

export default CallButton;
