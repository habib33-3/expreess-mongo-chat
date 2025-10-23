import asyncHandler from "express-async-handler";
import {
  getAllUsersService,
  userLoginService,
} from "../services/user.services";
import { Request, Response } from "express";

export const userLoginHandler = async (req: Request, res: Response) => {
  const { email, role } = req.body;

  const result = await userLoginService(email, role);

  return res.send({
    result,
  });
};

export const getAllUsersHandler = async (req: Request, res: Response) => {
  const email = req.query.email as string;

  const result = await getAllUsersService(email);
  return res.send(result);
};
