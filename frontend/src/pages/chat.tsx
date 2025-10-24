import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";
import { useNavigate } from "react-router";
import AllUsers from "./components/AllUsers";
import { useEffect } from "react";
import { socket, SocketEvent } from "@/lib/socket";
import ChatWindow from "./components/ChatWindow";
import { useIncomingCall } from "@/hook/useIncomingCall";

const Chat = () => {
  const { user, resetUser } = useUserStore();
  const navigate = useNavigate();

  useIncomingCall()

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const handleConnect = () => {
      socket.emit(SocketEvent.JOIN, user._id);
    };

    if (socket.connected) handleConnect();
    else socket.once("connect", handleConnect);

    return () => {
      if (socket.connected) socket.emit(SocketEvent.LEAVE, user._id);
    };
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold">{user.email}</h2>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
        <Button variant="destructive" onClick={resetUser}>
          Logout
        </Button>
      </header>

      {/* Main Chat Layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* User List */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <AllUsers />
        </aside>

        {/* Chat Window */}
        <section className="flex-1 flex flex-col p-4 bg-gray-50">
          <ChatWindow />
        </section>
      </main>
    </div>
  );
};

export default Chat;
