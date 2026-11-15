#!/usr/bin/env bash
# 改 UI / 调动画时用这个：Vite 热更新，改 CSS 一秒看见效果，不重编 Rust
set -e
cd "$(dirname "$0")/apps/app"

# 本机工具链全部是免装便携版，不需要管理员权限：
#   Rust 1.95 (x86_64-pc-windows-gnu)  ~/.cargo
#   MinGW-w64 gcc 16.2                 C:\Users\<user>\Apps\mingw64\mingw64\bin
#   pnpm 10.33.2（避开 WindowsApps 不可执行） C:\Users\<user>\Apps\pnpm-global
#   Temurin JDK 21                     C:\Users\<user>\Apps\jdk21\jdk-21.0.13+9
export PATH="/c/Users/82954/Apps/mingw64/mingw64/bin:/c/Users/82954/Apps/pnpm-global:$HOME/.cargo/bin:$PATH"
export JAVA_HOME='C:\Users\82954\Apps\jdk21\jdk-21.0.13+9'
export PATH="/c/Users/82954/Apps/jdk21/jdk-21.0.13+9/bin:$PATH"

# 启动时的状态初始化要连外网，否则 10 秒超时退出
export https_proxy=http://127.0.0.1:10808 http_proxy=http://127.0.0.1:10808
export HTTPS_PROXY=$https_proxy HTTP_PROXY=$http_proxy
export CARGO_BUILD_JOBS=8

exec npx tauri dev
