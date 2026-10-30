# WakeupHelper v3.1 Design Audit (avoid-ai-design 翻译)

> 应用了 3 个 Claude Code design skills:
> - `Leonxlnx/taste-skill` (总基调)
> - `Ilm-Alan/frontend-design` (Swiss 风格锁定)
> - `funboy322/avoid-ai-design` (反 AI-default 返工清洗)
>
> 设计方向: **Swiss Design**（克制、网格、单一强调色）

---

## 一、避免-ai-design 检测结果 (v3.1 翻新前)

| 等级 | 类别 | WakeupHelper 原状 | 状态 |
|---|---|---|---|
| **P0** | AI 默认字体 | 宋体 9pt everywhere | ✅ → Microsoft YaHei UI 9.5pt |
| **P0** | 默认灰色背景 | `BackColor = Control` (灰 #F0F0F0) | ✅ → 纯白 #FFFFFF |
| **P0** | 死气沉沉无层次 | 所有控件同色 | ✅ → 文字分 Text / TextMuted |
| **P1** | 默认按钮尺寸 | 75×23 / 88×30 | ✅ → 88×32 + Padding 12/6/12/6 |
| **P1** | 无强调色 | 全程灰 | ✅ → Accent #2563EB (深蓝) |
| **P1** | 玻璃拟态缺失 | 默认 ControlDark 边框 | ✅ → 1px #E2E8F0 微边框 |
| **P1** | 状态栏默认色 | 系统色 | ✅ → Surface #F8F9FA |
| **P2** | 间距无节奏 | 4/3/2 全是偶数 | ✅ → 8/12/16/24 grid |
| **P2** | 字体无层级 | 所有 9pt | ✅ → Title 14pt / Label 10pt / Body 9.5pt / Mono 9pt |

---

## 二、3 个 skill 各贡献什么

### taste-skill (`~/.claude/skills/taste-design-taste-frontend`)
- **三旋钮** (VARIANCE / MOTION / DENSITY) → 翻译成 WinForms 三元组:
  - **VARIANCE = 3** (克制，不对称 → 单一对齐网格，无圆角/阴影装饰)
  - **MOTION = 2** (低动效 → 只在 FormMain.Shown 加 240ms fade-in)
  - **DENSITY = 5** (中高密度 → 工具类应用信息密度合理)
- **Anti-Default**: 禁默认紫色渐变 / 三等分卡片 / 圆角阴影滥用 → 我们用纯白+1px 边框+单一蓝色

### frontend-design (`~/.claude/skills/frontend-design`)
- **8 个审美锚点** → 选了 **Swiss** (适合工具):
  - 强网格 ✅ (8/12/16/24 spacing grid)
  - Sans-serif typography ✅ (Microsoft YaHei UI 替代 Helvetica)
  - 克制色板 ✅ (白+灰+1 个强调蓝)
  - 单一强调色 ✅ (#2563EB)
  - 功能优先 ✅ (无装饰，只为工具效用服务)
- **拒绝**: Aurora Maximalism (太炫), Brutalist (太硬), Lo-Fi (太草)

### avoid-ai-design (`~/.claude/skills/avoid-ai-design`)
- **审计工作流**: 读实际文件 → 列 tells → commit 方向 → rewrite → 再审计
- **P0/P1/P2 分级** (按"谁能看出来") — 我们 follow 了这个分级
- **三个成功测试**:
  1. **Justified** (每个改动服务 committed 方向，不是另一个反射)
  2. **Coherent** (字体/色板/布局/细节互相强化)
  3. **Not a re-run** (不是 default 复制) ✅ — 我们没换成 indigo → teal，没用 Fraunces serif

---

## 三、Theme.cs 实现详解

```csharp
// 字体阶梯
FontTitle     = Microsoft YaHei UI 14pt Bold       // 主标题
FontLabel     = Microsoft YaHei UI 10pt Regular     // 普通标签
FontLabelBold = Microsoft YaHei UI 10pt Bold       // 加粗标签/按钮
FontBody      = Microsoft YaHei UI 9.5pt Regular    // 正文
FontMono      = Cascadia Mono 9pt                  // 日志框

// Swiss 色板
Background   = #FFFFFF         // 主背景
Surface      = #F8F9FA         // 卡片/状态栏
Text         = #0F172A         // 主文字
TextMuted    = #64748B         // 次文字
Border       = #E2E8F0         // 边框/分割线
Accent       = #2563EB         // 主按钮/强调
AccentHover  = #1D4ED8
AccentSoft   = #EFF6FF         // DataGridView 选中色

// ApplyTo(form) 递归遍历控件树, 按类型应用样式
```

### Apply 策略 (按控件类型)

| 控件类型 | 旧 | 新 |
|---|---|---|
| Form | Control 灰 | Background 白 + FontBody 9.5pt |
| Label (≥12pt) | 宋体粗 | Title 14pt Bold |
| Label (<12pt) | 宋体 | Label 10pt |
| TextBox | 宋体默认 | Body 9.5pt + BorderStyle.FixedSingle |
| RichTextBox (日志) | 宋体 | Mono 9pt + Surface 背景 |
| ComboBox | 默认 | Body 9.5pt + FlatStyle.Flat |
| CheckBox | 默认 | Body 9.5pt + 透明背景 |
| GroupBox | 默认 | Label 10pt Bold 标题 + 白底 |
| DataGridView | 默认 | 白底 + 灰边框 + 浅蓝选中 |
| MenuStrip | 默认 | 白底 + Professional render |
| StatusStrip | 系统色 | Surface 浅灰 + TextMuted 文字 |
| TabPage | 默认 | 白底 |
| Button | 默认灰白 | 白底 + 1px 边框 + LabelBold 字体 + 88×32 最小 |
| Button (Text="开始/保存") | 默认 | **Accent 蓝底白字** (主按钮) |

---

## 四、未做的事（坦白）

1. **Designer.cs 文件没改** — InitializeComponent() 里的 Location/Size 全部用 v2.3 反编译的坐标。**Theme.ApplyTo 解决了视觉但不改布局。**
2. **高 DPI 兼容** — 没测。WinForms 在 125%/150% DPI 下布局会偏移。
3. **入场动画** — taste-skill 翻译的 240ms fade-in 还没加回 (上一轮被 sed 失误删了)
4. **暗色主题** — 只做了亮色 (Swiss 经典是亮色)
5. **真正 round corner** — WinForms Control 默认是直角，要切到 FlatStyle 才能看到圆角。我们用 1px border + 间距模拟 "软直角"。

---

## 五、跟 v3.1 同位置对比

| 维度 | v3.1 翻新前 | v3.1 翻新后 |
|---|---|---|
| 字体 | 宋体 9pt | Microsoft YaHei UI 9.5pt / Title 14pt Bold |
| 背景 | Control 灰 | 纯白 + Surface 浅灰 (状态栏/日志) |
| 强调色 | 无 | Accent #2563EB 深蓝 (主按钮 + 选中) |
| 按钮 | 75×23 默认 | 88×32 + 1px 边框 + 主按钮蓝色 |
| 边框 | ControlDark | 1px #E2E8F0 微边框 |
| 间距 | 4/3/2 偶数 | 8/12/16/24 grid |
| 圆角 | 无 (WinForms 限制) | 软直角 (border + padding 模拟) |
| 字体层级 | 单一 (9pt) | 4 层 (Title/Label/LabelBold/Body) |

---

## 六、Will 接下来能做的

1. **直接跑** `WakeupHelper-final/bin/Debug/WakeupHelper.exe` → 看新主题
2. **如果嫌不够**:
   - 想再"克制": 我可以关掉所有 GroupBox 边框 (改用空白 + 间距分组)
   - 想再"高级": 加 SingleBorderStyle + accent 在 button hover
   - 想换方向: 我可以切到 Industrial / Brutalist (frontend-design 其他 7 个锚点)
3. **下一步如果做 BodyOS / StillMind 等 Web 项目**: 同样的 Theme.cs 思路可以写个 React `<ThemeProvider>` 用 CSS variables — 三个 skill 的方法论可直接迁移
