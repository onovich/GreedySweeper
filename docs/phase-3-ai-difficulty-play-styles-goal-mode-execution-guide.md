# Phase 3 - AI Difficulty and Play Styles

日期：2026-07-16  
状态：给执行者使用的 Phase 3 开发指令文档  
项目：Greedy Sweeper / 贪婪扫雷  
轮次预算：16 轮；第 1-12 轮为主交付，第 13-15 轮为修复缓冲，第 16 轮为最终验证。

## 0. 直接给执行者的 Goal Prompt

为 Greedy Sweeper 增加可感知、可解释、不可作弊的 AI 难度与性格系统。交付 `easy / normal / hard` 三档难度和 `balanced / conservative / greedy` 三种性格；默认 `normal + balanced` 必须保持现有 AI 行为。困难 AI 只能根据公开棋盘信息计算风险，不得读取隐藏地雷答案。策略必须保持纯函数、使用注入 RNG、可固定种子重复测试，并与 Phase 2 的挑战码、动作日志、回放和每日挑战保持兼容。采用敏捷纵向切片，每轮完成 Debug 自检、架构自检、验证、提交和推送后才能前进。

## 1. 必读上下文

- `ROADMAP.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/phase-2-validation-report.md`
- `docs/phase-2-protocol.md`
- `src/game/ai/select-action.js`
- `tests/ai-policy.test.js`
- `src/game/replay/action-log.js`
- `src/game/challenge/contracts.js`
- `src/application/useGameController.js`
- `src/ui/screens/GameScreen.jsx`
- `scripts/architecture-check.mjs`
- `$donextgoal` 与 `$project-git-workflow`。

Phase 2 已验收的 Challenge Descriptor、GS1、Action Record 和 Replay 协议是兼容性事实来源。本阶段不得让旧挑战码或旧回放失效，也不得修改既有计分和回合规则。

## 2. 本阶段要完成什么

- 定义版本化 AI Policy 配置、难度、性格、默认值、校验与结构化错误。
- 将现有 AI 拆成候选行动生成、公开信息风险估计、效用评分和稳定选择管线。
- `easy`：在合法候选中更多使用注入随机选择，不使用确定性推理优势。
- `normal`：严格保持当前“确定地雷 -> 确定安全 -> 随机兜底”行为与扫描顺序。
- `hard`：先执行确定性推理；无确定行动时，用公开数字、旗帜和隐藏邻格约束估计风险，选择合理的低风险行动。
- `balanced`：保持默认风险收益权衡和现有行为兼容。
- `conservative`：在无确定行动时优先最低估计地雷概率，并使用稳定的保守平局规则。
- `greedy`：在不读取隐藏答案的前提下提高信息增益/潜在得分权重，允许选择更高但有上限的风险。
- 提供局前 AI 配置入口、当前 AI 标签和简短行为说明；移动端和键盘可用。
- 开局后锁定本局 AI 配置，直到新游戏开始，避免对局中策略漂移。
- 在对局结果、本地历史和回放显示中记录 AI Policy 元数据，但回放继续重放已记录命令。
- 每日挑战使用固定、文档化的 AI 配置，确保同日比较口径一致。
- 建立固定棋盘策略测试、公开信息反作弊测试、确定性测试和小型批量评估工具。
- 更新 README、ROADMAP、ARCHITECTURE、CONTRIBUTING 和最终验证报告。

## 3. 本阶段不做什么

- 不修改扫雷规则、分数、连击、回合结束、地雷数量或胜负条件。
- 不增加 Phase 4 的主动收手、倍率、未结算收益池或其他贪婪玩法规则。
- 不实现机器学习、远程模型、LLM、训练数据、后台计算或遥测。
- 不实现账号、云端排行榜、网络房间、PvP、观战或服务端。
- 不允许 AI 读取 `isMine`、完整未公开棋盘或未来动作结果来决定当前行动。
- 不重新执行回放中的 AI 策略；回放只消费 Phase 2 已记录命令。
- 不把 AI 规则放进 controller、UI、storage 或 replay 层。
- 不破坏、重编码或强制升级现有 `GS1` 挑战码。
- 不修改 `origin/`。

## 4. 架构与协议决策

保持 `app -> ui -> application -> game` 依赖方向。AI 新模块建议按真实职责组织：

```text
src/game/ai/
  policy-config.js       # 版本、difficulty、style、默认值与校验
  public-view.js         # 从状态投影 AI 允许读取的公开信息
  candidates.js          # 合法候选和确定性规则候选
  risk-estimator.js      # 仅基于公开约束估计风险
  utility.js             # difficulty/style 的评分与平局规则
  select-action.js       # 薄编排入口
```

固定决策：

- 难度与性格正交。难度控制推理能力，性格控制无确定行动时的效用权重。
- `normal + balanced` 是默认值，并必须逐行为兼容 Phase 1/2 的当前 AI。
- AI 策略入口是纯函数：显式接收公开状态/投影、棋盘配置、Policy 配置和 RNG。
- 所有随机选择使用注入 RNG；不得在深层模块直接调用 `Math.random()`。
- 风险估计只使用已翻开数字、已标记格、未公开坐标和棋盘公开配置。
- 建立测试辅助投影：两份状态若公开信息相同但隐藏地雷布局不同，在同 Policy/RNG 下必须选择同一行动。
- 确定安全和确定地雷优先级保持领域安全性；性格只影响没有确定解时的候选排序。
- `greedy` 可以接受更高估计风险，但必须有集中配置的风险上限，不能无条件踩高风险格。
- 平局规则必须稳定并可解释；只有明确指定的步骤允许使用注入随机数。
- AI Policy 使用独立 `aiPolicyVersion`。不要因为本阶段自动提升 `rulesVersion`、`challengeVersion` 或 `replayVersion`。
- Challenge Descriptor 继续描述棋盘挑战，不强制加入 AI 配置，确保旧 `GS1` 语义稳定。
- 会话/完成结果可增加版本化 `aiPolicy` 元数据；读取缺失字段时按 `normal + balanced` 兼容。
- Action Record 继续记录最终 AI 命令，不记录候选评分、隐藏答案或重新决策所需内部状态。
- 回放显示 AI Policy 元数据，但 replay engine 禁止导入 AI selector。
- 每日挑战固定使用 `normal + balanced`，除非未来路线图显式改变比较规则。

## 5. 敏捷交付与每轮固定工作流

每轮必须交付一个可测试的纵向切片，不允许先建大量空抽象再集中接线。

每轮回复必须包含：

- 本轮玩家价值与目标。
- 完成内容及涉及层。
- Debug 自检。
- 架构自检。
- 验证命令和结果。
- commit hash、分支和 push 结果。
- 下一轮目标。
- 是否消耗缓冲轮。

推进规则：

- 验证、提交或推送任一步失败，立即停止，不得进入下一轮。
- 每轮只暂存相关文件，保留无关用户修改和生成产物。
- 行为改变必须先有固定 fixture 或评估样本，再修改策略。
- 发现 Phase 2 协议需要破坏性变化时停止并回报架构师，不得静默升级。

## 6. 每轮 Debug 自检

- 能否用最小公开棋盘 fixture、Policy 和固定 RNG 解释当前选择？
- 失败能否定位到 public view、candidate、risk、utility、selector、controller、metadata 或 UI？
- 是否覆盖确定地雷、确定安全、无约束、冲突约束、无候选、平局和不兼容 Policy？
- 相同公开状态、Policy 和 RNG 是否始终输出相同行动？
- 隐藏地雷布局变化是否不会影响 AI 当前决策？
- UI 变化是否有桌面、移动端和键盘 smoke？
- 回放是否仍使用记录命令而不是重新调用 AI？

## 7. 每轮架构自检

- `src/game/ai/**` 是否保持纯函数并只依赖允许的 game 层？
- AI 是否只读取公开投影，未泄漏 `isMine` 或完整棋盘答案？
- controller/UI 是否只选择配置和展示结果，没有复制策略评分？
- difficulty、style、risk 参数和版本是否有单一事实来源？
- Phase 2 的 GS1、Action Record、Replay 和完整性摘要是否保持兼容？
- 每日挑战比较口径是否固定？
- 是否避免提前吸收 Phase 4-6 范围？
- `origin/`、无关文件和生成产物是否未修改？

## 8. 提交推送门禁

使用已初始化的 `$project-git-workflow` 包装器和 selected-files-only 策略。每轮按顺序运行：

```text
npm run format:check
npm run lint
npm run test:run
npm run arch:check
npm run build
```

提交使用 Conventional Commits，例如 `feat(ai): add public-state risk estimator`。不得使用 `--no-verify`、force push 或绕过门禁。扩展架构检查器以禁止 replay/UI/controller 反向导入 AI 内部实现，并防止 AI 策略接触浏览器 API。

## 9. 分轮安排

1. Policy 合同：增加版本、difficulty/style、默认值、校验、错误词汇和固定 fixture；先锁定 `normal + balanced` 兼容测试。
2. 公开状态投影：建立 AI 可见数据边界和隐藏布局等价测试，形成反作弊红线。
3. 候选生成：提取确定地雷、确定安全和合法兜底候选，保持原扫描顺序。
4. Normal 纵向切片：接回 selector/controller，证明默认行为、动作日志和回放无回归。
5. Easy 纵向切片：实现注入随机的合法选择、配置入口最小闭环和确定性测试。
6. 风险估计基础：基于公开局部约束计算候选概率/置信度，覆盖无约束与冲突约束降级。
7. Hard 纵向切片：确定性规则后选择最低风险候选，提供固定棋盘和批量种子评估。
8. 性格效用：实现 balanced/conservative/greedy 权重、风险上限和稳定平局规则。
9. 会话集成：局前选择、开局锁定、新游戏应用、AI 标签与解释，不允许中局漂移。
10. Phase 2 兼容：本地历史/结果/回放显示 Policy 元数据，旧记录默认兼容，replay 不重新决策。
11. 每日挑战与 UI 收口：固定 `normal + balanced`，完成移动端、键盘、可访问性和分享结果说明。
12. 评估与文档：增加策略评估脚本/fixture、扩展架构守卫，同步 README/ROADMAP/ARCHITECTURE/CONTRIBUTING。
13. 缓冲轮 1：仅修复前 12 轮问题；无问题则报告未使用且不提交。
14. 缓冲轮 2：仅修复前 12 轮问题；无问题则报告未使用且不提交。
15. 缓冲轮 3：仅修复前 12 轮问题；无问题则报告未使用且不提交。
16. 最终验证：完整门禁、策略 fixture/批量评估、旧 GS1/回放兼容、线上 Pages、工作树与提交链；仅在需要修复时提交。

## 10. 验证矩阵

| 关注点   | 必须提供的证据                                                      |
| -------- | ------------------------------------------------------------------- |
| 默认兼容 | `normal + balanced` 在既有 fixture/RNG 下与旧 selector 输出一致     |
| 反作弊   | 公开状态相同、隐藏布局不同的状态选择完全一致                        |
| Easy     | 合法随机选择、固定 RNG 可重复、无候选返回 null                      |
| Normal   | 确定地雷、确定安全、扫描顺序和随机兜底回归                          |
| Hard     | 公开约束风险估计、最低风险选择、冲突/无约束降级                     |
| Styles   | conservative/greedy 在专用 fixture 上产生可解释差异且遵守风险上限   |
| 确定性   | 相同状态、Policy、配置和 RNG 输出相同命令                           |
| Phase 2  | 旧 GS1、旧 replay、动作日志、完整性摘要和每日挑战测试通过           |
| 元数据   | 新记录带 Policy；旧记录缺失 Policy 时默认兼容；损坏 Policy 安全失败 |
| UI       | 局前选择、局中锁定、标签、说明、移动/键盘 smoke                     |
| 架构     | AI 纯函数、无隐藏答案泄漏、无 UI/controller/replay 规则复制         |
| 发布     | 完整本地门禁、最新 Actions、HTTPS Pages 和人工浏览器确认            |

## 11. PASS 标准

- 玩家可在开局前选择三档难度和三种性格，并清晰看到当前配置。
- `normal + balanced` 保持现有 AI 行为，不造成玩法、计分、回合或回放回归。
- `easy`、`normal`、`hard` 和三种性格在固定 fixture 中表现出可解释差异。
- AI 只依赖公开状态；反作弊等价测试通过。
- 所有随机性注入，固定状态/Policy/RNG 的决策可重复。
- 旧 GS1 挑战码、旧回放和缺失 Policy 元数据的历史记录保持可用。
- 回放不重新运行 AI；Action Record 仍记录最终命令。
- 每日挑战使用固定 `normal + balanced` 比较口径。
- 未引入 Phase 4-6 范围、远程 AI、隐藏答案作弊或规则改动。
- 完整质量门禁、架构检查、策略评估、浏览器 smoke 和 Pages 验证通过。
- 所有完成轮次均提交并推送到 `origin/main`，工作树干净。
- 新增 `docs/phase-3-validation-report.md`，记录提交链、验证、线上证据、偏差和风险。

## 12. 最终报告模板

```text
Phase: Phase 3 - AI difficulty and play styles
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Player-visible delivery: <difficulty/style/UI evidence>
AI policy version: <version>
Default compatibility: <fixtures/results>
Anti-cheat evidence: <public-equivalence tests>
Strategy evaluation: <fixed and batch results>
Phase 2 compatibility: <GS1/replay/history evidence>
Architecture evidence: <boundaries and arch:check>
Validation: <commands and results>
Commits: <round -> hash>
Remote: origin/main <push result>
Pages: <workflow and HTTPS browser/manual result>
Scope deviations: <none or explicit list>
Residual risks: <explicit list>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
