import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import CyberBackground from "./CyberBackground";

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Interactive Background Particle Mesh */}
      <CyberBackground />

      {/* Persistent Two-Tier Navbar (Includes Live Telemetry HUD Strip) */}
      <Navbar />

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
