import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import WalletScan from "./pages/WalletScan";
import BatchScan from "./pages/BatchScan";
import Compare from "./pages/Compare";
import Watchlist from "./pages/Watchlist";
import ThreatPage from "./pages/ThreatPage";
import SOCPage from "./pages/SOCPage";
import History from "./pages/History";
import MarketPage from "./pages/MarketPage";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import PublicReport from "./pages/PublicReport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Standalone Scan Report */}
          <Route path="/report/:id" element={<PublicReport />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Main App with Persistent Navbar & Sidebar */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<WalletScan />} />
            <Route path="/batch" element={<BatchScan />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/threat" element={<ThreatPage />} />
            <Route path="/soc" element={<SOCPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/market" element={<MarketPage />} />

            {/* User Profile (Protected) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Console (Protected + Admin Only) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;