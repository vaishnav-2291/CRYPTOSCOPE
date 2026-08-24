import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 relative">
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-20 px-4 md:px-8 pb-12 max-w-7xl mx-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
