import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import axios from "axios";
import { socket, SocketEvent } from "@/lib/socket";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { dbUrl } from "@/constants";

const ChatInput = () => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserStore();
  const { contact } = useContactStore();

  // --- Generate preview ---
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // --- Handle send message (text or file + caption) ---
  const handleSendMessage = async () => {
    if (!text.trim() && !file) return;
    if (!user?._id || !contact?._id) return;

    setError(null);

    try {
      if (file) {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("senderId", user._id);
        formData.append("receiverId", contact._id);
        if (text.trim()) formData.append("caption", text.trim());

        const res = await axios.post(`${dbUrl}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
            );
            console.log("Upload progress:", percent, "%");
          },
        });

        if (!res.data?.success || !res.data?.data)
          throw new Error("Upload failed or invalid response.");

        // Automatically emit message (redundant safety)
        socket.emit(SocketEvent.SEND_MESSAGE, res.data.data);

        // Cleanup
        setFile(null);
        setPreviewUrl(null);
        setText("");
        setIsUploading(false);
        return;
      }

      // --- Text-only message ---
      socket.emit(SocketEvent.SEND_MESSAGE, {
        text: text.trim(),
        senderId: user._id,
        receiverId: contact._id,
      });

      setText("");
    } catch (err: any) {
      console.error("Message send error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error while sending message."
      );
      setIsUploading(false);
    }
  };

  // --- File preview renderer ---
  const renderPreview = () => {
    if (!file || !previewUrl) return null;
    const type = file.type.split("/")[0];

    if (type === "image")
      return <img src={previewUrl} alt="preview" className="max-h-32 rounded-md" />;
    if (type === "video")
      return <video src={previewUrl} controls className="max-h-32 rounded-md" />;
    if (file.type === "application/pdf")
      return (
        <iframe
          src={previewUrl}
          className="w-full h-40 border rounded-md"
          title="PDF Preview"
        />
      );
    return (
      <p className="p-2 bg-gray-200 rounded-md">
        📄 {file.name} (preview not available)
      </p>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {renderPreview()}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message or caption..."
          className="flex-1 resize-none"
          rows={2}
          disabled={isUploading}
        />

        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer p-2 hover:bg-gray-100 rounded-md"
        >
          📎
        </label>

        <Button onClick={handleSendMessage} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
