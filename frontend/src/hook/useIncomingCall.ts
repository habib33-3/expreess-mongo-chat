import { useEffect } from "react";
import { socket, SocketEvent } from "@/lib/socket";
import { useNavigate } from "react-router";
import type { User } from "@/types/types";
import { useUserStore } from "@/store/user";

export const useIncomingCall = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  console.log("hh")

  useEffect(() => {
    if (!user) return;

    const handleCallReceive = ({
      caller,
      callLink,
    }: {
      caller: User;
      callLink: string;
    }) => {
      const accept = confirm(`${caller.name} is calling you. Accept?`);
      if (accept) {
        // Notify server
        socket.emit(SocketEvent.CALL_ACCEPT, {
          callee: { id: user._id, name: user.name },
          callerId: caller._id,
          callLink,
        });
        // Join call
        navigate(callLink, { state: { initiator: false, contact: caller } });
      } else {
        socket.emit(SocketEvent.CALL_DECLINE, {
          callee: { id: user._id, name: user.name },
          callerId: caller._id,
        });
      }
    };

    socket.on(SocketEvent.CALL_RECEIVE, handleCallReceive);
    return () => {
      socket.off(SocketEvent.CALL_RECEIVE, handleCallReceive);
    };
  }, [user, navigate]);
};
