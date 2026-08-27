import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Search,
  Layers,
  GitCompare,
  Eye,
  ShieldAlert,
  Activity,
  History,
  TrendingUp,
  Settings,
  ShieldCheck,
  Zap,
  Briefcase,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const currentPath = location.pathname;

  const navItems = [
    { name: "Overview Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Wallet Analyzer", path: "/scan", icon: Search },
    { name: "Forensics Terminal", path: "/forensics", icon: Zap, badge: "v2.0" },
    { name: "Case Workspace", path: "/cases", icon: Briefcase, badge: "v3.0" },
    { name: "Batch Multi-Scan", path: "/batch", icon: Layers, badge: "New" },
    { name: "Wallet Compare", path: "/compare", icon: GitCompare },
    { name: "Risk Watchlist", path: "/watchlist", icon: Eye },
    { name: "Threat Intelligence", path: "/threat", icon: ShieldAlert },
    { name: "SOC Monitor", path: "/soc", icon: Activity },
    { name: "Scan History", path: "/history", icon: History },
    { name: "Live Market", path: "/market", icon: TrendingUp },
  ];

  if (isAdmin) {
    navItems.push({
      name: "Admin Console",
      path: "/admin",
      icon: Settings,
      badge: "Admin",
      isAdmin: true,
    });
  }

  return (
    <aside className="fixed left-4 top-[100px] bottom-6 w-60 bg-[#0D1527]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-2xl p-4 hidden lg:flex flex-col justify-between z-30 shadow-2xl">
      {/* Navigation Links */}
      <div className="space-y-1.5 overflow-y-auto pr-1">
        <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          Intelligence Suite
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-lg shadow-cyan-500/10"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-300"
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    item.isAdmin
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Network Status Footer Pill */}
      <div className="pt-3 border-t border-white/10">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Bitcoin Node
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">SYNCED</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            Engine: 5-Axis Rule Framework
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;