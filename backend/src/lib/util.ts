import { Types } from "mongoose";

export const getObjectId = (id: string|unknown): Types.ObjectId =>
  new Types.ObjectId(id as string);
