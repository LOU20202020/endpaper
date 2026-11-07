#!/usr/bin/env bash
# 改 UI / 调动画时用这个：Vite 热更新，改 CSS 一秒看见效果，不重编 Rust
set -e
cd "$(dirname "$0")/apps/app"
export JAVA_HOME="C:\Program Files\Java\jdk-21.0.12.1"
export https_proxy=http://127.0.0.1:10808 http_proxy=http://127.0.0.1:10808
exec npx tauri dev
