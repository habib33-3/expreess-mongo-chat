/* eslint-disable @typescript-eslint/no-explicit-any */
import{ useCallback, useEffect, useRef, useState } from "react";
import { socket, SocketEvent } from "@/lib/socket";
import { useUserStore } from "@/store/user";
import axios from "axios";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { dbUrl } from "@/constants";

const BroadcasterZego = () => {
  const { user } = useUserStore();
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [streamLink, setStreamLink] = useState("");
  const [viewers, setViewers] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const zegoContainerRef = useRef<HTMLDivElement | null>(null);
  const zegoKitRef = useRef<any>(null);
  const roomIdRef = useRef<string>("my-stream-room"); // change as needed

  // Cleanup Zego kit
  const cleanupZego = () => {
    try {
      if (zegoKitRef.current) {
        // leave room and destroy kit instance
        zegoKitRef.current.destroy(); // recommended to cleanup; method exists in prebuilt
        zegoKitRef.current = null;
      }
    } catch (e) {
      console.warn("Zego cleanup error", e);
    }
  };

  const startStreaming = async () => {
    if (!user) return alert("User not found");
    try {
      // 1) Ask server to create a stream record and return a public share link (optional)
      // Server should emit START_STREAMING_ACK via socket or return link here.
      // We'll emit socket START_STREAMING and wait for ack for streamLink.
      socket.emit(SocketEvent.START_STREAMING, {
        roomId: roomIdRef.current,
        userId: user._id,
        title,
        thumbnailUrl: thumbnail,
      });

      // 2) Request Zego kit token from server
      const { data } = await axios.post(`${dbUrl}/zego/token`, {
        userID: user._id,
        roomID: roomIdRef.current,
      });
      const kitToken = data.token;

      // 3) Create Zego UIKit prebuilt instance with the returned kit token
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoKitRef.current = zp;

      // 4) Join as Host (publishes AV automatically)
      zp.joinRoom({
        container: zegoContainerRef.current,
        scenario: { mode: ZegoUIKitPrebuilt.LiveStreaming },
      
        showUserList: false,
        showScreenSharingButton: true,
        // additional config as needed
      });

      setIsStreaming(true);
      console.log("🎥 Zego host joined room:", roomIdRef.current);
    } catch (err) {
      console.error("startStreaming error", err);
      alert("Failed to start streaming (check server/token).");
    }
  };

  const stopStreaming = useCallback(() => {
    // notify server
    socket.emit(SocketEvent.LEAVE, { roomId: roomIdRef.current, userId: user?._id });
    // cleanup zego
    cleanupZego();
    setIsStreaming(false);
    setStreamLink("");
    setViewers([]);
    console.log("🛑 Stopped streaming");
  },[user?._id]);

  useEffect(() => {
    // socket listeners for business events (same names you already used)
    const onStartAck = ({ success, link }: { success: boolean; link?: string }) => {
      if (!success) {
        alert("Server failed to start stream");
        stopStreaming();
        return;
      }
      if (link) setStreamLink(link);
      console.log("✅ Server accepted start, link:", link);
    };

    const onNewViewer = ({  viewerSocketId }: { viewerId: string; viewerSocketId: string }) => {
      setViewers((prev) => {
        if (prev.includes(viewerSocketId)) return prev;
        return [...prev, viewerSocketId];
      });
    };

    const onViewerLeft = ({ socketId }: { socketId: string }) => {
      setViewers((prev) => prev.filter((id) => id !== socketId));
    };

    socket.on(SocketEvent.START_STREAMING_ACK, onStartAck);
    socket.on(SocketEvent.NEW_VIEWER, onNewViewer);
    socket.on(SocketEvent.VIEWER_DISCONNECTED, onViewerLeft);

    return () => {
      socket.off(SocketEvent.START_STREAMING_ACK, onStartAck);
      socket.off(SocketEvent.NEW_VIEWER, onNewViewer);
      socket.off(SocketEvent.VIEWER_DISCONNECTED, onViewerLeft);
      // ensure zego cleaned on unmount
      cleanupZego();
    };
  }, [stopStreaming]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Broadcaster (Zego)</h2>

      {!isStreaming ? (
        <div className="space-y-3 mb-4">
          <input
            placeholder="Stream Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 w-full rounded"
          />
          <input
            placeholder="Thumbnail URL"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            className="border p-2 w-full rounded"
          />
          <div className="flex gap-3">
            <button
              onClick={startStreaming}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            >
              Start Streaming
            </button>
            <button
              onClick={() => {
                // optional: preview only (join as Host but do not notify server)
                startStreaming();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Start & Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <button
            onClick={stopStreaming}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
          >
            Stop Streaming
          </button>
        </div>
      )}

      {streamLink && (
        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="font-semibold mb-2">Share this link:</p>
          <a href={streamLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
            {streamLink}
          </a>
        </div>
      )}

      <div className="w-full h-[480px] rounded overflow-hidden bg-black">
        <div ref={zegoContainerRef} className="w-full h-full" />
      </div>

      <div className="bg-gray-50 p-4 rounded border mt-4">
        <h3 className="font-semibold mb-2">Viewers ({viewers.length})</h3>
        {viewers.length > 0 ? (
          <ul className="list-disc ml-5 text-sm">
            {viewers.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No viewers yet</p>
        )}
      </div>
    </div>
  );
};

export default BroadcasterZego;
