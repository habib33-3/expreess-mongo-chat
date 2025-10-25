import { createBrowserRouter, Navigate } from "react-router";
import App from "../App";
import Chat from "@/pages/Chat";
import VideoCallPage from "@/pages/VideoCallPage";
import RootLayout from "@/layout/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/chat",
        element: <Chat />,
      },
      {
        path: "/video-call/:callingId",
        element: <VideoCallPage />,
      },
      {
        index: true,
        element: (
          <Navigate
            to="/chat"
            replace
          />
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <App />,
  },
]);
