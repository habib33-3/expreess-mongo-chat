import { Router } from "express";
import { getAllUsersHandler, userLoginHandler } from "../controllers/user.controllers";


const router = Router();

router.post("/login", userLoginHandler);

router.get("/all", getAllUsersHandler);

export const userRouter = router;
