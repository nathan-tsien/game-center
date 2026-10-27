# 游戏中心 · Family Game Center

离线单文件家庭游戏中心（飞行棋 / 大富翁·中国之旅 / 兔子棋 等），供家里 iPad 横屏使用。原创美术，中文界面。
Offline, single-file family game center for a private iPad (landscape). Original art, Chinese UI.

## 构建 / Build

```bash
python3 src/build.py
```

- 把 `src/` 里的 HTML/CSS/JS 和内嵌美术、语音拼成仓库根目录的 `index.html`（约 15 MB，无外部依赖，可离线打开）。
  Concatenates everything in `src/` into the repo-root `index.html` (~15 MB, no external requests, works offline).
- 修改请在 `src/` 中进行，然后重新构建并提交 `index.html`。不要手改 `index.html`。
  Edit files under `src/`, rebuild, and commit the regenerated `index.html`. Do not hand-edit `index.html`.
- `src/gen_ct_data.py` 是生成 `src/ct-data.json` 的离线辅助脚本，依赖本仓库之外的调研数据，平时不需要运行。
  `src/gen_ct_data.py` is an offline helper for regenerating `src/ct-data.json`; it needs research data that is not in this repo and is not part of the normal build.

## 目录 / Layout

| 路径 Path | 说明 Notes |
| --- | --- |
| `index.html` | 构建产物，GitHub Pages 直接发布 / build output served by GitHub Pages |
| `src/` | 可编辑源码 / editable sources (`build.py`, engines, UI, CSS, embedded art & voices) |
| `src/fly-engine.js` | 飞行棋规则引擎 / fly-chess rules engine (RING52 · HOME5 · FLY+12) |
| `src/fly-board3d.js` | 飞行棋 3D 卡通海岛棋盘：几何映射 + 静态矢量美术 / 3D island board geometry + art |
| `src/fly-ui.js`, `src/fly.css` | 飞行棋界面 / fly-chess UI |
| `refs/` | 设计参考图 / design references |
| `icon/` | 网站图标 / favicons |

## 发布 / Publishing

GitHub Pages 已开启，发布 `main` 分支根目录的 `index.html`。改动先走 PR，审阅通过后再合并到 `main`，合并即上线。
GitHub Pages is already enabled and serves `index.html` from the root of `main`. Changes go through a pull request for review first; merging to `main` publishes them.
