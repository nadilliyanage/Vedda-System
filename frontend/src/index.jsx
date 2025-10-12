import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./routes/Dashboard.jsx";
import Translate from "./routes/Translate.jsx";
import GamifiedModule from "./routes/gamified/GamifiedModule.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
const router = createBrowserRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/translate", element: <Translate /> },
  { path: "/learn", element: <GamifiedModule /> }
]);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
