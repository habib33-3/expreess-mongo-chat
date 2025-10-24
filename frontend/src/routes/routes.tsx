import { createBrowserRouter } from "react-router";
import App from "../App";
import Chat from "@/pages/Chat";
import VideoCallPage from "@/pages/VideoCallPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
  {
    path: "/video-call/:callingId",
    element: <VideoCallPage />,
  },
]);
