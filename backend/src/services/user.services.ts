import { User, Roles } from "../model/user.model";

// Login or register a user
export const userLoginService = async (email: string, role: Roles) => {
  let user = await User.findOne({ email });
  const generatedName = email.split("@")[0];

  if (!user) {
    const newUser = await User.create({
      email,
      role,
      name: generatedName,
      isOnline: true, // mark online immediately
    });
    return { user: newUser, isNew: true };
  }

  // Mark existing user online
  await User.findByIdAndUpdate(user._id, { isOnline: true });
  user = await User.findById(user._id);
  return { user, isNew: false };
};

// Get all users except current user
export const getAllUsersService = async (email: string) => {
  return await User.find({ email: { $ne: email } });
};

// Set user offline
export const setUserOffline = async (userId: string) => {
  return User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
};

// Get all online users (for emitting)
export const getOnlineUsers = async () => {
  return await User.find({ isOnline: true });
};
