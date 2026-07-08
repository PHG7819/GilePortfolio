@echo off
setlocal

rem Move to this script's folder (safe even with spaces / non-ascii path)
cd /d "%~dp0"

echo ================================================
echo   Git Auto Push
echo   %cd%
echo ================================================
echo.

git status --short
echo.

set "MSG=auto update %date% %time%"

echo [1/3] git add .
git add .

echo [2/3] git commit
git commit -m "%MSG%"
if errorlevel 1 goto nochange

echo [3/3] git push
git push
if errorlevel 1 goto pushfail

echo.
echo *** DONE! Pushed to GitHub. ***
timeout /t 3 > nul
goto end

:nochange
echo.
echo *** Nothing to commit. Skipping push. ***
timeout /t 3 > nul
goto end

:pushfail
echo.
echo *** PUSH FAILED. Check the messages above. ***
pause

:end
endlocal
