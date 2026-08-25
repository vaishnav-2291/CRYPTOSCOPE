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

          {/* Authentication Routes (Public) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ForgotPassword />} />

          {/* Main App with Persistent Navbar & Sidebar */}
          <Route element={<Layout />}>
            {/* Public Intelligence Page */}
            <Route path="/market" element={<MarketPage />} />

            {/* Protected Core Intelligence Pages */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <ProtectedRoute>
                  <WalletScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scanner"
              element={
                <ProtectedRoute>
                  <WalletScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet-analyzer"
              element={
                <ProtectedRoute>
                  <WalletScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/batch"
              element={
                <ProtectedRoute>
                  <BatchScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <Compare />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watchlist"
              element={
                <ProtectedRoute>
                  <Watchlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/threat"
              element={
                <ProtectedRoute>
                  <ThreatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <ThreatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/soc"
              element={
                <ProtectedRoute>
                  <SOCPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />

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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;