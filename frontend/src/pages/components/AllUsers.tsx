import { Button } from "@/components/ui/button";
import { dbUrl } from "@/constants";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import type { User } from "@/types/types";
import axios from "axios";
import { useEffect, useState } from "react";
import { socket, SocketEvent } from "@/lib/socket";

const AllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useUserStore();
  const { setContact, contact } = useContactStore();

  // --- Initial fetch ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${dbUrl}/user/all`, {
          params: { email: user?.email },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (user?.email) fetchUsers();
  }, [user?.email]);

  // --- Live online updates ---
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Join the chat server
    socket.emit(SocketEvent.JOIN, user._id);

    // Listen for online users list from server
    socket.on(SocketEvent.ONLINE_USERS, (onlineIds: string[]) => {
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isOnline: onlineIds.includes(u._id),
        }))
      );
    });

    // Cleanup on unmount
    return () => {
      socket.emit(SocketEvent.LEAVE, user._id);
      socket.off(SocketEvent.ONLINE_USERS);
    };
  }, [user?._id]);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-2">All Users</h2>
      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <Button
            key={u._id}
            onClick={() => setContact(u)}
            className={`flex justify-between w-full ${
              u._id === contact?._id ? "bg-gray-200" : ""
            }`}
          >
            <li>{u.email}</li>
            {u.isOnline ? (
              <span className="text-green-500">●</span>
            ) : (
              <span className="text-gray-400">○</span>
            )}
          </Button>
        ))}
      </ul>
    </div>
  );
};

export default AllUsers;
