@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem Endpaper（从 Axolotl 源码改的本地版本）
rem 工具链都是免安装便携版：Rust(gnu) + MinGW gcc + pnpm + Temurin JDK 21
set HTTP_PROXY=http://127.0.0.1:10808
set HTTPS_PROXY=http://127.0.0.1:10808
set JAVA_HOME=C:\Users\82954\Apps\jdk21\jdk-21.0.13+9
set PATH=C:\Users\82954\Apps\mingw64\mingw64\bin;C:\Users\82954\Apps\jdk21\jdk-21.0.13+9\bin;C:\Users\82954\Apps\pnpm-global;%USERPROFILE%\.cargo\bin;%PATH%
set CARGO_BUILD_JOBS=8

rem 启动时必须带代理，否则它初始化会去连外网、10 秒超时退出。
start "Endpaper dev server" /min cmd /c "pnpm app:dev"
