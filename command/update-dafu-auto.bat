@echo off
chcp 65001 >nul
echo ========================================
echo [DAFU TOY ROOM] Auto Update
echo ========================================
echo.

cd /d C:\Users\51647\Documents\trae_projects\dafu-toy-room

echo [1/3] Pushing to GitHub...
git add .
git commit -m "auto-update: %date% %time%"
git push origin master
if errorlevel 1 (
    echo.
    echo [ERROR] GitHub push failed!
    pause
    exit /b 1
)
echo [OK] GitHub push success!
echo.

echo [2/3] Updating VPS...
ssh root@194.41.36.137 "cd /root/dafu-toy-room && cp log-viewer.sh /tmp/ 2>/dev/null; cp check-health.sh /tmp/ 2>/dev/null; cp -r images /tmp/ 2>/dev/null; git fetch origin && git reset --hard origin/master && mv /tmp/log-viewer.sh . 2>/dev/null; mv /tmp/check-health.sh . 2>/dev/null; mv /tmp/images . 2>/dev/null; chmod +x log-viewer.sh check-health.sh 2>/dev/null; pm2 restart dafu-toy-room"
if errorlevel 1 (
    echo.
    echo [ERROR] VPS update failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo [OK] Update complete!
echo Website: https://fufud.cc
echo ========================================
pause
