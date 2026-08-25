import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

const Login = () => {
  const { login, loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle OAuth callback redirection params (?oauth_success=true or ?error=...)
  useEffect(() => {
    const isOAuthSuccess = searchParams.get("oauth_success") === "true";
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isOAuthSuccess && token) {
      setLoading(true);
      setError(null);
      loginWithTokens(token, refreshToken)
        .then(() => {
          window.history.replaceState({}, document.title, "/dashboard");
          navigate("/dashboard");
        })
        .catch((err) => {
          setError(err.message || "Failed to initialize Google authentication session.");
          setLoading(false);
        });
    }
  }, [searchParams, loginWithTokens, navigate]);

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

  const handleGoogleSignIn = () => {
    try {
      setLoading(true);
      setError(null);
      const origin = window.location.origin;
      // Redirect browser directly to Google OAuth initialization endpoint
      window.location.href = `/api/auth/google?origin=${encodeURIComponent(origin)}`;
    } catch (err) {
      setError("Failed to initiate Google sign-in.");
      setLoading(false);
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

          {/* Genuine Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 hover:border-cyan-500/50 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-3 transition shadow-md shadow-black/40 hover:shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="group-hover:text-cyan-300 transition-colors">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-[#080C14] px-3 text-[10px] uppercase font-mono text-slate-500 tracking-wider absolute">
              or continue with email
            </span>
          </div>

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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Terminal"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
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