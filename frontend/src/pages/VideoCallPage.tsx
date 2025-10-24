import { useParams } from "react-router";

const VideoCallPage = () => {
  const { callingId } = useParams();

  return <div>{callingId}</div>;
};

export default VideoCallPage;
