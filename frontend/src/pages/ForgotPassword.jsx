import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { Shield, Mail, Lock, Key, ArrowRight, ArrowLeft, Check, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(tokenFromUrl || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(tokenFromUrl ? 2 : 1); // 1: Request, 2: Reset with token, 3: Completed
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // If token is in URL, auto-set step 2
  useEffect(() => {
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setStep(2);
      setErrorMsg(null);
    }
  }, [tokenFromUrl]);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.success) {
        setSuccessMsg(
          res.data.message || "If that email address is registered, password reset instructions have been sent to your inbox. Please check your email, including spam or junk folders."
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      setErrorMsg("Missing or invalid password reset token. Please request a new reset link.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

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
      setErrorMsg(err.response?.data?.message || err.message || "Invalid or expired password reset link. Please request a new one.");
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
          <p className="text-xs text-slate-400">
            {step === 2 ? "Set a new secure password for your account." : "Reset your analyst credentials securely."}
          </p>
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

          {/* STEP 1: Request Reset Link */}
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
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs md:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {loading ? "Generating Instructions..." : "Send Reset Instructions"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Shield className="w-3.5 h-3.5" /> Security Notice
                </div>
                <p>For security, reset links expire in 15 minutes and can only be used once.</p>
              </div>
            </form>
          )}

          {/* STEP 2: Set New Password via Secure Token Link */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
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

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs md:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {loading ? "Updating Credentials in Database..." : "Save New Password"}
                <Check className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setResetToken("");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-[11px] text-slate-400 hover:text-cyan-400 transition"
              >
                Request a different reset link
              </button>
            </form>
          )}

          {/* STEP 3: Completed */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Password Updated</h3>
                <p className="text-xs text-slate-400">
                  Your credentials have been securely updated in MongoDB. You can now sign in immediately with your new password.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs md:text-sm hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20"
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

