import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useContactStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { socket, SocketEvent } from "@/lib/socket";
import axios from "axios";
import { dbUrl } from "@/constants";

const ChatInput = () => {
  const { user } = useUserStore();
  const { contact } = useContactStore();

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSendMessage = async () => {
    if (!text.trim() && !file) return;
    if (!user?._id || !contact?._id) return;

    let fileData: {
      fileName?: string;
      fileType?: string;
      fileUrl?: string;
    } | null = null;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        setUploading(true);
        const res = await axios.post(`${dbUrl}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileData = res.data; // Expecting { fileName, fileType, fileUrl }
      } catch (err) {
        console.error("File upload failed:", err);
        setError("File upload failed. Try again.");
        return;
      } finally {
        setUploading(false);
      }
    }

    const { fileName, fileType, fileUrl } = fileData || {};

    try {
      socket.emit(SocketEvent.SEND_MESSAGE, {
        text: text.trim(),
        fileName,
        fileType,
        fileUrl,
        senderId: user._id,
        receiverId: contact._id,
      });

      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Message send failed:", err);
      setError("Message sending failed. Try again.");
    }
  };

  const renderFilePreview = () => {
    if (!file) return null;

    // Images: show preview
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-16 h-16 object-cover rounded"
        />
      );
    }

    // Other files: show icon + filename
    return (
      <a
        href={URL.createObjectURL(file)}
        download={file.name}
        className="underline truncate text-sm text-gray-800"
      >
        {file.name}
      </a>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Error */}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {/* File Preview */}
      {file && (
        <div className="flex items-center gap-2 border p-2 rounded bg-gray-100">
          {renderFilePreview()}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Remove
          </Button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 resize-none"
          rows={2}
          disabled={uploading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
          accept=".jpg,.jpeg,.png,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        />
        <Button
          onClick={handleSendMessage}
          disabled={uploading || (!text.trim() && !file)}
        >
          {uploading ? "Uploading..." : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
