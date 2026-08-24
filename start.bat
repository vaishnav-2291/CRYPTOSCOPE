@echo off
title CryptoScope AI - Launch Terminal
echo ====================================================
echo        Starting CryptoScope AI (v2.0)
echo ====================================================
echo.

echo [1/2] Launching Backend Server on port 3000...
start "CryptoScope Backend" cmd /k "cd backend && node server.js"

echo [2/2] Launching Frontend Terminal on port 5174...
start "CryptoScope Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================
echo  CryptoScope AI is starting!
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5174 (or 5173)
echo ====================================================
