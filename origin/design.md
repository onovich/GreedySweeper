项目交接文档

1. 项目名称

Greedy Sweeper (贪婪扫雷)

2. 需求设计文档 (PRD)

2.1 项目背景与定位

本项目是一个基于 React 开发的单页面 Web 游戏。它将传统的单人扫雷改造为人机对战（玩家 vs AI）的回合制博弈游戏。游戏引入了风险收益并存的抢分系统和连击机制。

2.2 核心游戏规则

胜利条件：棋盘上所有地雷（共40个）被找出（正确标记或被踩爆）时游戏结束，总分高者获胜。

回合机制：

玩家固定先手，随后与 AI 轮流行动。

连击（Combo）：翻开安全区，玩家/AI 可保持当前回合，继续行动。

回合结束（Turn End）：一旦执行“标记”操作（无论对错），或“踩雷”，当前回合立即结束，控制权交接。

抢分系统（核心特色）：

翻开安全区：翻开格子上的数字是几，就得几分（+N）。若触发大面积连续翻开（泛洪），波及到的所有数字块得分累加。

正确标记地雷（插旗）：得 +5 分（高回报）。

错误标记地雷：扣 -5 分（高风险惩罚），该格子被强制翻开并打上红色大叉 X。

踩雷：扣 -5 分，强制翻开地雷。

2.3 UI/UX 设计规范

视觉风格：暗黑科技风（Dark Mode），使用 Tailwind CSS 的深色背景（bg-gray-900/950）配合高对比度荧光色（蓝、红、绿、紫）。

交互适配：

PC端：左键翻开，右键标记。

移动端：短按（Click/Tap）翻开，长按 400ms（Long Press）标记。屏蔽浏览器默认的右键菜单和文本选中。

反馈动效：回合切换时的外发光切换、标错地雷时的红底闪烁+红叉（Lucide X icon）、AI 思考时的 animate-pulse 效果。

3. 技术架构规划 (Architecture)

3.1 技术栈

核心框架：React 18+ (Hooks: useState, useEffect, useRef)

样式方案：Tailwind CSS (原子化 CSS，直接在 className 中编写)

图标库：lucide-react (提供轻量级 SVG 图标：Flag, Bomb, User, Cpu, X 等)

构建约束：单文件架构 (Single-File Architecture)。所有逻辑、组件、样式必须收敛于单一的 App.jsx 文件中，不可拆分文件。

3.2 模块划分 (位于 App.jsx 内)

常量定义区：定义行列数 (ROWS, COLS)、地雷总数 (TOTAL_MINES)、分数配置、延时配置。

纯函数工具区：getNeighborsCoords (获取8邻域)、getNumberColor (数字颜色映射)。

主组件 App：

State 层：集中管理整个棋盘和对战状态。

Ref 层：管理长按定时器和长按状态。

Logic 层：初始化、泛洪算法、行动判定引擎 (processMove)。

AI 引擎：基于 useEffect 监听回合变化的自动化逻辑。

Render 层：顶栏、计分板、棋盘网格、控制台的 JSX 渲染。

4. 技术文档 (Technical Details)

4.1 核心状态数据结构 (State)

整个游戏状态由一个聚合的 gameState 对象维护，避免渲染不同步：

const [gameState, setGameState] = useState({
  board: [],             // 2D 数组，存储所有格子的状态 (见 4.2)
  humanScore: 0,         // 玩家当前得分
  aiScore: 0,            // AI当前得分
  gameOver: false,       // 游戏是否结束
  minesFound: 0,         // 已被处理的地雷数量（标记或爆炸）
  currentPlayer: 'human',// 当前回合控制权：'human' | 'ai'
  actionMessage: ''      // 界面顶部的实时播报文本
});


4.2 棋盘单元格数据结构 (Cell Data)

board[r][c] 包含以下严格属性：

{
  isMine: boolean,        // 是否是地雷
  isRevealed: boolean,    // 是否已被翻开（暴露）
  isFlagged: boolean,     // 是否被标记
  isWrongFlag: boolean,   // UX标记：是否是错误的标记（用于渲染惩罚红叉）
  flagger: string | null, // 标记者的身份：'human' | 'ai'
  neighborMines: number,  // 周围8个格子中的地雷总数 (0-8)
  isExploded: boolean     // 是否是因踩雷而爆炸的状态
}


4.3 核心方法解析

initGame(): 初始化网格，随机布雷，预计算所有 neighborMines。

floodFill(startR, startC, board): 深度优先搜索 (DFS)。当翻开 neighborMines === 0 的格子时触发，递归翻开相邻块。关键返回值：返回在蔓延过程中翻开的“带有数字的格子”的数字总和，用于计分。

processMove(state, r, c, isRightClick, player): 游戏引擎核心。

接收当前状态、操作坐标、操作类型、操作者。

计算得分变化（处理 +5, -5 或累加泛洪得分）。

判定回合是否结束（切换 nextPlayer）。

判定游戏是否结束（检查 newMinesFound === TOTAL_MINES）。

返回全新的不可变 (Immutable) State 对象。

4.4 AI 逻辑实现方案

位于 useEffect 中，依赖于 gameState 的变化触发。

触发条件：!gameOver && currentPlayer === 'ai'。使用 setTimeout (AI_DELAY) 模拟思考。

推理阶段 1（必然为雷）：遍历已翻开的数字格子，若 未翻开数 + 已标旗数 === 数字，则剩余未翻开的必然是地雷，执行右键标记操作。

推理阶段 2（必然安全）：若 已标旗数 === 数字，则周围剩余未翻开的必然是安全区，执行左键翻开操作。

随机兜底机制 (Fallback)：若遍历全局未找到确切逻辑，AI 会随机从所有未翻开且未标记的格子中挑选一个执行左键翻开（盲猜）。

4.5 接手 AI 的后续维护建议 (Next Steps / Optimization)

如果需要对该项目进行后续开发，建议可以从以下方向入手：

AI 智商升级：目前的随机兜底机制是纯随机，可升级为“基于边缘概率计算的智能猜测”，让 AI 优先点击概率最安全的格子。

网络对战：通过提取 processMove 逻辑，配合 WebSocket，可重构为真实的双人在线联机对战。

动效优化：考虑引入 framer-motion 替代当前的简单 Tailwind CSS 过渡，增加得分飘字效果。