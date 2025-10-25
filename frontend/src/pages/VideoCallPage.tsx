/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { socket, SocketEvent } from "@/lib/socket";

interface LocationState {
  initiator: boolean;
  contact: { _id: string; name: string };
}

const VideoCallPage = () => {
  const { callingId } = useParams<{ callingId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { initiator, contact } = state as LocationState;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [showIncomingCall, setShowIncomingCall] = useState(!initiator);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ------------------- Helpers -------------------
  const createSilentAudioTrack = (): MediaStreamTrack => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const destination = ctx.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();
    const track = destination.stream.getAudioTracks()[0];
    track.enabled = false;
    return track;
  };

  const getMediaStream = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err: any) {
      console.warn("Primary media failed:", err);

      // fallback: audio-only
      if (
        [
          "NotFoundError",
          "DevicesNotFoundError",
          "OverconstrainedError",
        ].includes(err.name)
      ) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        console.info("Fallback to audio-only mode");
        return audioStream;
      }
      throw err;
    }
  };

  // ------------------- Peer Connection -------------------
  useEffect(() => {
    if (!callingId || !contact) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit(SocketEvent.ICE_CANDIDATE, {
          targetId: contact._id,
          candidate: event.candidate,
        });
      }
    };

    const initLocalStream = async () => {
      try {
        let stream = await getMediaStream();

        // If stream has no tracks, inject silent audio
        if (stream.getTracks().length === 0) {
          const silentTrack = createSilentAudioTrack();
          stream = new MediaStream([silentTrack]);
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        if (initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit(SocketEvent.OFFER, { targetId: contact._id, offer });
        }
      } catch (err: any) {
        console.error("Media error:", err);
        setErrorMessage(
          "Cannot access camera or microphone. You can still join with audio-only."
        );
      }
    };

    initLocalStream();

    // ------------------- Socket Handlers -------------------
    const handleOffer = async ({ offer }: any) => {
      try {
        if (!pc) return;

        // ensure local stream exists
        if (!localStreamRef.current) await initLocalStream();

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit(SocketEvent.ANSWER, { targetId: contact._id, answer });
      } catch (err: any) {
        console.error("Error handling offer:", err);
      }
    };

    const handleAnswer = async ({ answer }: any) => {
      await pc.setRemoteDescription(answer);
    };

    const handleCandidate = async ({ candidate }: any) => {
      if (candidate) await pc.addIceCandidate(candidate);
    };

    socket.on(SocketEvent.OFFER, handleOffer);
    socket.on(SocketEvent.ANSWER, handleAnswer);
    socket.on(SocketEvent.ICE_CANDIDATE, handleCandidate);

    socket.emit(SocketEvent.JOIN_VIDEO_ROOM, {
      roomId: callingId,
      userId: contact._id,
    });

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pc.close();
      socket.off(SocketEvent.OFFER, handleOffer);
      socket.off(SocketEvent.ANSWER, handleAnswer);
      socket.off(SocketEvent.ICE_CANDIDATE, handleCandidate);
    };
  }, [callingId, contact, initiator]);

  // ------------------- Call Actions -------------------
  const handleAccept = () => {
    setShowIncomingCall(false);
    socket.emit(SocketEvent.CALL_ACCEPT, {
      callee: { id: contact._id, name: contact.name },
      callerId: contact._id,
      callLink: callingId,
    });
  };

  const handleDecline = () => {
    setShowIncomingCall(false);
    endCall();
    navigate(-1);
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    navigate(-1);
  };

  // ------------------- Controls -------------------
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  // ------------------- Render -------------------
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4 relative">
      <h2 className="text-xl font-bold">
        {initiator
          ? `Calling ${contact?.name}`
          : showIncomingCall
          ? `Incoming Call from ${contact?.name}`
          : "Connecting..."}
      </h2>

      {errorMessage && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-64 h-48 bg-black rounded-md"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-64 h-48 bg-black rounded-md"
        />
      </div>

      {/* Audio-only indicator */}
      {localStreamRef.current &&
        localStreamRef.current.getVideoTracks().length === 0 && (
          <div className="absolute top-4 right-4 bg-yellow-300 text-black px-3 py-1 rounded-md shadow">
            Audio-only mode (no camera detected)
          </div>
        )}

      {/* Incoming call modal */}
      {showIncomingCall && !initiator && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Decline
          </button>
        </div>
      )}

      {/* Controls */}
      {!showIncomingCall && !errorMessage && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded-md ${
              isMuted ? "bg-gray-600" : "bg-blue-500"
            } text-white`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded-md ${
              isCameraOff ? "bg-gray-600" : "bg-blue-500"
            } text-white`}
          >
            {isCameraOff ? "Camera On" : "Camera Off"}
          </button>
          <button
            onClick={endCall}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
