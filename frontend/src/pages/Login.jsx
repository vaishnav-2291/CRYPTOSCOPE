import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role = "analyst") => {
    if (role === "admin") {
      setEmail("admin@cryptoscope.ai");
      setPassword("Admin@2026");
    } else {
      setEmail("analyst@cryptoscope.ai");
      setPassword("Analyst@2026");
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] mx-auto shadow-xl shadow-cyan-500/20">
            <div className="w-full h-full bg-[#080C14] rounded-[15px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-heading text-white">CryptoScope AI</h1>
          <p className="text-xs text-slate-400">Sign in to access blockchain risk intelligence & telemetry.</p>
        </div>

        {/* Card Form */}
        <div className="cyber-card rounded-3xl p-6 md:p-8 border border-cyan-500/30 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="analyst@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-cyan-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Terminal"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Demo Fill Helper Buttons */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">
              Quick Demo Fill
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleDemoFill("analyst")}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 transition flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Analyst Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("admin")}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-purple-300 transition flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Create an Analyst Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;