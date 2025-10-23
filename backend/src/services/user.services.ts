import { Roles, User } from "../model/user.model";

export const userLoginService = async (email: string, role: Roles) => {
  const user = await findUserByEmail(email);

  const generatedName = email.split("@")[0];

  if (!user) {
    return await User.create({
      email,
      role,
      name: generatedName,
    });
  }

  return user;
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({
    email,
  });
};

// // assuming only one seller
// export const findSeller = async () => {
//   return await User.findOne({
//     role: "seller",
//   });
// };

export const getAllUsersService = async (email: string) => {
  return await User.find({
    email: { $ne: email },
  });
};

export const setUserOnline = async (userId: string) => {
  return User.findByIdAndUpdate(userId, { isOnline: true });
};

export const setUserOffline = async (userId: string) => {
  return User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen: new Date(),
  });
};
