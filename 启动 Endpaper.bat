@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem Endpaper（从 Axolotl 源码改的本地版本）
rem 启动时必须带代理，否则它初始化会去连外网、10 秒超时退出。
set HTTP_PROXY=http://127.0.0.1:10808
set HTTPS_PROXY=http://127.0.0.1:10808
set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1
set CARGO_BUILD_JOBS=8

start "Endpaper dev server" /min cmd /c "pnpm app:dev"
