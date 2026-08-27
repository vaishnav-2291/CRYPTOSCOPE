import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Shield, Mail, Lock, Key, ArrowRight, ArrowLeft, Check, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Set New Password, 4: Completed
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });

      if (res.data?.success) {
        setSuccessMsg(
          res.data.message || "If that email address is registered, a password reset OTP has been sent to your email."
        );
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    try {
      setResending(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });

      if (res.data?.success) {
        setSuccessMsg("A new 6-digit OTP has been sent to your email address.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMsg("Please enter a valid 6-digit numeric OTP code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/verify-reset-otp", {
        email: cleanEmail,
        otp: cleanOtp,
      });

      if (res.data?.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setSuccessMsg("OTP verified successfully. Please enter your new password.");
        setOtp("");
        setStep(3);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password with verified single-use reset authorization token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      setErrorMsg("Missing or expired reset session. Please start over.");
      setStep(1);
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
        resetToken,
        newPassword,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Password reset successfully.");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setStep(4);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to reset password. Please request a new OTP.");
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
            {step === 1 && "Request a secure 6-digit OTP to reset your credentials."}
            {step === 2 && "Enter the 6-digit verification OTP sent to your email."}
            {step === 3 && "Set a new secure password for your account."}
            {step === 4 && "Password recovery completed successfully."}
          </p>
        </div>

        {/* Card */}
        <div className="cyber-card rounded-3xl p-6 md:p-8 border border-cyan-500/30 space-y-5">
          {/* Progress Indicator */}
          {step < 4 && (
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 1 ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  1
                </span>
                <span className="text-[11px] font-medium text-slate-300">Email</span>
              </div>
              <div className={`h-[1px] flex-1 mx-3 ${step >= 2 ? "bg-cyan-500" : "bg-slate-800"}`} />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 2 ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  2
                </span>
                <span className="text-[11px] font-medium text-slate-300">OTP</span>
              </div>
              <div className={`h-[1px] flex-1 mx-3 ${step >= 3 ? "bg-cyan-500" : "bg-slate-800"}`} />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 3 ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  3
                </span>
                <span className="text-[11px] font-medium text-slate-300">Reset</span>
              </div>
            </div>
          )}

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

          {/* STEP 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
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
                {loading ? "Sending 6-Digit OTP..." : "Send OTP"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Shield className="w-3.5 h-3.5" /> Security Notice
                </div>
                <p>A 6-digit one-time code will be dispatched to your registered email address and expires in 10 minutes.</p>
              </div>
            </form>
          )}

          {/* STEP 2: Enter & Verify 6-Digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="space-y-2 text-center">
                <label className="text-slate-300 font-medium block">Enter 6-Digit Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-3 px-4 text-center tracking-[12px] font-mono text-2xl font-bold rounded-xl bg-slate-950/90 border border-cyan-500/40 text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none shadow-inner"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Enter the 6-digit passcode sent to <span className="text-slate-200 font-mono">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs md:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {loading ? "Verifying Code..." : "Verify OTP"}
                <Check className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="hover:text-cyan-400 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
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
                {loading ? "Updating Password..." : "Reset Password"}
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 4: Completed Screen */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Password Reset Complete</h3>
                <p className="text-xs text-slate-400">
                  Your credentials have been securely updated in MongoDB. You can now log in immediately with your new password.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs md:text-sm hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20"
              >
                Sign In to CRYPTOSCOPE <ArrowRight className="w-4 h-4" />
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

