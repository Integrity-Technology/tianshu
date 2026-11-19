@echo off
REM TianShu platform launcher (Windows)
setlocal
cd /d "%~dp0.."
if not defined PLATFORM_PORT set PLATFORM_PORT=8848
if not defined PLATFORM_HOST set PLATFORM_HOST=127.0.0.1
echo [start] http://%PLATFORM_HOST%:%PLATFORM_PORT%  auth=%PLATFORM_AUTH%
python server.py --host %PLATFORM_HOST% --port %PLATFORM_PORT% %*
endlocal
