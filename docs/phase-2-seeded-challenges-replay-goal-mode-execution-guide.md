# Phase 2 - Seeded Challenges, Action Log, Replay, and Daily Challenge

日期：2026-07-16  
状态：给执行者使用的 Phase 2 开发指令文档  
项目：Greedy Sweeper / 贪婪扫雷  
轮次预算：16 轮；第 1-12 轮为主交付，第 13-15 轮为修复缓冲，第 16 轮为最终验证。

## 0. 直接给执行者的 Goal Prompt

在不改变现有扫雷规则、AI 难度和视觉方向的前提下，为 Greedy Sweeper 交付确定性种子棋盘、可分享挑战码、版本化动作日志、完整对局回放、有限本地历史记录和无需后端的每日挑战。坚持 `app -> ui -> application -> game` 边界：回放必须通过纯引擎重新执行动作，而不是保存 UI 快照或复制规则。采用敏捷小步交付，每轮必须完成 Debug 自检、架构自检、验证、提交和推送后才能进入下一轮。

## 1. 必读上下文

- `ROADMAP.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/phase-1-validation-report.md`
- `src/game/model/contracts.js`
- `src/game/engine/board.js`
- `src/game/engine/transition.js`
- `src/game/ai/select-action.js`
- `src/application/useGameController.js`
- 当前测试和 `scripts/architecture-check.mjs`
- `$donextgoal`、`$project-git-workflow` 和适用的前端工程技能。

既有游戏规则、架构边界和 Phase 1 验收结果是本阶段事实来源。若实现与本指南出现实质冲突，停止并回报架构师，不得自行改写边界。

## 2. 本阶段要完成什么

- 引入明确、可测试、跨会话稳定的种子与 PRNG 实现。
- 使用规则版本、棋盘配置和种子生成确定性棋盘。
- 定义版本化 Challenge Descriptor 与紧凑挑战码，支持校验、解析和错误提示。
- 定义版本化、只追加的 Action Record；记录玩家意图及重放所需的最小信息。
- 从初始 Challenge Descriptor 折叠动作日志，重新执行纯引擎并生成回放状态。
- 验证回放终态摘要或哈希，识别损坏、非法、截断、篡改和不兼容记录。
- 提供播放、暂停、单步、重新开始和退出回放的最小 UI。
- 保存有限数量的本地对局记录，包含版本、挑战信息、动作、结果和必要时间元数据。
- 基于 UTC 日期和固定命名空间生成每日挑战，无服务器、账号或排行榜。
- 支持复制/粘贴挑战码和分享文本；不依赖平台专属分享 API 才能使用。
- 更新 README、架构文档、路线图状态说明和测试。

## 3. 本阶段不做什么

- 不增加 AI 难度、AI 性格或更聪明的概率推理。
- 不改变计分、连击、回合结束、胜负或地雷规则。
- 不实现云存储、账号、排行榜、服务器、WebSocket、房间、匹配或观战。
- 不实现成就、长期成长、贪婪倍率或未结算收益池。
- 不把 URL 当作唯一分享入口；本阶段的稳定契约是挑战码。
- 不保存完整棋盘答案作为挑战码内容，不保存 UI DOM、组件状态或定时器快照作为回放数据。
- 不引入全局状态库、数据库 SDK、网络 SDK 或无必要依赖。
- 不修改 `origin/`。

## 4. 架构边界与协议决策

在现有结构内增加真实模块，不创建空目录。建议职责如下，具体文件名可按代码规范调整：

```text
src/game/random/        # 纯种子规范化与确定性 PRNG
src/game/challenge/     # descriptor、挑战码、每日种子
src/game/replay/        # 动作日志、重放、验证、终态摘要
src/application/        # 录制、回放控制、浏览器存储适配
src/ui/                 # 挑战入口、回放控制、历史记录展示
```

固定决策：

- `rulesVersion`、`challengeVersion` 和 `replayVersion` 是显式字段，不依赖应用版本猜测。
- Challenge Descriptor 至少包含规则版本、棋盘尺寸、地雷数、种子和可选模式标识。
- 挑战码使用稳定、确定性的编码和校验；解码失败必须返回结构化错误，不抛出未处理异常。
- 种子与 PRNG 算法必须有固定测试向量；不得使用 `Math.random()` 生成可重放棋盘。
- 动作日志记录领域命令，不记录 React 事件、像素坐标、DOM 节点或翻开后的答案。
- 回放是 `initial challenge + ordered commands -> engine transitions -> states/results` 的折叠过程。
- 回放验证使用稳定终态摘要；不要依赖对象键顺序或不稳定 JSON 序列化。
- 每日挑战按 UTC `YYYY-MM-DD` 和固定命名空间派生种子，避免客户端时区导致同日不同棋盘。
- 时间戳只用于展示和历史排序，不参与确定性规则或终态摘要。
- `localStorage` 只能通过 application/storage 适配器访问；`src/game/**` 禁止浏览器和存储 API。
- 本地记录设定明确上限并采用最旧记录淘汰；存储满、无权限、损坏数据必须降级而不阻止开局。
- AI 行动也进入动作日志；回放时重放已记录命令，不重新让 AI 决策。
- 现有动作契约如果需要扩展，必须保持单一事实来源并更新所有调用者，不创建回放专用规则副本。

## 5. 每轮固定工作流

每轮回复必须包含：

- 本轮目标与玩家可见的最小纵向价值。
- 本轮完成内容与涉及边界。
- Debug 自检。
- 架构自检。
- 已运行验证命令与结果。
- commit hash、远端分支与 push 结果。
- 下一轮目标。
- 是否消耗缓冲轮。

推进规则：

- 验证失败：不得提交推送，不得进入下一轮。
- 提交失败：不得推送，不得进入下一轮。
- 推送失败：不得进入下一轮。
- 推送成功：记录 hash 和远端结果后进入下一轮。
- 每轮只暂存本轮相关文件，不吸收无关用户修改或生成产物。

## 6. 每轮 Debug 自检

- 是否可用最小固定种子、挑战码或动作序列复现本轮行为？
- 失败能否定位到 seed/PRNG、challenge codec、engine、action log、replay、storage、controller 或 UI？
- 是否覆盖成功、空日志、非法动作、损坏码、截断日志、篡改摘要、不兼容版本和存储失败？
- UI 变化是否有可重复的桌面和移动端 smoke 验证？
- 状态变化是否覆盖导出、导入、验证和版本边界？
- 同一输入重复执行是否得到相同棋盘、动作结果和终态摘要？

## 7. 每轮架构自检

- `src/game/**` 是否仍是规则、命令和重放语义的唯一事实来源？
- UI、controller 和 storage 是否避免复制计分、合法性、回合或 AI 规则？
- 随机性、时间和存储是否被注入或隔离？
- Challenge、Action Record、Replay Result 和 UI 状态是否保持分离？
- 回放是否调用现有引擎，而非建立第二套状态转换？
- 新协议是否显式版本化、可序列化并有兼容性失败路径？
- 是否避免提前引入 Phase 3-6 范围？
- `origin/`、无关文件和生成输出是否保持不变？

## 8. 每轮通过后的提交推送工作流

使用已初始化的 `$project-git-workflow` 包装器和 selected-files-only 策略。每轮按仓库配置执行：

```text
npm run format:check
npm run lint
npm run test:run
npm run arch:check
npm run build
```

功能提交使用 Conventional Commits，例如 `feat(challenge): add deterministic challenge descriptor`。不得使用 `--no-verify`、force push 或绕过包装器。若架构检查器需要扩展以覆盖新目录或禁止方向，必须与对应边界同轮提交。

## 9. 分轮安排

1. 协议设计纵向切片：记录 ADR/架构约束，定义种子、Challenge Descriptor、Action Record、Replay Result 和版本错误词汇，先写固定测试向量。
2. 确定性 PRNG：实现种子规范化、稳定算法和固定向量测试，证明跨重复运行一致。
3. 确定性棋盘：接入棋盘生成，验证相同 descriptor 同棋盘、不同种子产生有效差异且不改变现有随机开局体验。
4. 挑战码：实现编码、校验、解码和结构化错误，并交付最小“输入挑战码开局”闭环。
5. 动作日志：记录人类和 AI 的领域命令，验证只追加、顺序、非法动作处理和序列化。
6. 纯回放核心：从 descriptor 与日志重新执行引擎，验证中间状态与最终状态一致。
7. 回放完整性：加入稳定终态摘要和损坏、截断、篡改、不兼容检测。
8. 回放控制器与 UI：交付播放、暂停、单步、重置、退出，隔离定时器且不污染引擎。
9. 本地历史：版本化存储适配、容量上限、淘汰策略和损坏/配额/权限失败降级。
10. 每日挑战：UTC 日期种子、当日入口、重复进入一致性和日期边界测试。
11. 分享与玩家闭环：复制挑战码/结果文本、导入反馈、桌面移动端可访问性和端到端 smoke。
12. 文档与收口：同步 README、ROADMAP、ARCHITECTURE、CONTRIBUTING，扩展架构检查并完成全矩阵验证。
13. 缓冲轮 1：仅修复前 12 轮发现的问题；无问题则报告未使用且不提交。
14. 缓冲轮 2：仅修复前 12 轮发现的问题；无问题则报告未使用且不提交。
15. 缓冲轮 3：仅修复前 12 轮发现的问题；无问题则报告未使用且不提交。
16. 最终验证：完整本地门禁、关键浏览器流程、Pages 线上验证、协议兼容性审计、远端同步和最终报告；仅在有修复时提交推送。

## 10. 验证矩阵

| 关注点     | 必须提供的证据                                                        |
| ---------- | --------------------------------------------------------------------- |
| 确定性     | PRNG 固定向量、同种子同棋盘、同日志同终态摘要                         |
| 挑战码     | round-trip、校验失败、损坏、版本不兼容和边界配置测试                  |
| 动作日志   | 人类/AI 命令顺序、只追加、序列化、非法动作处理                        |
| 回放       | 中间状态、最终状态、暂停/单步/重置、篡改检测                          |
| 每日挑战   | UTC 日期稳定性、日期边界、重复进入一致性                              |
| 本地存储   | 迁移、损坏、容量、权限失败、淘汰和启动降级                            |
| 原游戏回归 | 现有 24 项及新增规则/UI 测试全部通过                                  |
| 架构       | `npm run arch:check` 覆盖新边界，无 React/DOM/storage/timer 进入 game |
| 构建       | 格式、Lint、测试、架构检查和生产构建全部通过                          |
| UI         | 桌面/移动端挑战开局、正常对局、保存、回放和每日挑战 smoke             |
| 部署       | 最新 main Actions 成功，HTTPS Pages 可真实渲染新入口                  |

## 11. PASS 标准

- 完成种子挑战、挑战码、动作日志、回放、本地历史和每日挑战的最小可玩闭环。
- 相同 descriptor 和动作日志在重复运行中生成相同状态与摘要。
- 回放不重新执行 AI 决策，不读取 UI 快照，不复制引擎规则。
- 损坏、非法、截断、篡改和不兼容数据均有可理解的失败结果且不阻止正常开局。
- 原有玩法、计分、AI 难度、视觉方向和输入方式无非预期回归。
- 未引入账号、服务器、联网、排行榜、AI 难度、贪婪新规则或成长系统。
- 完整质量门禁、架构扫描、浏览器 smoke 和 GitHub Pages 线上验证通过。
- 所有完成轮次均记录 commit hash 并成功推送到 `origin/main`。
- 文档与真实实现一致，`origin/` 未修改，工作树无意外变更。

## 12. 最终报告模板

```text
Phase: Phase 2 - Seeded challenges, action log, replay, and daily challenge
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Player-visible delivery: <challenge/replay/daily/history evidence>
Protocol versions: <rules/challenge/replay versions>
Determinism evidence: <fixed vectors and replay equivalence>
Architecture evidence: <boundaries and arch:check>
Validation: <commands and results>
Commits: <round -> hash>
Remote: origin/main <push result>
Pages: <workflow and HTTPS browser result>
Scope deviations: <none or explicit list>
Residual risks: <explicit list>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
