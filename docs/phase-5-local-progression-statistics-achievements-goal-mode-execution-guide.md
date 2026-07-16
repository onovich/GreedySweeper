# Phase 5 - Local Progression, Statistics, and Achievements

日期：2026-07-17  
状态：给执行者使用的 Phase 5 开发指令文档  
项目：Greedy Sweeper / 贪婪扫雷  
轮次预算：16 轮；第 1-12 轮为主交付，第 13-15 轮为修复缓冲，第 16 轮为最终验证。

## 0. 直接给执行者的 Goal Prompt

为 Greedy Sweeper 增加纯本地、可重建、可迁移的个人进度、统计和成就系统。完成对局必须先通过现有回放/完整性边界派生版本化 `CompletedGameFacts`，再由独立 progression 纯 reducer 计算统计与成就；禁止把局外数据写入 `src/game/`、实时游戏状态或规则转换。提供可访问的统计/成就界面、安全重置与存储降级，不引入账号、云同步、排行榜或数据上传。采用敏捷纵向切片，每轮完成 Debug 自检、架构自检、验证、提交和推送后才能前进。

## 1. 必读上下文

- `ROADMAP.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/phase-2-protocol.md`
- `docs/phase-2-validation-report.md`
- `docs/phase-3-validation-report.md`
- `docs/phase-4-validation-report.md`
- `src/application/storage/history-storage.js`
- `src/application/useGameController.js`
- `src/game/replay/replay-engine.js`
- `src/game/replay/integrity.js`
- `src/game/replay/contracts.js`
- `src/ui/screens/GameScreen.jsx`
- `scripts/architecture-check.mjs`
- `$donextgoal` 与 `$project-git-workflow`。

Phase 1-4 已验收的规则、挑战码、回放、AI、Greed 模式和本地历史是事实来源。Progression 只能消费已完成且可验证的记录，不得成为新的游戏事实来源。

## 2. 产品口径与已确定范围

### 2.1 统计口径

首期提供以下本地统计：

- 完成对局、胜、负、平；胜率定义为 `wins / completedGames`，平局计入分母。
- 玩家累计得分、平均得分、最高得分、最大胜分差。
- Classic 与 Greed 的对局/胜负分布。
- 按 AI difficulty 和 style 的对局、胜负与胜率。
- 每日挑战完成次数。
- 正确标记、错误标记、踩雷、Bank 次数。
- 最高 streak、最高单次兑现奖励、最高单次损失奖励。
- 干净胜利次数：获胜且无错误标记、无踩雷。

所有口径从完成回放的 descriptor、actions、transition results 和终态派生；不得信任 UI 计数器或单独维护可漂移字段。

### 2.2 初始成就目录

成就只提供徽章和说明，不提供货币、道具或规则优势：

- `first_game`：完成第一局。
- `first_win`：取得第一场胜利。
- `clean_win`：完成一次干净胜利。
- `banker_10`：单次兑现奖励至少 10。
- `banker_25`：单次兑现奖励至少 25。
- `burned_by_greed`：单次损失未兑现奖励至少 20。
- `daily_challenger`：完成一次每日挑战。
- `versatile_miner`：分别战胜 easy、normal、hard AI 至少一次。
- `style_master`：分别战胜 balanced、conservative、greedy AI 至少一次。
- `veteran_25`：完成 25 局。

定义必须版本化、数据驱动、可从 facts/统计重新评估。解锁时间只用于展示，不参与条件判断。

### 2.3 数据保留与隐私

- 全部数据只写浏览器本地，不发送网络请求，不生成账号标识。
- Progression 使用独立 storage key 与显式 schema version，不修改 replay-history v1。
- 保存最近最多 1000 个紧凑 `CompletedGameFacts`；超出后折叠进版本化 baseline rollup，再淘汰最旧 facts，保持累计统计。
- 已解锁成就作为版本化结果保存，并可用 baseline + retained facts 重新验证。
- 记录 ID 使用 replayVersion、actionCount 与 integrity hash 的稳定组合；同一完成记录只能计入一次。
- 用户可清空 progression 数据；重置需要明确二次确认，不删除 replay history，除非未来另行设计。
- 存储不可用、配额不足、JSON 损坏或版本不兼容时，游戏仍可正常开局和完成对局。

## 3. 本阶段要完成什么

- 定义 `PROGRESSION_VERSION`、`FACTS_VERSION`、统计词汇、成就定义和结构化错误。
- 从已验证完成 replay 派生不可变、紧凑、可序列化的 `CompletedGameFacts`。
- 重放 actions 并读取领域 events，计算 Bank、损失、streak、标记、踩雷和结果指标。
- 建立稳定 record ID 与重复登记幂等规则。
- 用纯 reducer 从 baseline rollup + facts 计算总览、模式维度和 AI Policy 维度统计。
- 用数据驱动的纯 evaluator 计算成就解锁，支持旧记录回溯解锁。
- 建立版本化 progression storage adapter、迁移、容量上限、rollup、损坏和配额降级。
- controller 在完成对局时只提交一次可验证 replay 给 progression service；失败不影响游戏。
- 给随机局、挑战码局、每日挑战增加明确 `sessionSource` 元数据，旧记录缺失时安全归类为 `unknown`。
- 提供统计总览、模式/AI 分组、个人纪录、成就列表/解锁状态与简短进度提示。
- 提供本地数据重置确认、存储错误提示和隐私说明。
- 增加 progression 评估脚本、fixture、架构守卫、README/ROADMAP/ARCHITECTURE/CONTRIBUTING 和最终验证报告。

## 4. 本阶段不做什么

- 不修改 Classic/Greed 规则、分数、AI 决策、挑战码、动作日志或回放执行。
- 不把 progression 字段加入 game state、Challenge Descriptor 或完整性摘要。
- 不增加经验值、等级、技能树、货币、商店、道具、每日奖励或付费系统。
- 不实现账号、登录、云同步、跨设备迁移、在线排行榜、好友或社交分享。
- 不上传统计、设备信息、浏览历史或任何遥测。
- 不从未完成、损坏、摘要不匹配或版本不支持的 replay 增加统计。
- 不允许 UI/controller 直接计算胜率、成就条件或 rollup。
- 不修改 `origin/`。

## 5. 架构边界

Progression 是 `game` 之外的纯局外领域，建议结构：

```text
src/progression/
  config.js              # schema、retention、achievement catalog
  contracts.js           # facts/profile/result/error contracts
  derive-game-facts.js   # verified replay -> CompletedGameFacts
  stats.js                # baseline + facts -> statistics
  achievements.js         # data-driven pure unlock evaluation
  profile.js              # idempotent append/rollup/rebuild orchestration
  selectors.js            # UI-ready derived reads
src/application/storage/
  progression-storage.js  # localStorage envelope/migration/fallback
src/ui/
  components/Progression* # presentational dashboard/achievement UI
```

固定边界：

- `src/progression/**` 必须是纯函数，不导入 React、DOM、storage、controller 或 UI。
- Progression 可以调用公开 replay validation/transition result API，但不得读取隐藏地雷答案来定义玩家表现。
- `deriveCompletedGameFacts` 只接受完成且 integrity 通过的 replay；失败返回结构化错误。
- Facts 保存领域事实，不保存翻译文本、DOM 状态、组件状态或可重新计算的 UI 格式。
- Stats reducer 是统计口径唯一事实来源；UI 只通过 progression selectors 展示。
- Achievement catalog 是条件、标题 key、说明 key 和版本的唯一事实来源；解锁 evaluator 不读当前时间。
- `unlockedAt` 使用完成记录的 `completedAt`，`sourceGameId` 指向触发 facts。
- Profile append 必须幂等；重复 record ID 返回 no-op 而不是重复累计。
- baseline rollup 与 retained facts 使用同一 reducer 语义；rollup 后总计必须与 rollup 前一致。
- 存储适配器只做 validate/migrate/load/save/reset，不计算统计或成就。
- controller 只在“游戏结束 + replay 可验证 + 尚未提交”时调用一次 progression service。
- Replay history 与 progression storage 生命周期分离；任一损坏不得级联清空另一方。
- `sessionSource` 是 application/replay metadata，不改变规则和 integrity 语义；缺失值归类 `unknown`。
- 架构检查器必须禁止 `src/game/**` 导入 progression，并禁止 progression 导入 application/UI/storage。

## 6. 数据模型与迁移

`CompletedGameFacts` 至少包含：

```text
factsVersion, id, completedAt, sessionSource,
rulesVersion, mode, replayVersion,
aiPolicyVersion, aiDifficulty, aiStyle,
winner, humanScore, aiScore, actionCount,
correctFlags, wrongFlags, explosions, banks,
maxStreak, maxBankedPot, maxLostPot
```

规则：

- `completedAt` 必须是有效 ISO 时间；旧记录缺失时由 history `savedAt` 提供，仍缺失则使用明确 unknown/error 路径，不调用当前时间伪造。
- v1 Classic 没有 Bank/streak 时对应指标为 0。
- 旧 replay 缺失 aiPolicy/sessionSource 时使用已文档化的默认/unknown，而不是拒绝所有旧数据。
- 不支持的未来 rules/replay/facts 版本必须安全失败，不静默降级为当前语义。
- Storage envelope 包含 `progressionVersion`、baseline、facts、unlocks；迁移函数逐版本、纯函数、可重复执行。

## 7. 敏捷交付与每轮固定工作流

每轮交付一个可见或可验证的纵向切片，禁止先堆积空目录和占位接口。

每轮回复必须包含：

- 本轮玩家价值与目标。
- 完成内容和数据边界。
- Debug 自检。
- 架构自检。
- 验证命令和结果。
- commit hash、分支与 push 结果。
- 下一轮目标。
- 是否消耗缓冲轮。

推进规则：验证、提交或推送任一步失败立即停止；每轮只暂存相关文件；发现统计无法从 replay 重建时先修复 facts 边界，不得添加 UI 旁路计数。

## 8. 每轮 Debug 自检

- 能否用最小完成 replay/facts fixture 解释统计或成就结果？
- 失败能否定位到 replay validation、facts derivation、stats、achievement、profile、storage、controller 或 UI？
- 是否覆盖胜/负/平、Classic/Greed、各 AI Policy、每日/普通/导入挑战和旧记录？
- 是否覆盖重复登记、损坏 JSON、配额失败、空数据、迁移、不支持版本和 reset？
- rollup 前后统计与解锁是否一致？
- 未完成或 integrity 失败 replay 是否绝不计数？
- UI 是否有桌面、移动端、键盘、空状态和错误状态 smoke？

## 9. 每轮架构自检

- game 是否完全不知道 progression？
- facts 是否只来自已验证完成 replay 和领域 events？
- stats/achievement 是否只有一个纯事实来源？
- controller/UI/storage 是否避免复制统计和解锁条件？
- profile append 是否幂等，迁移和 rollup 是否确定性？
- Classic/Greed、GS1、AI、replay 与 integrity 是否保持兼容？
- 是否避免提前吸收账号、云、排行榜和 Phase 6 联机范围？
- `origin/`、无关文件和生成产物是否未修改？

## 10. 提交推送门禁

使用 `$project-git-workflow` 包装器和 selected-files-only 策略。每轮按顺序运行：

```text
npm run format:check
npm run lint
npm run test:run
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run arch:check
npm run build
```

创建 `progression:evaluate` 后，同步仓库 Git 工作流配置和文档，使后续功能提交自动执行它。提交使用 Conventional Commits，例如 `feat(progression): derive completed game facts`。不得使用 `--no-verify`、force push 或绕过门禁。

## 11. 分轮安排

1. 口径与合同：记录统计 glossary/ADR、facts/profile/version/error contracts 和数据驱动成就目录，先写固定 fixture。
2. Replay facts：从完成且 integrity 通过的 Classic/Greed replay 派生比分、结果和基础指标。
3. Greed/来源 facts：派生 Bank、损失、streak、AI Policy、daily/random/challenge source，覆盖旧元数据兼容。
4. 幂等 Profile：稳定 record ID、重复 no-op、append 和纯重建，交付最小“完成一局 -> games +1”闭环。
5. 核心统计：胜负平、胜率、得分、分差、模式分组和边界测试。
6. AI/风险统计：difficulty/style、标记、踩雷、Bank、streak、兑现/损失纪录。
7. 成就引擎：目录、纯条件、回溯解锁、解锁来源和 10 个初始成就 fixture。
8. Storage：版本化 envelope、load/save/reset、迁移、损坏/配额降级、1000 facts 与 baseline rollup 等价性。
9. Controller 集成：每局恰好登记一次、失败隔离、sessionSource、历史与 progression 生命周期分离。
10. 统计 UI：总览、模式/AI 维度、个人纪录、空状态、移动/键盘可访问性。
11. 成就/隐私 UI：解锁/未解锁、进度提示、隐私说明、确认 reset 和错误反馈。
12. 评估与文档：新增 progression:evaluate，扩展架构守卫，更新 README/ROADMAP/ARCHITECTURE/CONTRIBUTING 与 Git 工作流门禁。
13. 缓冲轮 1：仅修复前 12 轮问题；无问题则报告未使用且不提交。
14. 缓冲轮 2：仅修复前 12 轮问题；无问题则报告未使用且不提交。
15. 缓冲轮 3：仅修复前 12 轮问题；无问题则报告未使用且不提交。
16. 最终验证：完整门禁、Classic/Greed/旧记录兼容、rollup/迁移、浏览器/Pages、提交链和最终报告；仅在需要修复时提交。

## 12. 验证矩阵

| 关注点        | 必须提供的证据                                                            |
| ------------- | ------------------------------------------------------------------------- |
| Facts         | 完成/incomplete/corrupt replay、v1/v2、AI Policy、sessionSource 和稳定 ID |
| Stats         | 胜负平、胜率分母、得分/分差、模式、AI、风险指标与空数据                   |
| Achievements  | 10 个定义、边界值、回溯解锁、重复 no-op、来源与时间确定性                 |
| Idempotency   | 同一 replay 多次提交只计一次；不同记录不误去重                            |
| Rollup        | 1000 上限、淘汰、baseline 前后统计/解锁完全一致                           |
| Storage       | 首次、损坏、配额、无权限、迁移、未来版本、reset 与隔离                    |
| Controller    | 结束时一次提交、失败不影响游戏、history/progression 互不清空              |
| Compatibility | Classic/Greed、旧 GS1/replay/history、AI 和 integrity 回归                |
| UI            | 总览、分组、纪录、成就、空/错状态、reset、桌面/移动/键盘                  |
| Privacy       | 无网络请求、账号标识、遥测、云 SDK 或隐式上传                             |
| 架构          | game 无 progression；纯 reducer；storage/controller/UI 无口径复制         |
| 发布          | 完整门禁、最新 Actions、HTTPS 资源和人工真实浏览器确认                    |

## 13. PASS 标准

- 完成对局可稳定、幂等地产生 facts，并在重启后保留本地进度。
- 所有统计可由 baseline + retained facts 通过同一 reducer 重建。
- 10 个初始成就数据驱动、可回溯、无重复解锁且不提供规则优势。
- 未完成、损坏、摘要不匹配和不支持版本的 replay 不计入 progression。
- Classic/Greed、AI Policy、daily 和旧记录有明确兼容行为。
- Storage 损坏、配额、无权限和迁移失败不会阻止游戏。
- UI 提供清晰统计、纪录、成就、隐私说明和确认 reset，桌面/移动/键盘可用。
- `src/game/**` 不导入或保存 progression；UI/controller/storage 不复制统计/成就条件。
- 没有账号、云同步、排行榜、遥测、经验值、货币、道具或 Phase 6 联机范围。
- 完整质量门禁、progression 评估、架构检查、浏览器和 Pages 验证通过。
- 所有轮次提交并推送 `origin/main`，工作树干净，`origin/` 未修改。
- 新增 `docs/phase-5-validation-report.md`，记录 schema、口径、迁移、提交链、验证、线上证据和风险。

## 14. 最终报告模板

```text
Phase: Phase 5 - Local progression, statistics, and achievements
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Player-visible delivery: <stats/records/achievements/reset evidence>
Schema versions: <facts/progression/achievement versions>
Derivation evidence: <replay -> facts -> stats/unlocks>
Idempotency and rollup: <duplicate/1000/baseline evidence>
Migration/storage: <versions/corrupt/quota/reset evidence>
Compatibility: <Classic/Greed/GS1/replay/AI/daily/history>
Privacy: <local-only/no network evidence>
Architecture evidence: <pure progression boundaries and arch:check>
Validation: <commands and results>
Commits: <round -> hash>
Remote: origin/main <push result>
Pages: <workflow and HTTPS browser/manual result>
Scope deviations: <none or explicit list>
Residual risks: <explicit list>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
