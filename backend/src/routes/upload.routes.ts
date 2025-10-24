import { Router } from "express";
import { upload } from "../middlewares/upload";
import { uploadController } from "../controllers/upload.controllers";

const router = Router();

router.post("/", upload.single("file"), uploadController);

export const uploadRouter = router;

