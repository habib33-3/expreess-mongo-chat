import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";
import { useNavigate } from "react-router";
import AllUsers from "./components/AllUsers";
import { useEffect } from "react";
import { socket, SocketEvent } from "@/lib/socket";
import ChatWindow from "./components/ChatWindow";

const Chat = () => {
  const { user, resetUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const handleConnect = () => {
      console.log("Emitting JOIN for user:", user._id);
      socket.emit(SocketEvent.JOIN, user._id);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.once("connect", handleConnect);
    }

    return () => {
      if (socket.connected) {
        console.log("Emitting LEAVE for user:", user._id);
        socket.emit(SocketEvent.LEAVE, user._id);
      }
    };
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="flex items-center justify-evenly mx-auto fixed top-0 left-0 right-0 bg-white p-4 shadow">
        <div>
          <h2 className="text-2xl font-bold">User: {user.email}</h2>
          <h2 className="text-2xl font-bold">Role: {user.role}</h2>
        </div>
        <div>
          <Button onClick={resetUser}>Logout</Button>
        </div>
      </div>

      <div className="flex">
        <div className="pt-28 w-full">
          <AllUsers />
        </div>
        <div className="">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Chat;
