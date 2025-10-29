/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { socket, SocketEvent } from "@/lib/socket";
import { useUserStore } from "@/store/user";
import axios from "axios";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useParams } from "react-router";
import { dbUrl } from "@/constants";

const ViewerZego = () => {
  const { user } = useUserStore();
  const { streamId } = useParams(); // e.g. URL /watch/:streamId
  const [metadata, setMetadata] = useState({ title: "", thumbnailUrl: "" });
  const [connection, setConnection] = useState("idle");

  const zegoContainerRef = useRef<HTMLDivElement | null>(null);
  const zegoKitRef = useRef<any>(null);

  useEffect(() => {
    if (!streamId) return;

    let isMounted = true;
    const userID = user?._id || `viewer_${Date.now()}`;

    const joinAsViewer = async () => {
      try {
        setConnection("joining");
        // 1) Inform server we are joining so it can notify broadcaster and persist presence
        socket.emit(SocketEvent.JOIN_VIEWER, {
          roomId: streamId,
          userId: userID,
        });

        // 2) fetch a kit token for this viewer from backend
        const { data } = await axios.post(`${dbUrl}/zego/token`, {
          userID,
          roomID: streamId,
        });
        const kitToken = data.token;

        // 3) create zego instance and join as Audience
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoKitRef.current = zp;

        zp.joinRoom({
          container: zegoContainerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.LiveStreaming }, // viewer role prevents publishing
          showUserList: false,
          
        });

        setConnection("connected");
      } catch (err) {
        console.error("Viewer join error", err);
        setConnection("error");
        alert("Failed to join stream (token/server error)");
      }
    };

    // socket listeners for metadata, broadcaster disconnect etc.
    const onMetadata = (data: any) => {
      setMetadata(data || {});
    };

    const onBroadcasterLeft = () => {
      alert("Broadcaster ended the stream");
      // optional: leave Zego room
      try {
        if (zegoKitRef.current) {
          zegoKitRef.current.destroy();
          zegoKitRef.current = null;
        }
      } catch {
        console.error("Error leaving zego room");
      }
      setConnection("ended");
    };

    socket.on("stream_metadata", onMetadata);
    socket.on(SocketEvent.BROADCASTER_DISCONNECTED, onBroadcasterLeft);

    joinAsViewer();

    return () => {
      isMounted = false;
      socket.off("stream_metadata", onMetadata);
      socket.off(SocketEvent.BROADCASTER_DISCONNECTED, onBroadcasterLeft);
      // cleanup zego
      try {
        if (zegoKitRef.current) {
          zegoKitRef.current.destroy();
          zegoKitRef.current = null;
        }
      } catch {
        console.error("Error leaving zego room");
      }
      // notify server leaving
      socket.emit(SocketEvent.LEAVE, { roomId: streamId, userId: userID });
    };
  }, [streamId, user]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4 flex items-center gap-4">
        {metadata.thumbnailUrl && (
          <img
            src={metadata.thumbnailUrl}
            alt={metadata.title}
            className="w-32 h-20 object-cover rounded shadow"
          />
        )}
        <div>
          <h3 className="text-xl font-bold">
            {metadata.title || "Untitled Stream"}
          </h3>
          <div className="text-sm text-gray-600">
            {connection === "connected"
              ? "🟢 Live"
              : connection === "joining"
              ? "🟡 Joining..."
              : "⚪ Idle"}
          </div>
        </div>
      </div>

      <div className="w-full h-[480px] rounded overflow-hidden bg-black">
        <div
          ref={zegoContainerRef}
          className="w-full h-full"
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded border text-sm">
        <p className="font-semibold mb-2">Connection Status:</p>
        <p>
          State: <span className="font-mono">{connection}</span>
        </p>
      </div>
    </div>
  );
};

export default ViewerZego;
