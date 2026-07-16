# Greedy Sweeper Roadmap

Greedy Sweeper / 贪婪扫雷采用敏捷、小步、可玩的纵向切片推进。路线图定义稳定的阶段顺序和架构方向；每个阶段内的细节可以根据验收反馈调整，但未经架构验收不得提前吸收后续阶段范围。

## Delivery Principles

- 每个阶段只解决一个清晰的玩家价值主题，并保持随时可构建、可测试、可部署。
- 每轮交付必须包含 Debug 自检、架构自检、自动验证、独立提交和远端推送。
- `src/game/` 始终是规则、状态转换和 AI 语义的唯一事实来源。
- 随机性、时间、存储、网络和浏览器行为必须通过明确边界注入或隔离。
- 面向未来联机的准备优先选择可序列化协议、确定性执行和回放，而不是提前引入服务器。
- 新功能优先形成最小可玩闭环，再扩展表现、统计和便利性。
- 阶段完成后由架构师验收；FAIL 只修复当前阶段，PASS 后才规划下一阶段。

## Completed Foundation

### Phase 1 - Foundation and Faithful Refactor

Status: accepted after Pages HTTPS repair.

Delivered:

- React/Vite 可维护工程与 GitHub Pages 发布。
- `app -> ui -> application -> game` 单向依赖边界。
- 纯函数、可序列化、可测试的棋盘、行动转换和 AI 规则。
- 严格的格式、Lint、测试、架构检查、构建、提交和推送工作流。
- 本地启动器、双语 README、架构和贡献文档。

## Planned Feature Sequence

### Phase 2 - Seeded Challenges, Action Log, Replay, and Daily Challenge

Status: accepted. Validation evidence: `docs/phase-2-validation-report.md`.

Player value: 玩家可以复现同一棋盘、分享挑战码、回看完整对局，并参与无需账号的每日挑战。

Architecture value: 建立确定性种子、版本化动作日志和可验证回放，为联机命令协议奠定基础。

Exit criteria:

- 相同规则版本、配置和种子必然生成相同棋盘。
- 挑战码可稳定编码、校验和解码，不暴露完整棋盘答案。
- 回放由初始配置与动作日志重新执行，不保存 UI 快照或复制规则。
- 回放终态与原对局终态一致，并能识别损坏、不兼容和被篡改记录。
- 每日挑战使用稳定 UTC 日期种子，无需后端或账号。
- 历史记录采用版本化本地存储、容量限制和安全降级。

### Phase 3 - AI Difficulty and Play Styles

Status: active planning target.

Player value: 提供简单、普通、困难及可感知的贪婪/保守 AI 风格。

Architecture value: AI 策略保持纯函数，以策略配置和可重复测试驱动，不把难度逻辑散落到控制器或 UI。

Exit criteria:

- 每种难度和性格有明确、可测试的决策原则。
- 使用固定棋盘和 RNG 可重复比较 AI 行为。
- 不通过读取隐藏信息制造伪难度，除非产品规则明确声明。
- Phase 2 回放协议可以完整重现 AI 对局。

### Phase 4 - Greed and Push-Your-Luck Mechanics

Player value: 强化“贪婪扫雷”的辨识度，让继续行动、主动收手和风险收益成为明确决策。

Architecture value: 新规则先形成独立 PRD、平衡参数和规则版本，再进入引擎；旧回放保持可识别或可兼容。

Candidate scope:

- 主动结束回合并结算收益。
- 连击倍率与未结算收益池。
- 踩雷时损失本轮未结算收益。
- 最贪婪回合、最高风险收益等结算反馈。

Exit criteria:

- 先通过小规模平衡原型验证乐趣，再进入正式规则。
- 所有参数集中配置并有确定性规则测试。
- 不破坏旧挑战码、动作日志和回放的版本边界。

### Phase 5 - Local Progression, Statistics, and Achievements

Player value: 提供长期目标、个人纪录、难度战绩和成就反馈。

Architecture value: 统计从已完成对局结果派生，不侵入引擎状态；存储协议可迁移、可清理、可安全恢复。

Exit criteria:

- 统计口径有唯一定义并可由对局记录重算。
- 损坏或旧版本存储不会阻止游戏启动。
- 不引入账号、云同步或隐式数据上传。

### Phase 6 - Online Rooms and Authoritative PvP

Player value: 支持房间邀请码、实时玩家对战、断线重连、观战和在线回放。

Architecture value: 服务端权威执行现有版本化命令协议；客户端不复制或改写游戏规则。

Entry gate:

- Phase 2 的确定性种子、动作日志和回放已稳定。
- Phase 3 至 Phase 5 的规则与存储版本策略已明确。
- 单机引擎可以在无 React、无 DOM 环境运行。

Exit criteria:

- 服务端验证房间、行动顺序、规则版本和状态哈希。
- 客户端支持重连、重复消息幂等和不兼容版本提示。
- 观战和回放复用同一事件协议，不复制业务语义。

## Agile Governance

每个阶段使用相同节奏：目标文档 -> 小步实现 -> 每轮自检/验证 -> 提交推送 -> 最终验收 -> 决定是否进入下一阶段。

路线图不是一次性交付承诺。玩家反馈可以调整阶段内部优先级；涉及规则、协议、存储、联网、安全或兼容性的变化必须先更新目标文档，并由架构师确认后才能实施。
