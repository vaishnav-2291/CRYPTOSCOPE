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
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const currentPath = location.pathname;

  // Collapsible group state (default all expanded)
  const [collapsedGroups, setCollapsedGroups] = React.useState({
    analyze: false,
    monitor: false,
    investigate: false,
  });

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const navGroups = [
    {
      key: "analyze",
      label: "Analyze",
      items: [
        { name: "Wallet Analyzer", path: "/scan", icon: Search },
        { name: "Wallet Compare", path: "/compare", icon: GitCompare },
        { name: "Batch Multi-Scan", path: "/batch", icon: Layers, badge: "New" },
      ],
    },
    {
      key: "monitor",
      label: "Monitor",
      items: [
        { name: "Risk Watchlist", path: "/watchlist", icon: Eye },
        { name: "Threat Intelligence", path: "/threat", icon: ShieldAlert },
        { name: "SOC Monitor", path: "/soc", icon: Activity },
        { name: "Live Market", path: "/market", icon: TrendingUp },
      ],
    },
    {
      key: "investigate",
      label: "Investigate",
      items: [
        { name: "Forensics Terminal", path: "/forensics", icon: Zap, badge: "v2.0" },
        { name: "Case Workspace", path: "/cases", icon: Briefcase, badge: "v3.0" },
        { name: "Scan History", path: "/history", icon: History },
      ],
    },
  ];

  const renderNavLink = (item) => {
    const Icon = item.icon;
    const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group ${
          isActive
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-lg shadow-cyan-500/10"
            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            className={`w-3.5 h-3.5 transition-colors ${
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
  };

  return (
    <aside className="fixed left-4 top-[100px] bottom-6 w-60 bg-[#0D1527]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-2xl p-4 hidden lg:flex flex-col justify-between z-30 shadow-2xl">
      {/* Navigation Links */}
      <div className="space-y-3 overflow-y-auto pr-1">
        {/* Top: Overview Dashboard */}
        <div className="space-y-1">
          {renderNavLink({ name: "Overview Dashboard", path: "/", icon: LayoutDashboard })}
        </div>

        {/* Grouped Sections */}
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups[group.key];
          return (
            <div key={group.key} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <span>{group.label}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-1 pl-1">
                  {group.items.map((item) => renderNavLink(item))}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin Console Section (if admin) */}
        {isAdmin && (
          <div className="pt-1 border-t border-slate-800/60">
            {renderNavLink({
              name: "Admin Console",
              path: "/admin",
              icon: Settings,
              badge: "Admin",
              isAdmin: true,
            })}
          </div>
        )}
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