@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 一键更新大福玩具房（自动版）
echo ========================================
echo.

cd /d C:\Users\51647\Documents\trae_projects\dafu-toy-room

REM 检查是否有修改
git diff --quiet
if %errorlevel% equ 0 (
    echo 📋 没有检测到修改，直接更新 VPS...
) else (
    echo 📤 检测到修改，正在自动提交...
    git add .
    git commit -m "auto-update: %date% %time%"
    git push origin master
    echo ✅ 代码已推送到 GitHub
)

echo.
echo 📥 正在连接 VPS 并更新...
ssh root@194.41.36.137 "/root/update-dafu.sh"

echo.
echo ========================================
echo ✅ 全部完成！网站已更新
echo ========================================
pause
