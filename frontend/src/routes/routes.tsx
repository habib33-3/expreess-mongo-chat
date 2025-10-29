import { createBrowserRouter, Navigate } from "react-router";
import App from "../App";
import Chat from "@/pages/Chat";
import VideoCallPage from "@/pages/VideoCallPage";

import RootLayout from "@/layout/RootLayout";
import Streamer from "@/pages/Broadcaster";
import Stream from "@/pages/Viewer";
import BroadcasterZego from "@/pages/zego/ZegoBroadCaster";
import ViewerZego from "@/pages/zego/ZegoViewer";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "chat", element: <Chat /> },
      { path: "video-call/:callingId", element: <VideoCallPage /> },
      { path: "streamer", element: <Streamer /> },
      { path: "watch/:streamId", element: <Stream /> }, // match backend link
      {
        index: true,
        element: (
          <Navigate
            to="chat"
            replace
          />
        ),
      },
      {
        path:"/zego-broadcaster",
        element: <BroadcasterZego />,
      },
      {
        path:"/zego-viewer",
        element: <ViewerZego />,
      }
    ],
  },
  {
    path: "/login",
    element: <App />,
  },
]);
