@echo off
title CryptoLens AI - Launch Terminal
echo ====================================================
echo        Starting CryptoLens AI (v2.0)
echo ====================================================
echo.

echo [1/2] Launching Backend Server on port 3000...
start "CryptoLens Backend" cmd /k "cd backend && node server.js"

echo [2/2] Launching Frontend Terminal on port 5174...
start "CryptoLens Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================
echo  CryptoLens AI is starting!
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5174 (or 5173)
echo ====================================================
