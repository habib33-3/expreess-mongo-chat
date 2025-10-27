import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import type { User } from "@/types/types";
import axios from "axios";
import { useEffect, useState } from "react";
import { dbUrl } from "@/constants";
import { socket, SocketEvent } from "@/lib/socket";

const AllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useUserStore();
  const { contact, setContact } = useContactStore();

  // --- Fetch all users except current user ---
  useEffect(() => {
    if (!user?._id || !user?.email) return;

    axios
      .get(`${dbUrl}/user/all`, { params: { email: user.email } })
      .then((res) => {
        // 🔥 Filter out current user
        const others = res.data.filter((u: User) => u._id !== user._id);
        setUsers(others);
      })
      .catch(console.error);
  }, [user?._id, user?.email]);

  // --- Listen for online users ---
  useEffect(() => {
    const handleOnlineUsers = (onlineUsers: User[]) => {
      setUsers((prev) => {
        const updated = prev.map((u) => ({
          ...u,
          isOnline: onlineUsers.some((o) => o._id === u._id),
        }));

        // add any new online users (excluding self)
        onlineUsers.forEach((u) => {
          if (u._id !== user?._id && !updated.find((x) => x._id === u._id)) {
            updated.push({ ...u, isOnline: true });
          }
        });

        return updated;
      });
    };

    socket.on(SocketEvent.ONLINE_USERS, handleOnlineUsers);

    return () => {
      socket.off(SocketEvent.ONLINE_USERS, handleOnlineUsers);
    };
  }, [user?._id]);

  // --- Render UI ---
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold mb-2">Contacts</h2>
      <ul className="flex flex-col gap-1">
        {users.map((u) => (
          <li key={u._id}>
            <button
              onClick={() => setContact(u)}
              className={`flex justify-between items-center w-full px-3 py-2 rounded-md ${
                u._id === contact?._id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <span>{u.email}</span>
              <span
                className={`text-sm ${
                  u.isOnline ? "text-green-500" : "text-gray-400"
                }`}
              >
                ● {u.isOnline ? "Online" : "Offline"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllUsers;
