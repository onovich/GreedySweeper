# Greedy Sweeper

Greedy Sweeper is a turn-based player-versus-AI minesweeper game with risk/reward scoring and combo turns.<br/>**贪婪扫雷是一款玩家对战 AI 的回合制扫雷游戏，包含风险收益计分与连击回合。**

## Play

- Desktop: left-click to reveal and right-click to flag.<br/>**桌面端：左键翻开，右键标记。**
- Mobile: tap to reveal and hold for 400 ms to flag.<br/>**移动端：短按翻开，长按 400 毫秒标记。**
- Keyboard: press Enter to reveal a focused cell or F to flag it.<br/>**键盘：聚焦格子后按 Enter 翻开，按 F 标记。**

## Development

```powershell
npm install
npm run dev
```

Install dependencies and start the Vite development server.<br/>**安装依赖并启动 Vite 开发服务器。**

Double-click `RunLocal.cmd` on Windows to select an available local port and open the game automatically.<br/>**Windows 上双击 `RunLocal.cmd`，它会选择可用端口并自动打开游戏。**

## Quality Gates

```powershell
npm run format:check
npm run lint
npm run test:run
npm run arch:check
npm run build
```

Run the commands in this order before functional commits.<br/>**功能提交前请按此顺序运行这些命令。**

## Architecture

The pure, serializable game engine is isolated from React, browser events, timers, and rendering. See [ARCHITECTURE.md](ARCHITECTURE.md).<br/>**纯函数且可序列化的游戏引擎与 React、浏览器事件、定时器和渲染隔离。详见 [ARCHITECTURE.md](ARCHITECTURE.md)。**

## Roadmap

Development proceeds in small playable phases, with architecture and validation gates before each phase advances. See [ROADMAP.md](ROADMAP.md).<br/>**项目按可玩的敏捷小阶段推进，每个阶段都必须通过架构与质量门禁。详见 [ROADMAP.md](ROADMAP.md)。**

## Deployment

GitHub Pages deployment uses the official Actions workflow and publishes the Vite build under `/GreedySweeper/`.<br/>**GitHub Pages 使用官方 Actions 工作流部署，并在 `/GreedySweeper/` 路径下发布 Vite 构建产物。**
