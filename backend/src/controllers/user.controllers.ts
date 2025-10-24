import { Request, Response } from "express";
import { userLoginService, getAllUsersService, getOnlineUsers, setUserOffline } from "../services/user.services";
import { getIO } from "../lib/socket";
import { SocketEvent } from "../constants";

// Login or register user
export const userLoginHandler = async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const { user, isNew } = await userLoginService(email, role);

  // Emit updated online users if new
  const io = getIO();
  const onlineUsers = await getOnlineUsers();
  io.emit(SocketEvent.ONLINE_USERS, onlineUsers.map(u => u._id));

  res.json({ result: user });
};

// Get all users
export const getAllUsersHandler = async (req: Request, res: Response) => {
  const email = req.query.email as string;
  const users = await getAllUsersService(email);
  res.json(users);
};
