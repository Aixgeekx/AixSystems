@echo off
chcp 65001 >nul
title 创建桌面快捷方式
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0创建桌面快捷方式.ps1"
