import { Router } from "express";
import { userLoginHandler } from "../controllers/user.controllers";

const router = Router();

router.post("/login", userLoginHandler);

export const userRouter = router;
