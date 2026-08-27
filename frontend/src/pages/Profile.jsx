import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getScanHistory, getWatchlist } from "../services/api";
import api from "../services/api";
import { formatBtc, truncateAddress, getRiskTheme } from "../utils/constants";
import { User, Shield, Key, Check, AlertTriangle, Eye, History, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, isAdmin, updateUserData, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [history, setHistory] = useState([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    getScanHistory().then((res) => {
      if (res?.history) setHistory(res.history);
    }).catch(() => {});

    getWatchlist().then((res) => {
      if (res?.watchlist) setWatchlistCount(res.watchlist.length);
    }).catch(() => {});
  }, []);

  const isGoogleUser = user?.authProvider === "google";

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMsg("Display name cannot be empty.");
        setSaving(false);
        return;
      }

      const payload = { name: trimmedName };

      // If user is attempting to change password
      if (newPassword || currentPassword) {
        if (isGoogleUser) {
          setErrorMsg("This account is authenticated through Google and does not have a local password to change.");
          setSaving(false);
          return;
        }
        if (!currentPassword) {
          setErrorMsg("Current password is required to change your password.");
          setSaving(false);
          return;
        }
        if (!newPassword) {
          setErrorMsg("Please enter a new password.");
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          setErrorMsg("New password must be at least 6 characters long.");
          setSaving(false);
          return;
        }
        if (currentPassword === newPassword) {
          setErrorMsg("New password cannot be the same as the current password.");
          setSaving(false);
          return;
        }

        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.put("/auth/profile", payload);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Profile updated successfully.");
        if (res.data.user) {
          updateUserData(res.data.user);
        }
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Account Header */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-2xl font-heading shadow-lg shadow-cyan-500/20">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading text-white">{user?.name || "Security Analyst"}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isAdmin
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {user?.role || "User"}
              </span>
              {isGoogleUser && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Google Auth
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-400">{user?.email}</div>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-semibold border border-white/10 transition flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* Profile KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">Total Scans Executed</span>
          <div className="text-2xl font-bold text-white">{history.length}</div>
        </div>
        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">Watched Addresses</span>
          <div className="text-2xl font-bold text-cyan-400">{watchlistCount}</div>
        </div>
        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">Account Access Level</span>
          <div className="text-2xl font-bold text-purple-300 uppercase">{isAdmin ? "Administrator" : "Standard"}</div>
        </div>
      </div>

      {/* Edit Profile & Password Form */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" /> Account Settings
        </h3>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          {isGoogleUser ? (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 text-xs flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                This account is authenticated through Google Sign-In. Password security is managed directly by Google.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Current Password (if changing)</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
