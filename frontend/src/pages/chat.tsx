import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";
import AllUsers from "./components/AllUsers";

import ChatWindow from "./components/ChatWindow";

const Chat = () => {
  const { user, resetUser } = useUserStore();

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold">{user.email}</h2>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
        <Button
          variant="destructive"
          onClick={resetUser}
        >
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
