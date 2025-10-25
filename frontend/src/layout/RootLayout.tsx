import { useIncomingCall } from "@/hook/useIncomingCall";
import { socket, SocketEvent } from "@/lib/socket";
import { useUserStore } from "@/store/user";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";


const RootLayout = () => {

 const navigate = useNavigate();

  const { user,  } = useUserStore();

  useIncomingCall()

  useEffect(() => {
    if (!user) {
      navigate("/login");
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

    return (
        <div>
            <Outlet/>
        </div>
    );
};

export default RootLayout;