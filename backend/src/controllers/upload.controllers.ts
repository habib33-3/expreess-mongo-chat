import { Request, Response } from "express";


export const uploadController = (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Construct public URL
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    return res.status(200).json({
      message: "File uploaded successfully",
      fileName: file.filename,   // uploaded file name
      fileType: file.mimetype,   // MIME type (e.g., 'image/png')
      fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
