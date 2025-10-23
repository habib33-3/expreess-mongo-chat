import asyncHandler from "express-async-handler";
import { userLoginService } from "../services/user.services";
import { Request, Response } from "express";

export const userLoginHandler=async (req:Request,res:Response)=>{
  const {email}=req.body


  const result=await userLoginService(email)

  return res.send({
    result
  })
}