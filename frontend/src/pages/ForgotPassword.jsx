import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Shield, Mail, Lock, Key, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        if (res.data.resetToken) {
          // Pre-fill reset token for easy testing
          setResetToken(res.data.resetToken);
        }
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.post("/auth/reset-password", {
        token: resetToken,
        newPassword,
      });
      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        setStep(3); // Completed
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] mx-auto shadow-xl shadow-cyan-500/20">
            <div className="w-full h-full bg-[#080C14] rounded-[15px] flex items-center justify-center">
              <Key className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-heading text-white">Password Recovery</h1>
          <p className="text-xs text-slate-400">Reset your analyst credentials securely.</p>
        </div>

        {/* Card */}
        <div className="cyber-card rounded-3xl p-6 md:p-8 border border-cyan-500/30 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Account Email Address</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs md:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Generating Reset Token..." : "Request Reset Token"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Reset Token</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token received"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs md:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Updating Password..." : "Set New Password"}
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Sign In with New Password <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Back Link */}
        <p className="text-center text-xs text-slate-400">
          <Link to="/login" className="text-cyan-400 hover:underline font-semibold flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
