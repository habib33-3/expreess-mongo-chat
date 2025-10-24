import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";

const VideoCallPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const location = useLocation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        // Check available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(d => d.kind === "videoinput");
        const hasMic = devices.some(d => d.kind === "audioinput");

        if (!hasCamera && !hasMic) {
          alert("No camera or microphone found. Cannot start call.");
          return;
        }

        const constraints: MediaStreamConstraints = {
          video: hasCamera,
          audio: hasMic
        };

        const userStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(userStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userStream;
        }

      } catch (err: any) {
        console.error("Media error:", err);
        alert(`Error accessing media devices: ${err.message}`);
      }
    };

    initCall();

    return () => {
      // Stop all tracks on cleanup
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 space-y-4 p-4">
      <h2 className="text-xl font-bold">Call ID: {callId}</h2>

      <div className="flex space-x-4 w-full max-w-3xl">
        {/* Local Stream */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-1/2 rounded-md bg-black"
        />

        {/* Remote Stream placeholder */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 rounded-md bg-black"
        />
      </div>

      <div className="space-x-2">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => {
            stream?.getTracks().forEach(track => track.stop());
          }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;
