import { Router } from "express";
import { uploadController } from "../controllers/upload.controllers";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/", upload.single("file"), uploadController);

export const uploadRouter = router;
