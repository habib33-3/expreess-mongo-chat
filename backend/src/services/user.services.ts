import { Roles, User } from "../model/user";

export const userLoginService = async (email: string, role: Roles) => {
  const user = await findUserByEmail(email);

  if (!user) {
    return await User.create({
      email,
      role,
    });
  }

  return user;
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({
    email,
  });
};

// assuming only one seller
export const findSeller = async () => {
  return await User.findOne({
    role: "seller",
  });
};

export const getAllUsersService = async (email: string) => {
  return await User.find({
    email: { $ne: email },
  });
};
