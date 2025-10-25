import { socket, SocketEvent } from "@/lib/socket";
import { useUserStore } from "@/store/user";
import { useEffect, useRef, useState } from "react";

interface PeerMap {
  [socketId: string]: RTCPeerConnection;
}

const Broadcaster = () => {
  const { user } = useUserStore();
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [streamLink, setStreamLink] = useState("");
  const [viewers, setViewers] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<PeerMap>({});
  const roomIdRef = useRef<string>("my-stream-room");

  // Cleanup function
  const cleanup = () => {
    // Close all peer connections
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Clear video
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setViewers([]);
    setIsStreaming(false);
  };

  const startStreaming = async () => {
    if (!user) return alert("User not found");

    try {
      // Get camera + mic
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      setIsStreaming(true);

      // Notify server
      socket.emit(SocketEvent.START_STREAMING, {
        roomId: roomIdRef.current,
        userId: user._id,
        title,
        thumbnailUrl: thumbnail,
      });

      console.log("🎥 Started streaming");
    } catch (error) {
      console.error("Error starting stream:", error);
      alert("Failed to access camera/microphone");
    }
  };

  const stopStreaming = () => {
    cleanup();
    socket.emit(SocketEvent.LEAVE);
    setStreamLink("");
    console.log("🛑 Stopped streaming");
  };

  useEffect(() => {
    // Server ack with stream link
    const handleStreamingAck = ({
      success,
      link,
    }: {
      success: boolean;
      link: string;
    }) => {
      if (!success) {
        alert("Failed to start streaming");
        cleanup();
        return;
      }
      setStreamLink(link);
      console.log("✅ Stream link:", link);
    };

    // New viewer joins
    const handleNewViewer = async ({
      viewerId,
      viewerSocketId,
    }: {
      viewerId: string;
      viewerSocketId: string;
    }) => {
      console.log("👁️ New viewer joined:", viewerId, viewerSocketId);

      if (!localStreamRef.current) {
        console.warn("No local stream available");
        return;
      }

      setViewers((prev) => [...prev, viewerSocketId]);

      // Create peer connection with STUN servers
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      peersRef.current[viewerSocketId] = pc;

      // Add all tracks to peer connection
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("➕ Adding track to peer:", track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 Sending ICE candidate to viewer:", viewerSocketId);
          socket.emit(SocketEvent.ICE_CANDIDATE, {
            targetId: viewerSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log(
          `📡 Connection state with ${viewerSocketId}:`,
          pc.connectionState
        );
      };

      pc.oniceconnectionstatechange = () => {
        console.log(
          `🧊 ICE connection state with ${viewerSocketId}:`,
          pc.iceConnectionState
        );
      };

      try {
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("📤 Sending offer to viewer:", viewerSocketId);
        socket.emit(SocketEvent.OFFER, {
          targetId: viewerSocketId,
          offer: pc.localDescription,
        });
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    };

    // Handle answer from viewer
    const handleAnswer = async ({
      answer,
      fromId,
    }: {
      answer: RTCSessionDescriptionInit;
      fromId: string;
    }) => {
      console.log("📥 Received answer from:", fromId);
      const pc = peersRef.current[fromId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("✅ Set remote description for:", fromId);
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      } else {
        console.warn("No peer connection found for:", fromId);
      }
    };

    // Handle ICE from viewer
    const handleIceCandidate = async ({
      candidate,
      fromId,
    }: {
      candidate: RTCIceCandidateInit;
      fromId: string;
    }) => {
      const pc = peersRef.current[fromId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("🧊 Added ICE candidate from:", fromId);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    // Viewer disconnect
    const handleViewerDisconnected = ({ socketId }: { socketId: string }) => {
      console.log("👋 Viewer disconnected:", socketId);
      setViewers((prev) => prev.filter((id) => id !== socketId));
      const pc = peersRef.current[socketId];
      if (pc) {
        pc.close();
        delete peersRef.current[socketId];
      }
    };

    // Register event listeners
    socket.on(SocketEvent.START_STREAMING_ACK, handleStreamingAck);
    socket.on(SocketEvent.NEW_VIEWER, handleNewViewer);
    socket.on(SocketEvent.ANSWER, handleAnswer);
    socket.on(SocketEvent.ICE_CANDIDATE, handleIceCandidate);
    socket.on(SocketEvent.VIEWER_DISCONNECTED, handleViewerDisconnected);

    // Cleanup on unmount
    return () => {
      socket.off(SocketEvent.START_STREAMING_ACK, handleStreamingAck);
      socket.off(SocketEvent.NEW_VIEWER, handleNewViewer);
      socket.off(SocketEvent.ANSWER, handleAnswer);
      socket.off(SocketEvent.ICE_CANDIDATE, handleIceCandidate);
      socket.off(SocketEvent.VIEWER_DISCONNECTED, handleViewerDisconnected);
      cleanup();
    };
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Broadcaster Dashboard</h2>

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
          <button
            onClick={startStreaming}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
          >
            Start Streaming
          </button>
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
          <a
            href={streamLink}
            target="_blank"
            className="text-blue-600 underline break-all"
          >
            {streamLink}
          </a>
        </div>
      )}

      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-auto bg-black rounded shadow-lg mb-4"
      />

      <div className="bg-gray-50 p-4 rounded border">
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

export default Broadcaster;
