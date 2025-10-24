import { Request, Response } from "express";
import path from "path";
import { sendMessageService } from "../services/message.services";
import { getIO } from "../lib/socket";


export const uploadController = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, caption } = req.body;

    const io=getIO()

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      text: caption || "",
      fileUrl,
    };

    // Save to DB
    const savedMessage = await sendMessageService(
      senderId,
      receiverId,
      caption || "",
      fileUrl
    );

    // Emit message in real-time
    io.to(receiverId).emit("new_message", savedMessage);

    return res.status(200).json({
      success: true,
      message: "File uploaded and message sent successfully",
      data: savedMessage,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
