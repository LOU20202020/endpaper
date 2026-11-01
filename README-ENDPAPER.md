# Endpaper

一个 Minecraft 启动器，基于 [Axolotl](https://github.com/Axolotl-Launcher/Axolotl)（Modrinth App / Theseus 的开源分支，Tauri + Rust + Vue3）改造而来。

**许可证：GPL-3.0-only**（见 [`LICENSE`](LICENSE)）。这个仓库是完整源码，任何人可以自己编译、修改、再分发；再分发时同样必须是 GPL-3.0 并附源码。

## 与上游的差别

| 项目 | 上游 Axolotl | 本仓库 Endpaper |
| --- | --- | --- |
| 产品名 / 窗口标题 | Axolotl | Endpaper |
| 图标 | Axolotl 图标 | 开卷书（自绘） |
| 微软应用 client ID | 上游维护者的应用身份 | 自有：`7a5efd2a-f8ea-4252-a943-c05c8191b443`（2026-10 通过 Mojang AppID Review） |
| 匿名遥测 | 默认开 | 关闭 |
| 自动更新 | 指向上游更新服务器 | 关闭（`tauri-release.conf.json` 里已移除 updater 端点与签名公钥） |
| 品牌配置入口 | — | [`apps/app-frontend/src/config.ts`](apps/app-frontend/src/config.ts) 一处集中 |

没有使用 Modrinth 的商标、Logo 或私有服务；只调用 Modrinth 公开 API。

## 自己编译（Windows）

前提：Node 22+、pnpm、Rust（GNU 或 MSVC 皆可）、JDK 21（Java 侧组件要 `jar.exe`）。

```bash
pnpm install
# Java 组件用 Gradle 构建；如果拉不到发行包，把 gradle-9.1.0-bin.zip 下到本地，
# 再把 apps/app-lib/java/gradle/wrapper/gradle-wrapper.properties 的 distributionUrl
# 改成 file:///C:/path/to/gradle-9.1.0-bin.zip
export JAVA_HOME="C:\Program Files\Java\jdk-21.0.12.1"

pnpm app:dev     # 开发模式（需要能连外网，否则启动时状态初始化 10 秒超时退出）
pnpm app:build   # 打 release 版
```

两个容易踩的坑，README 写下来省时间：

1. **GNU 工具链**：仓库自带的 `.cargo/config.toml` 给 Windows MSVC 写了 `/STACK:16777220`，GNU 的 `ld` 不认，会报 `cannot find /STACK:...`。GNU 下要改成 `-Wl,--stack,16777220`。
2. **submodule**：用 tar 包下载源码时不含 submodule，`apps/app/vendor/cubiomes` 和 `third-party/blockbench` 会是空的，编译到最后一刻才 panic。需要单独补：
   - `xpple/cubiomes` → `apps/app/vendor/cubiomes`
   - `Axolotl-Launcher/blockbench-skin-standalone` → `third-party/blockbench`

## 致谢与来源

- [Modrinth App / Theseus](https://github.com/modrinth/code) — 上游运行时与界面
- [Axolotl Launcher](https://github.com/Axolotl-Launcher/Axolotl) — 本仓库的直接来源

本项目与 Mojang、Microsoft、Modrinth、Axolotl 官方均无隶属关系。
