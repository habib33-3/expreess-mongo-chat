import { socket, SocketEvent } from "@/lib/socket";
import { useUserStore } from "@/store/user";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

interface StreamMetadata {
  title?: string;
  thumbnailUrl?: string;
}

const Viewer = () => {
  const { user } = useUserStore();
  const { streamId } = useParams<{ streamId: string }>();
  const userId = user?._id;

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [metadata, setMetadata] = useState<StreamMetadata>({});
  const [connectionState, setConnectionState] = useState<string>("new");
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!streamId || !userId) {
      console.warn("Missing streamId or userId");
      return;
    }

    console.log("🎬 Viewer connecting to stream:", streamId);

    // Create peer connection with STUN servers
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    // Track connection state
    pc.onconnectionstatechange = () => {
      console.log("📡 Connection state:", pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log("📺 Received track:", event.track.kind);

      if (remoteVideoRef.current) {
        // Get or create the media stream
        let stream = remoteVideoRef.current.srcObject as MediaStream;

        if (!stream) {
          stream = new MediaStream();
          remoteVideoRef.current.srcObject = stream;
        }

        // Add the track to the stream
        stream.addTrack(event.track);

        // Attempt to play
        remoteVideoRef.current
          .play()
          .then(() => console.log("✅ Video playing"))
          .catch((err) => console.warn("⚠️ Autoplay blocked:", err));
      }
    };

    // Store broadcaster socket ID
    const broadcasterSocketIdRef = { current: "" };

    // ICE candidate generated locally
    pc.onicecandidate = (event) => {
      if (event.candidate && broadcasterSocketIdRef.current) {
        console.log(
          "🧊 Sending ICE candidate to broadcaster:",
          broadcasterSocketIdRef.current
        );
        socket.emit(SocketEvent.ICE_CANDIDATE, {
          targetId: broadcasterSocketIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    // Handle offer from broadcaster
    const handleOffer = async ({
      offer,
      fromId,
    }: {
      offer: RTCSessionDescriptionInit;
      fromId: string;
    }) => {
      console.log("📥 Received offer from broadcaster:", fromId);

      // Store broadcaster socket ID for ICE candidates
      broadcasterSocketIdRef.current = fromId;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("✅ Set remote description");

        // Process queued ICE candidates
        while (iceQueueRef.current.length > 0) {
          const candidate = iceQueueRef.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("🧊 Added queued ICE candidate");
          }
        }

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("📤 Sending answer to broadcaster:", fromId);
        socket.emit(SocketEvent.ANSWER, {
          targetId: fromId,
          answer: pc.localDescription,
        });
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
    };

    // Handle ICE candidate from broadcaster
    const handleIceCandidate = async ({
      candidate,
     
    }: {
      candidate: RTCIceCandidateInit;
      fromId: string;
    }) => {
      console.log("🧊 Received ICE candidate from broadcaster");

      if (!candidate) return;

      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ Added ICE candidate");
        } else {
          console.log("⏳ Queuing ICE candidate (no remote description yet)");
          iceQueueRef.current.push(candidate);
        }
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    };

    // Handle metadata
    const handleMetadata = (data: StreamMetadata) => {
      console.log("📋 Received stream metadata:", data);
      setMetadata(data);
    };

    // Handle broadcaster disconnect
    const handleBroadcasterDisconnected = () => {
      console.log("📴 Broadcaster disconnected");
      alert("Stream ended - broadcaster disconnected");
      pc.close();
    };

    // Register socket listeners
    socket.on(SocketEvent.OFFER, handleOffer);
    socket.on(SocketEvent.ICE_CANDIDATE, handleIceCandidate);
    socket.on("stream_metadata", handleMetadata);
    socket.on(
      SocketEvent.BROADCASTER_DISCONNECTED,
      handleBroadcasterDisconnected
    );

    // Join the stream
    console.log("📡 Joining stream room:", streamId);
    socket.emit(SocketEvent.JOIN_VIEWER, { roomId: streamId, userId });

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up viewer");
      pc.close();
      socket.off(SocketEvent.OFFER, handleOffer);
      socket.off(SocketEvent.ICE_CANDIDATE, handleIceCandidate);
      socket.off("stream_metadata", handleMetadata);
      socket.off(
        SocketEvent.BROADCASTER_DISCONNECTED,
        handleBroadcasterDisconnected
      );
    };
  }, [streamId, userId]);

  // Click anywhere to play (for autoplay restrictions)
  const handlePlayClick = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current
        .play()
        .then(() => console.log("▶️ Manual play successful"))
        .catch((err) => console.error("❌ Manual play failed:", err));
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {metadata && (
        <div className="mb-4">
          <div className="flex items-center gap-4">
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
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  connectionState === "connected"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {connectionState === "connected"
                  ? "🟢 Live"
                  : "🟡 Connecting..."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        onClick={handlePlayClick}
        className="cursor-pointer"
      >
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-auto bg-black rounded shadow-lg"
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded border text-sm">
        <p className="font-semibold mb-2">Connection Status:</p>
        <p>
          State: <span className="font-mono">{connectionState}</span>
        </p>
        <p className="text-gray-600 mt-2">
          💡 If video doesn't play automatically, click on the video to enable
          playback.
        </p>
      </div>
    </div>
  );
};

export default Viewer;
