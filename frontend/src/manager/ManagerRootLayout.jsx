import React from "react";
import ManagerNavbar from "./ManagerNavbar";
import { Outlet } from "react-router-dom";

export default function ManagerRootLayout() {
  return (
    <div className="min-h-screen bg-(--bg) text-(--text) transition-colors duration-300">
      <ManagerNavbar />
      <main className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
