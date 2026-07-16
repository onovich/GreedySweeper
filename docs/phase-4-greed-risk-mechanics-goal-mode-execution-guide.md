# Phase 4 - Greed and Push-Your-Luck Mechanics

日期：2026-07-17  
状态：给执行者使用的 Phase 4 开发指令文档  
项目：Greedy Sweeper / 贪婪扫雷  
轮次预算：16 轮；第 1-12 轮为主交付，第 13-15 轮为修复缓冲，第 16 轮为最终验证。

## 0. 直接给执行者的 Goal Prompt

为 Greedy Sweeper 增加版本化的 Greed v2 风险收益模式，同时完整保留 Classic v1。Greed 模式保留现有安全翻开基础分立即结算，在连续安全行动中额外累积未兑现奖励池；玩家或 AI 可以主动 Bank 结束回合并兑现奖励，正确标雷自动兑现，踩雷或错误标记会损失奖励池。所有新规则必须位于版本化纯引擎中，旧 GS1、旧动作日志、旧回放、旧历史和 Classic 行为必须继续可用。采用敏捷纵向切片，每轮完成 Debug 自检、架构自检、验证、提交和推送后才能进入下一轮。

## 1. 必读上下文

- `ROADMAP.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/phase-2-protocol.md`
- `docs/phase-2-validation-report.md`
- `docs/phase-3-validation-report.md`
- `src/game/model/contracts.js`
- `src/game/model/factories.js`
- `src/game/engine/transition.js`
- `src/game/replay/replay-engine.js`
- `src/game/replay/contracts.js`
- `src/game/config/protocol-config.js`
- `src/game/ai/`
- `src/application/useGameController.js`
- `scripts/architecture-check.mjs`
- `$donextgoal` 与 `$project-git-workflow`。

Phase 1-3 已验收的 Classic 行为、GS1、回放完整性、AI 公开信息边界和 Git 门禁是事实来源。发现无法兼容时必须停止并回报架构师，不得通过修改旧记录或静默重解释解决。

## 2. 已确定的产品规则

### 2.1 模式与兼容

- `classic` 对应 `rulesVersion: "1"`，行为、状态摘要和旧回放保持不变。
- `greed` 对应 `rulesVersion: "2"`，增加奖励池与 Bank 行动。
- 开发期间 Classic 保持默认；Phase 4 全部 PASS 后，新普通开局默认 Greed，同时保留显式 Classic 入口。
- 旧 GS1 descriptor、旧 Replay v1 和旧历史继续使用 Classic v1。
- 新 Greed challenge 继续使用 GS1 codec 前缀，但 descriptor 明确携带 rules v2 与 greed mode；codec 版本与规则版本保持分离。
- 每日挑战切换到 Greed v2，并使用新的 daily namespace；已有历史记录不重写。

### 2.2 基础分与奖励池

- 现有安全翻开基础分仍立即加入玩家总分，保持原计分反馈和风险下限。
- Greed v2 为当前回合增加 `streak` 与 `bonusPot`，Classic v1 不出现这些状态字段。
- 每次成功安全翻开后 `streak += 1`。
- 本次奖励池增量：`max(0, revealPoints) * min(max(streak - 1, 0), 3)`。
- 第一次安全翻开只建立连击，不增加奖励池；第二次为 `1x`、第三次 `2x`、第四次及以后封顶 `3x`。
- 零分安全翻开可以增加 streak，但不会直接增加奖励池。
- 所有倍率、上限和最小 Bank 条件集中在版本化规则配置中，禁止散落魔法数字。

### 2.3 回合结算

- 新增 `bank` 领域行动，无坐标，只包含行动类型与玩家。
- 只有当前玩家、Greed v2、未结束游戏、且本回合至少有一次安全翻开时可以 Bank。
- Bank 将 `bonusPot` 加入当前玩家总分并立即结束回合。
- 正确标雷继续获得原 `+5`，同时自动兑现当前奖励池，然后结束回合。
- 错误标记继续原 `-5`，损失当前奖励池，然后结束回合。
- 踩雷继续原 `-5`，损失当前奖励池，然后结束回合。
- 兑现或损失后，下一玩家以 `streak: 0, bonusPot: 0` 开始。
- 若最后一颗地雷导致游戏结束，先完成当前行动的兑现/损失，再计算最终胜者。

### 2.4 AI Bank 原则

- AI Bank 决策只能读取公开状态、当前奖励池、AI Policy 和现有风险估计。
- 确定安全行动优先于 Bank；确定地雷允许正确标记并自动兑现。
- 无确定行动时，Bank 与继续行动作为同一策略管线的合法候选比较。
- Conservative 更早兑现，Balanced 使用中性阈值，Greedy 接受更高预期损失但仍遵守集中配置的风险上限。
- Easy 使用注入 RNG 进行可重复选择；Normal/Hard 使用公开风险和稳定平局规则。
- 初始阈值必须集中配置并通过批量种子评估调整；调整必须记录原因和前后指标，不得只凭主观手感。

## 3. 本阶段要完成什么

- 建立规则版本注册与分发边界，冻结 Classic v1 并增加 Greed v2。
- 扩展 Challenge Descriptor 验证以支持明确的 rules/mode 配对，同时兼容旧 GS1。
- 为 Greed v2 建立版本化初始状态、奖励池配置、事件和终态摘要。
- 增加 Bank 领域行动、上下文校验、动作记录与回放支持。
- 实现安全翻开奖励池、主动兑现、正确标雷自动兑现、踩雷/错标损失。
- 保持旧 Replay v1 精确重放；新增 Replay v2/Action Record v2 或等价的显式版本分发，不允许含糊解释。
- 扩展完整性摘要，确保 Greed 奖励池与结算不可被篡改。
- 将 Bank 决策接入 Phase 3 AI Policy，保持公开信息与注入 RNG 边界。
- 提供局前 Classic/Greed 模式选择、奖励池/倍率/风险反馈和 Bank 控件。
- 在本地历史、分享结果、回放和每日挑战中显示规则模式与奖励结算。
- 建立规则 fixture、旧协议兼容、平衡模拟、桌面/移动/键盘 smoke 和线上验收。
- 更新 README、ROADMAP、ARCHITECTURE、CONTRIBUTING 与 `docs/phase-4-validation-report.md`。

## 4. 本阶段不做什么

- 不减少或延迟现有安全翻开基础分，不重写 Classic v1 计分。
- 不增加道具、生命、商店、货币、卡牌、随机事件或第二套棋盘规则。
- 不增加 Phase 5 的成就、长期统计和成长系统。
- 不实现账号、云同步、排行榜、服务器、房间、PvP 或观战。
- 不重新运行旧回放中的 AI 或修改旧完整性摘要定义。
- 不允许 UI/controller/replay 复制 Bank 合法性、倍率或结算规则。
- 不通过隐藏地雷信息帮助 AI 决定 Bank。
- 不修改 `origin/`。

## 5. 架构与协议边界

建议形成显式规则目录，具体文件名可按现有约定调整：

```text
src/game/rules/
  registry.js           # rulesVersion/mode -> factories and transition
  classic-v1.js         # 冻结的 Classic 行为适配
  greed-v2.js           # 奖励池与 Bank 规则
  greed-config.js       # 版本化倍率、上限、AI Bank 调参
src/game/engine/
  transition.js         # 稳定公共入口，委托 rules registry
```

固定边界：

- 规则版本由 Challenge Descriptor/会话显式提供，禁止根据状态字段猜测。
- Classic v1 行为必须由冻结回归 fixture 保护；不要复制整份引擎后分别维护。
- 公共棋盘操作、洪水、计分辅助可共享；版本特有结算通过窄策略接口组合。
- v2 状态新增结构化 `greed` 子对象，至少包含 `streak` 与 `bonusPot`；v1 状态和摘要保持原形。
- Bank 行动无坐标，`isGameAction` 和 Action Record 序列化必须按行动类型校验字段。
- v1 遇到 Bank 必须返回结构化 ignored/invalid 结果，不得静默切换规则。
- 若提升 Replay/Action Record 版本，读取器必须同时支持已发布 v1；写入器只写当前匹配规则的版本。
- Replay 根据 descriptor rulesVersion 选择规则，不允许导入 UI/controller，也不重新执行 AI。
- 完整性摘要必须包含规则版本、mode、奖励池和 Bank 结果，但旧 v1 摘要字节保持不变。
- AI Bank 候选属于 `src/game/ai/**`，实际合法性和结算仍由 rules v2 引擎决定。
- application 只锁定模式、调度 AI 和录制命令；UI 只展示状态并发出 Bank 意图。
- 架构检查器必须禁止 rules 反向导入 application/UI/storage，并继续禁止 replay 导入 AI。

## 6. 敏捷交付与每轮固定工作流

每轮交付一个可验证的纵向切片。优先先锁定 Classic，再逐步开放 Greed；不得先大规模重构再补行为。

每轮回复必须包含：

- 本轮玩家价值与目标。
- 完成内容和规则/协议边界。
- Debug 自检。
- 架构自检。
- 验证命令和结果。
- commit hash、分支与 push 结果。
- 下一轮目标。
- 是否消耗缓冲轮。

推进规则：验证、提交或推送任一步失败立即停止；每轮只暂存相关文件；发现旧回放或 Classic 回归时不得继续扩展功能。

## 7. 每轮 Debug 自检

- 能否用最小 rulesVersion、状态与动作 fixture 解释当前结果？
- 失败能否定位到 registry、Classic、Greed、action contract、replay、AI、controller 或 UI？
- 是否覆盖 Bank 合法/非法、零奖励、正确标雷、错标、踩雷、最后一雷和游戏结束？
- 是否覆盖倍率封顶、零分翻开、连续翻开、兑现和损失后的重置？
- v1/v2、旧/新 Action Record、旧/新 Replay 和损坏数据是否有明确结果？
- 相同 descriptor、动作日志和 RNG 是否得到相同终态摘要？
- UI 是否有桌面、移动端和键盘可重复 smoke？

## 8. 每轮架构自检

- rules registry 是否是版本分发唯一入口？
- Classic v1 是否保持冻结而非被 Greed 条件污染？
- 奖励池、Bank 合法性和结算是否只存在于 game rules？
- AI/controller/UI/replay 是否避免复制倍率和结算语义？
- 旧 GS1、旧 Replay、旧完整性摘要和旧历史是否保持兼容？
- AI Bank 是否只使用公开信息和注入 RNG？
- 是否避免提前吸收 Phase 5-6 范围？
- `origin/`、无关文件与生成产物是否保持不变？

## 9. 提交推送门禁

使用 `$project-git-workflow` 包装器和 selected-files-only 策略，每轮按顺序运行：

```text
npm run format:check
npm run lint
npm run test:run
npm run ai:evaluate
npm run arch:check
npm run build
```

涉及规则和平衡的轮次还必须运行新增的确定性平衡评估命令。提交使用 Conventional Commits，例如 `feat(rules): add versioned greed bonus pot`。不得绕过验证、使用 `--no-verify` 或 force push。

## 10. 分轮安排

1. PRD/ADR 与冻结基线：记录 v1/v2、公式、事件、模式默认策略，增加 Classic 黄金 fixture 和旧 replay 摘要测试。
2. Rules registry：建立显式版本分发和 rules/mode 校验，保持所有现有调用与测试通过。
3. Greed v2 状态：增加版本化规则配置、初始 greed 状态、事件词汇和确定性序列化。
4. Bank 合同：增加无坐标 Bank action、类型化校验、v1 拒绝、v2 合法性和 Action Record 版本策略。
5. 奖励池纵向切片：实现 streak、奖励公式、倍率封顶和 UI 最小奖励显示。
6. 结算纵向切片：Bank 兑现、正确标雷自动兑现、错标/踩雷损失、回合重置与最后一雷顺序。
7. Replay/Integrity：同时读取旧 v1 和新 v2，保护旧摘要，验证 Bank/奖励篡改、截断和版本错误。
8. AI Bank：候选、公开风险、difficulty/style 决策、注入 RNG、确定性与反作弊测试。
9. 模式 UI：局前 Classic/Greed、开局锁定、Bank 控件、奖励池/倍率/风险反馈和键盘操作。
10. Phase 2/3 集成：挑战码、每日 namespace、分享结果、本地历史、回放标签与旧记录兼容。
11. 平衡与可访问性：批量种子模拟、阈值前后指标、桌面/移动/键盘 smoke、文案和反馈收口。
12. 默认切换与文档：仅在全部平衡/回归门禁通过后将普通新游戏默认设为 Greed；同步 README/ROADMAP/ARCHITECTURE/CONTRIBUTING 和架构守卫。
13. 缓冲轮 1：仅修复前 12 轮问题；无问题则报告未使用且不提交。
14. 缓冲轮 2：仅修复前 12 轮问题；无问题则报告未使用且不提交。
15. 缓冲轮 3：仅修复前 12 轮问题；无问题则报告未使用且不提交。
16. 最终验证：完整门禁、Classic/旧协议兼容、Greed fixture、平衡评估、浏览器/Pages、提交链和最终报告；仅在需要修复时提交。

## 11. 验证矩阵

| 关注点       | 必须提供的证据                                                 |
| ------------ | -------------------------------------------------------------- |
| Classic 冻结 | 现有规则 fixture、61 项基线、旧 GS1/replay/摘要精确通过        |
| Registry     | rules/mode 合法配对、未知版本、错误模式与显式分发测试          |
| 奖励公式     | streak、0/1/2/3x、封顶、零分、确定性和配置单一来源             |
| Bank         | 合法/非法、兑现、零奖励、回合切换、动作记录和重放              |
| 终止行动     | 正确标雷自动兑现；错标/踩雷损失；最后一雷顺序                  |
| 协议         | v1/v2 Action Record/Replay、旧历史、损坏/截断/篡改/版本错误    |
| AI           | Bank 风格差异、公开信息等价、注入 RNG、固定 fixture 与批量评估 |
| UI           | 模式锁定、奖励池、Bank、风险反馈、桌面/移动/键盘 smoke         |
| Daily/share  | v2 namespace、模式标签、旧记录兼容和结果文案                   |
| 架构         | rules 唯一事实来源，replay 无 AI，UI/controller 无结算复制     |
| 发布         | 完整门禁、最新 Actions、HTTPS 资源和人工真实浏览器确认         |

## 12. PASS 标准

- Classic v1 的行为、GS1、旧 replay、旧摘要和旧历史保持可用且回归通过。
- Greed v2 完整交付连续奖励池、Bank、正确标雷兑现和失败损失闭环。
- 规则公式、倍率和结算只存在于版本化 game rules/config。
- 新模式、状态、动作、Replay 和完整性摘要显式版本化且可确定性重放。
- AI 能按 difficulty/style 决定 Bank，只使用公开信息和注入 RNG。
- UI 清晰展示模式、奖励池、倍率与风险，Bank 在桌面/移动/键盘可用。
- 每日挑战、分享、本地历史和回放正确显示规则模式，并兼容旧数据。
- 平衡评估记录初始参数、调整原因和结果；不存在明显无限刷分或无意义 Bank 路径。
- 全部质量门禁、规则/AI 评估、架构检查、浏览器与 Pages 验证通过。
- 未引入 Phase 5-6、账号、联网、排行榜、道具或隐藏信息作弊。
- 所有轮次提交并推送 `origin/main`，工作树干净，`origin/` 未修改。
- 新增 `docs/phase-4-validation-report.md`，记录规则版本、提交链、兼容、平衡、验证、线上证据和风险。

## 13. 最终报告模板

```text
Phase: Phase 4 - Greed and push-your-luck mechanics
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Player-visible delivery: <mode/pot/bank/feedback evidence>
Rules and protocol versions: <classic/greed/action/replay versions>
Classic compatibility: <fixtures/old GS1/replay/summary/history>
Greed rule evidence: <formula/bank/settlement fixtures>
AI Bank evidence: <difficulty/style/public-info/determinism>
Balance evaluation: <parameters, samples, before/after findings>
Architecture evidence: <registry/source-of-truth/arch:check>
Validation: <commands and results>
Commits: <round -> hash>
Remote: origin/main <push result>
Pages: <workflow and HTTPS browser/manual result>
Scope deviations: <none or explicit list>
Residual risks: <explicit list>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
