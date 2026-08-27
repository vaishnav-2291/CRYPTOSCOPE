import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import CyberBackground from "./CyberBackground";
import CommandPalette from "./CommandPalette";

const Layout = () => {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Interactive Background Particle Mesh */}
      <CyberBackground />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Persistent Two-Tier Navbar (Includes Live Telemetry HUD Strip) */}
      <Navbar onOpenCommand={() => setCmdOpen(true)} />

      {/* Persistent Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area with Clean 104px Top Offset */}
      <main className="lg:ml-64 pt-[104px] px-4 md:px-8 pb-16 max-w-7xl mx-auto min-h-screen relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
