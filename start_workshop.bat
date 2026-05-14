@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo  kotoedit ワークショップサーバー
echo ========================================
echo.
python server\workshop_server.py
pause
