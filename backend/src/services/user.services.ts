import { User } from "../model/user";

export const userLoginService = async (email: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    return await User.create({
      email,
    });
  }

  return user;
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({
    email,
  });
};
