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

  // Initial fetch
  useEffect(() => {
    if (!user?.email) return;
    axios
      .get(`${dbUrl}/user/all`, { params: { email: user.email } })
      .then((res) => setUsers(res.data))
      .catch(console.error);
  }, [user?.email]);

  // Listen for online users
  useEffect(() => {
    const handleOnlineUsers = (onlineUsers: User[]) => {
      setUsers((prev) => {
        const updated = prev.map((u) => ({
          ...u,
          isOnline: onlineUsers.some((o) => o._id === u._id),
        }));

        onlineUsers.forEach((u) => {
          if (!updated.find((x) => x._id === u._id)) {
            updated.push(u);
          }
        });

        return updated;
      });
    };

    socket.on(SocketEvent.ONLINE_USERS, handleOnlineUsers);

    return () => {
      socket.off(SocketEvent.ONLINE_USERS, handleOnlineUsers);
    };
  }, [users.length]);

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
