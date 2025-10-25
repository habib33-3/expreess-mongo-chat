/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { socket, SocketEvent } from "@/lib/socket";

interface LocationState {
  initiator: boolean;
  contact: { _id: string; name: string };
}

/**
 * IMPORTANT: provide your authenticated user ID here.
 * Replace with whatever store/auth you use (context, redux, etc.)
 */
const getMyUserId = (): string => {
  // TODO: replace with real user id retrieval (auth context)
  // e.g. return auth.user.id;
  return window.localStorage.getItem("myUserId") || "MY_USER_ID_PLACEHOLDER";
};

const VideoCallPage = () => {
  const { callingId } = useParams<{ callingId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { initiator, contact } = (state || {}) as LocationState;

  const myUserId = getMyUserId(); // <-- use this when joining

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [showIncomingCall, setShowIncomingCall] = useState(!initiator);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ------- Helper: create silent audio track when no device available -------
  const createSilentAudioTrack = () => {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const destination = ctx.createMediaStreamDestination();
  oscillator.connect(destination);
  oscillator.start();
  const track = destination.stream.getAudioTracks()[0];
  track.enabled = false; // silent track
  return track;
};


  // ----------- getMediaStream with audio-only fallback + dummy track ------------
  const getMediaStream = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err: any) {
      console.warn("Primary media access failed:", err);

      // If video device absent, try audio-only
      if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError" ||
        err.name === "OverconstrainedError"
      ) {
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (audioErr: any) {
          console.warn("Audio fallback failed:", audioErr);
          // create a dummy stream with silent audio track
          const silentTrack = createSilentAudioTrack();
          return new MediaStream([silentTrack]);
        }
      }

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw err; // let caller decide how to inform user
      }

      // final fallback: generate a dummy silent audio track
      const silentTrack = createSilentAudioTrack();
      return new MediaStream([silentTrack]);
    }
  };

  // ----------- Setup peer connection & signaling ------------
  useEffect(() => {
    if (!callingId || !contact) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add your TURN server here in production:
        // { urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' }
      ],
    });
    pcRef.current = pc;

    // connection state
    pc.onconnectionstatechange = () => {
      console.log("PC.connectionState:", pc.connectionState);
      if (pc.connectionState === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) setIsConnected(false);
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // send candidate to the other peer
        socket.emit(SocketEvent.ICE_CANDIDATE, {
          targetId: contact._id,
          candidate: event.candidate,
        });
      }
    };

    // Join room with your own user id (critical)
    socket.emit(SocketEvent.JOIN_VIDEO_ROOM, { roomId: callingId, userId: myUserId });

    // If initiator: get media and create offer
    const initCaller = async () => {
      try {
        const stream = await getMediaStream();
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit(SocketEvent.OFFER, { targetId: contact._id, offer });
      } catch (err: any) {
        console.error("Caller media/setup error:", err);
        if (err.name === "NotAllowedError") {
          setErrorMessage("Permission denied. Allow camera/mic to start call.");
        } else {
          setErrorMessage("Failed to start local media for call.");
        }
      }
    };

    // Non-initiator still wants to subscribe to incoming offers
    // Handlers:
    const handleOffer = async ({ offer }: any) => {
      try {
        // Ensure we have some local track(s) BEFORE answering
        const stream = await getMediaStream();
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Add tracks BEFORE setRemoteDescription to ensure answer SDP contains our m-lines
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit(SocketEvent.ANSWER, { targetId: contact._id, answer });
      } catch (err: any) {
        console.error("Error handling offer on callee:", err);
        setErrorMessage("Failed to prepare local media to join the call.");
      }
    };

    const handleAnswer = async ({ answer }: any) => {
      try {
        await pc.setRemoteDescription(answer);
      } catch (err) {
        console.error("Error setting remote answer:", err);
      }
    };

    const handleCandidate = async ({ candidate }: any) => {
      try {
        if (candidate) await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn("Error adding ICE candidate:", err);
      }
    };

    socket.on(SocketEvent.OFFER, handleOffer);
    socket.on(SocketEvent.ANSWER, handleAnswer);
    socket.on(SocketEvent.ICE_CANDIDATE, handleCandidate);

    // Kick off for initiator
    if (initiator) {
      // slight timeout to ensure JOIN has been processed by server and userSockets updated
      setTimeout(() => {
        initCaller();
      }, 200); // 200ms is enough in typical local networks
    }

    // cleanup
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pc.close();
      socket.off(SocketEvent.OFFER, handleOffer);
      socket.off(SocketEvent.ANSWER, handleAnswer);
      socket.off(SocketEvent.ICE_CANDIDATE, handleCandidate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callingId, contact, initiator, myUserId]);

  // ----------- CALL ACTIONS ------------
  const handleAccept = () => {
    setShowIncomingCall(false);
    // Notify caller that callee accepted (server will route to caller)
    socket.emit(SocketEvent.CALL_ACCEPT, {
      targetId: contact._id, // caller id
      callee: { id: myUserId, name: "callee-name" }, // optionally send your info
    });
  };

  const handleDecline = () => {
    setShowIncomingCall(false);
    endCall();
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    navigate(-1);
  };

  // ----------- CONTROLS ------------
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audio = localStreamRef.current.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setIsMuted(!audio.enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const video = localStreamRef.current.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setIsCameraOff(!video.enabled);
    } else {
      // no video track -> attempt to get one (useful if user plugs camera mid-call)
      navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
        const vTrack = s.getVideoTracks()[0];
        if (vTrack && pcRef.current) {
          localStreamRef.current?.addTrack(vTrack);
          pcRef.current.addTrack(vTrack, localStreamRef.current as MediaStream);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          setIsCameraOff(false);
        }
      }).catch((e) => {
        console.warn("No camera available to enable:", e);
      });
    }
  };

  // ---------- Render ----------
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4 relative">
      <h2 className="text-xl font-bold">
        {initiator ? `Calling ${contact?.name}` : showIncomingCall ? `Incoming Call from ${contact?.name}` : isConnected ? "Connected" : "Connecting..."}
      </h2>

      {errorMessage && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{errorMessage}</div>
      )}

      <div className="flex gap-4">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-64 h-48 bg-black rounded-md" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 bg-black rounded-md" />
      </div>

      {/* Audio-only indicator */}
      {localStreamRef.current && localStreamRef.current.getVideoTracks().length === 0 && (
        <div className="absolute top-4 right-4 bg-yellow-300 text-black px-3 py-1 rounded-md shadow">
          Audio-only mode (no camera detected)
        </div>
      )}

      {/* Incoming call modal */}
      {showIncomingCall && !initiator && (
        <div className="flex gap-4 mt-4">
          <button onClick={handleAccept} className="px-4 py-2 bg-green-500 text-white rounded-md">Accept</button>
          <button onClick={handleDecline} className="px-4 py-2 bg-red-500 text-white rounded-md">Decline</button>
        </div>
      )}

      {/* Controls */}
      {!showIncomingCall && !errorMessage && (
        <div className="flex gap-3 mt-4">
          <button onClick={toggleMute} className={`px-4 py-2 rounded-md ${isMuted ? "bg-gray-600" : "bg-blue-500"} text-white`}>
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button onClick={toggleCamera} className={`px-4 py-2 rounded-md ${isCameraOff ? "bg-gray-600" : "bg-blue-500"} text-white`}>
            {isCameraOff ? "Camera On" : "Camera Off"}
          </button>
          <button onClick={endCall} className="px-4 py-2 bg-red-600 text-white rounded-md">End Call</button>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
