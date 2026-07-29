import React from "react";
import ManagerNavbar from "./ManagerNavbar";
import { Outlet } from "react-router-dom";

export default function ManagerRootLayout() {
  return (
    <div className="min-h-[100svh] bg-(--bg) text-(--text) transition-colors duration-300">
      <ManagerNavbar />
      <main className="mobile-page-shell mx-auto max-w-8xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
