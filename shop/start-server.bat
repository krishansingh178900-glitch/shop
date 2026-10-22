@echo off
title SKYLIX Salon - Local Development Server
echo ==========================================================
echo   SKYLIX HAUTE COIFFURE & SALON - LOCAL SERVER
echo ==========================================================
echo   * Public Website: http://localhost:3000/
echo   * Admin Portal:   http://localhost:3000/admin/
echo ==========================================================
echo Opening browser to http://localhost:3000/ ...
start http://localhost:3000/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
