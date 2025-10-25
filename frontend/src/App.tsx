import axios from "axios";
import { useState } from "react";
import { dbUrl, roles } from "./constants";
import { useUserStore } from "./store/user";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

const App = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(""); 
  const navigate = useNavigate();

  const { setUser, user } = useUserStore();

  if (user) {
    navigate("/chat");
  }

  const handleSubmit = async () => {
    try {
      if (!role) {
      alert("Please select a role!");
      return;
    }

    const res = await axios.post(`${dbUrl}/user/login`, { email, role });
    console.log(res);
    setUser(res.data.result);
    } catch (error) {
      alert(error);
    }
    
  };

  return (
    <div className="max-w-7xl mx-auto bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="p-4 bg-white max-w-3xl mx-auto">
        <Input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2"
        />

        <Select
          value={role}
          onValueChange={setRole}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem
                key={role}
                value={role}
              >
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleSubmit}
          className="px-2 py-4 mt-2"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default App;
