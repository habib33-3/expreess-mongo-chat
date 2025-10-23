import { useUserStore } from "@/store/user";
import { useNavigate } from "react-router";

const Chat = () => {
  const { user } = useUserStore();

  const navigate = useNavigate();

  if (!user) {
    navigate("/");
  }

  return <div>{user?.email}</div>;
};

export default Chat;
