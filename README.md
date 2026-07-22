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
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run online:evaluate
npm run worker:test
npm run worker:dry-run
npm run workspace:check
npm run arch:check
npm run build
```

Run the commands in this order before functional commits.<br/>**功能提交前请按此顺序运行这些命令。**

## Architecture

The pure, serializable game engine is isolated from React, browser events, timers, and rendering. See [ARCHITECTURE.md](ARCHITECTURE.md).<br/>**纯函数且可序列化的游戏引擎与 React、浏览器事件、定时器和渲染隔离。详见 [ARCHITECTURE.md](ARCHITECTURE.md)。**

The accepted CSS Lunar Console reconstruction contracts are indexed in the [frontend reconstruction plan](docs/frontend-reconstruction/README.md). Phase 7 is complete; see the [validation report](docs/phase-7-validation-report.md) and [controlled reconstruction guide](docs/phase-7-css-lunar-console-frontend-reconstruction-goal-mode-execution-guide.md).<br/>**已接受的“月面软仪表”前端复刻契约汇总于[前端复刻计划](docs/frontend-reconstruction/README.md)。Phase 7 已完成；请参阅[验证报告](docs/phase-7-validation-report.md)与[受控复刻执行指南](docs/phase-7-css-lunar-console-frontend-reconstruction-goal-mode-execution-guide.md)。**

## Roadmap

Phase completion evidence: [Phase 2 validation report](docs/phase-2-validation-report.md), [Phase 3 validation report](docs/phase-3-validation-report.md), [Phase 4 validation report](docs/phase-4-validation-report.md), [Phase 5 validation report](docs/phase-5-validation-report.md), [Phase 6A validation report](docs/phase-6a-validation-report.md), [Phase 6B validation report](docs/phase-6b-validation-report.md), and [Phase 6C Free Beta validation report](docs/phase-6c-validation-report.md). Phase 6 planning is recorded in the [online architecture decision brief](docs/phase-6-online-architecture-decision-brief.md), [Phase 6A execution guide](docs/phase-6a-shared-core-online-protocol-foundation-goal-mode-execution-guide.md), [Phase 6B execution guide](docs/phase-6b-playable-private-room-vertical-slice-goal-mode-execution-guide.md), and [Phase 6C execution guide](docs/phase-6c-resilience-production-release-goal-mode-execution-guide.md).

Phase 6C resilience and release boundaries are frozen in [the contracts and threat model](docs/phase-6c-contracts-threat-model.md). This is release preparation only; it does not authorize Paid-plan, production, DNS, or custom-domain changes.

Development proceeds in small playable phases, with architecture and validation gates before each phase advances. See [ROADMAP.md](ROADMAP.md).<br/>**项目按可玩的敏捷小阶段推进，每个阶段都必须通过架构与质量门禁。详见 [ROADMAP.md](ROADMAP.md)。**

## Deployment

The next infrastructure phase prepares a reversible [Cloudflare Pages Free cutover](docs/phase-8a-cloudflare-pages-free-cutover-goal-mode-execution-guide.md) for `greedysweeper.onovich.com`; external account, DNS, and repository-visibility actions remain gated while safe repository preparation proceeds.

The public Free beta uses GitHub Pages at `https://blog.onovich.com/GreedySweeper/` and the isolated Free Worker at `https://greedy-sweeper-room-preview.onovich1110.workers.dev`. The Pages workflow injects that public, non-secret origin through `VITE_ONLINE_ENDPOINT`; `GREEDY_SWEEPER_FREE_BETA_ENDPOINT` may replace it as a repository variable. Local builds without `VITE_ONLINE_ENDPOINT` remain safely offline. The post-release GitHub-hosted `online:free-beta-smoke` checks the published UI artifact plus HTTPS/WSS Classic, Greed, and reconnect behavior without Cloudflare credentials. Paid Workers, custom domains, DNS, Cloudflare Pages, and repository privatization remain out of scope.

## Seeded challenges and replay

Enter a `GS1` challenge code to reproduce a seeded board. Every applied human and AI command is recorded, so playback rebuilds the game through the pure engine rather than from a UI snapshot. The Daily button derives the challenge from the UTC date. Completed challenge replays are stored locally with a bounded, versioned history; the app continues normally if browser storage is unavailable.

## AI policies

Before the first move, choose Easy, Normal, or Hard and a Balanced, Conservative, or Greedy style. Normal + Balanced preserves the original AI behavior. AI reads only public board information; see the [Phase 3 validation report](docs/phase-3-validation-report.md).

## Greed v2

New ordinary games start in Greed v2. Safe reveals keep their base score and build an
unbanked bonus pot; Bank ends the turn and cashes that pot. Correct flags cash it too,
while a wrong flag or mine explosion loses it. Select Classic v1 before the first move
for the original rules. `GS1` codes, action logs, and replay summaries carry explicit
rule versions, so published Classic challenges remain playable.

## Local progression

Completed verified challenge replays can build a local-only progression profile with win
statistics and achievements. The profile is stored separately from replay history,
deduplicates replay records, and can be safely discarded by browser storage; it creates
no account, telemetry, cloud sync, currency, or gameplay advantage.

GitHub Pages deployment uses the official Actions workflow and publishes the Vite build under `/GreedySweeper/`.<br/>**GitHub Pages 使用官方 Actions 工作流部署，并在 `/GreedySweeper/` 路径下发布 Vite 构建产物。**
