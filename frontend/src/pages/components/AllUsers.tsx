import { useUserStore } from "@/store/user";
import type { Message, User } from "@/types/types";
import axios from "axios";
import { useEffect, useState } from "react";
import { dbUrl } from "@/constants";
import { socket, SocketEvent } from "@/lib/socket";
import Contact from "./Contact";

const AllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastMap, setLastMap] = useState<
    Record<string, { text: string; count: number }>
  >({});
  const { user } = useUserStore();

  // --- Fetch all users except current user ---
  useEffect(() => {
    if (!user?._id || !user?.email) return;

    axios
      .get(`${dbUrl}/user/all`, { params: { email: user.email } })
      .then((res) => {
        const others = res.data.filter((u: User) => u._id !== user._id);
        setUsers(others);
      })
      .catch(console.error);
  }, [user?._id, user?.email]);

  // --- Listen for ONLINE_USERS ---
  useEffect(() => {
    const handleOnlineUsers = (onlineUsers: User[]) => {
      setUsers((prev) => {
        const updated = prev.map((u) => ({
          ...u,
          isOnline: onlineUsers.some((o) => o._id === u._id),
        }));
        onlineUsers.forEach((u) => {
          if (u._id !== user?._id && !updated.find((x) => x._id === u._id)) {
            updated.push({ ...u, isOnline: true });
          }
        });
        return updated;
      });
    };
    socket.on(SocketEvent.ONLINE_USERS, handleOnlineUsers);
    return () => {socket.off(SocketEvent.ONLINE_USERS, handleOnlineUsers);}
  }, [user?._id]);

  // --- GLOBAL listener: last message + unreadCount ---
  useEffect(() => {
    const handler = (data: {
      otherUserId: string;
      lastMessage: Message | null;
      unreadCount: number;
    }) => {
      setLastMap((prev) => ({
        ...prev,
        [data.otherUserId]: {
          text: data.lastMessage?.text || "",
          count: data.unreadCount,
        },
      }));
    };

    socket.on(SocketEvent.LOAD_LAST_MESSAGE_AND_COUNT, handler);
    return () => {socket.off(SocketEvent.LOAD_LAST_MESSAGE_AND_COUNT, handler);}
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold mb-2">Contacts</h2>
      <ul className="flex flex-col gap-1">
        {users.map((u) => (
          <li key={u._id}>
            <Contact contact={u} lastMessage={lastMap[u._id]} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllUsers;
