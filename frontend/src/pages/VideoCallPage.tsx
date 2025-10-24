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

  useEffect(() => {
    if (!callingId || !contact) return;

    // Setup peer connection with STUN/TURN
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // TURN server for production (replace with your credentials)
        { urls: "turn:your-turn-server:3478", username: "user", credential: "pass" }
      ],
    });
    pcRef.current = pc;

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit(SocketEvent.ICE_CANDIDATE, {
          targetId: contact._id,
          candidate: event.candidate,
        });
      }
    };

    // Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current!.srcObject = stream;
        localStreamRef.current = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        if (initiator) {
          // Initiator creates offer
          pc.createOffer().then(async (offer) => {
            await pc.setLocalDescription(offer);
            socket.emit(SocketEvent.OFFER, { targetId: contact._id, offer });
          });
        }
      })
      .catch(err => {
        console.error("Media error:", err);
        alert("Cannot access camera or microphone: " + err.message);
      });

    // Socket listeners
    const handleOffer = async ({ offer }: any) => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(SocketEvent.ANSWER, { targetId: contact._id, answer });
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

    // Join video room
    socket.emit(SocketEvent.JOIN_VIDEO_ROOM, { roomId: callingId, userId: contact._id });

    return () => {
      // Cleanup
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      pc.close();
      socket.off(SocketEvent.OFFER, handleOffer);
      socket.off(SocketEvent.ANSWER, handleAnswer);
      socket.off(SocketEvent.ICE_CANDIDATE, handleCandidate);
    };
  }, [callingId, contact, initiator]);

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
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    pcRef.current?.close();
    // socket.emit(SocketEvent.CALL_END, { targetId: contact._id });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4">
      <h2 className="text-xl font-bold">
        {initiator
          ? `Calling ${contact?.name}`
          : showIncomingCall
          ? `Incoming Call from ${contact?.name}`
          : "Connecting..."}
      </h2>

      <div className="flex gap-4">
        <video ref={localVideoRef} autoPlay muted className="w-64 h-48 bg-black rounded-md" />
        <video ref={remoteVideoRef} autoPlay className="w-64 h-48 bg-black rounded-md" />
      </div>

      {/* Incoming call modal */}
      {showIncomingCall && !initiator && (
        <div className="flex gap-4 mt-4">
          <button onClick={handleAccept} className="px-4 py-2 bg-green-500 text-white rounded-md">
            Accept
          </button>
          <button onClick={handleDecline} className="px-4 py-2 bg-red-500 text-white rounded-md">
            Decline
          </button>
        </div>
      )}

      {/* End call button */}
      {!showIncomingCall && (
        <button onClick={endCall} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md">
          End Call
        </button>
      )}
    </div>
  );
};

export default VideoCallPage;
