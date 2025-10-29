import { Router } from "express";
import { createZegoTokenHandler } from "../controllers/zego.controllers";

const router=Router()

router.post('/token',createZegoTokenHandler)


export const zegoRoutes = router;