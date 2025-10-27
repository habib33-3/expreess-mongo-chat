import { Request, Response } from "express";
import { createZegoTokenService } from "../services/zego.services";

export const createZegoTokenHandler = (req: Request, res: Response) => {
  const { userID, roomID } = req.body;
  const token = createZegoTokenService(userID, roomID);
  res.json({ token });
};
