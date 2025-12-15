# English AI Helper - 语境英语助手

**English AI Helper** 是一款基于语境的智能 Chrome 浏览器插件，旨在帮助用户在阅读英文网页时高效积累词汇。它利用 **DeepSeek AI** 进行精准的语境翻译，并通过 **GitHub Gist** 实现跨设备生词本同步。

## ✨ 主要功能

- **🤖 语境感知翻译**: 利用 AI 分析单词在当前句子中的具体含义（例如区分 *run* 是"跑步"还是"经营"），并自动提取单词原形（Lemma）。
- **📚 智能生词本**: 自动保存查询过的单词及其原始例句、来源 URL 和时间戳。
- **🖍️ 自动高亮复习**: 浏览网页时，自动高亮曾查询过的生词（"Learning"状态），点击即可浮窗复习。
- **🔄 云端同步**: 支持配置 GitHub Token，将生词本自动同步到私有 Gist，实现多设备共享。
- **📊 可视化仪表盘**: 提供独立的单词管理页面，支持按频率热力图展示、卡片/表格视图切换、导出/导入数据。
- **⚡ 高效缓存**: 本地优先策略，自动识别单词变体（如 *running* -> *run*），避免重复消耗 API Token。

## 🚀 安装指南

1. **下载源码**:
   ```bash
   git clone https://github.com/yourusername/english-helper.git
   ```
2. **加载插件**:
   - 在 Chrome 地址栏输入 `chrome://extensions` 并回车。
   - 打开右上角的 **开发者模式 (Developer mode)** 开关。
   - 点击左上角的 **加载已解压的扩展程序 (Load unpacked)**。
   - 选择本项目的根目录。

## ⚙️ 配置说明

安装完成后，点击浏览器右上角的插件图标，进入设置页面进行配置：

### 1. DeepSeek API Key (必填)
- 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 申请 API Key。
- 本插件利用 DeepSeek 的强大推理能力进行语境分析和单词原形提取。

### 2. GitHub Token (选填 - 推荐配置)
- 用于实现多设备间的生词本同步。
- 前往 [GitHub Settings > Developer settings > Tokens](https://github.com/settings/tokens) 生成一个新的 Token (Classic)。
- **权限要求**: 必须勾选 `gist` 权限（Create gists）。
- **Gist ID**: 配置好 Token 后，插件首次同步时会自动创建一个私有 Gist 并回填 ID。若需在另一台设备同步数据，请填入相同的 Gist ID。

### 3. 域名白名单 (可选)
- **作用**: 控制**自动高亮**功能的生效范围。
- **规则**:
  - **留空**: 在所有网页启用生词自动高亮。
  - **填写域名**: 仅在列表中的域名启用高亮（每行一个，如 `github.com`）。
- *注意：无论白名单如何配置，手动查词快捷键（Alt+K）在所有页面均可用。*

## 📖 使用方法

### 1. 查词与保存 (Capture)
- **操作**: 在网页上选中任意英文单词（或短语），按下快捷键 **`Alt+K`**。
  - *Mac 用户默认也是 `Alt+K`，可在 `chrome://extensions/shortcuts` 中自定义快捷键。*
- **结果**: 弹出悬浮卡片，显示单词原形、音标、当前语境下的中文释义。
- **自动保存**: 查词即自动保存到生词本（状态为 `Learning`）。

### 2. 复习生词 (Review)
- **自动高亮**: 当你浏览网页时，生词本中状态为 `Learning` 的单词会自动高亮显示（淡黄色背景）。
- **点击复习**: 点击高亮单词，弹出复习卡片，展示历史笔记和当前上下文。
- **标记掌握**: 点击卡片上的 **"⭕ 标记掌握"** 按钮，单词状态变为 `Mastered`，以后将不再自动高亮。
- **发音**: 点击 🔊 图标朗读单词。
- **重新分析**: 如果觉得释义不准或语境理解有误，点击卡片底部的 "语境不符?" 强制 AI 重新分析。

### 3. 生词本仪表盘 (Dashboard)
- **入口**: 点击插件图标 -> **"打开生词本仪表盘"**。
- **视图切换**: 支持 **卡片视图** (沉浸式复习) 和 **表格视图** (高效管理)。
- **热力图**: 顶部展示学习热力图，颜色越深代表复习（查询/点击）频率越高。
- **数据管理**:
  - **刷新/同步**: 手动触发与 GitHub Gist 的同步。
  - **导出/导入**: 支持导出为 JSON 文件备份。

## 📂 项目结构

```text
english-helper/
├── background.js       # 后台服务 (MV3 Service Worker): 处理 API 请求、存储与同步
├── content.js          # 内容脚本: 处理页面选词、渲染悬浮卡片
├── manifest.json       # 插件配置文件
├── styles.css          # 全局样式
├── lib/                # 核心库
│   ├── deepSeek.js     # DeepSeek API 封装
│   └── github.js       # GitHub Gist API 封装
├── popup/              # 插件弹窗 (设置页面)
│   ├── popup.html
│   └── popup.js
└── dashboard/          # 生词本展示页面
    ├── dashboard.html
    └── dashboard.js
```

## 🛠️ 技术栈

- **Manifest V3**: 符合最新的 Chrome 扩展标准。
- **Vanilla JS**: 无繁重框架依赖，轻量高效。
- **Chrome Storage API**: 本地数据存储。
- **Fetch API**: 处理 AI 与 GitHub 的网络请求。

## ⚠️ 常见问题

**Q: 为什么按快捷键 `Alt+K` 没反应？**
A: 
1. 确保已在网页上**选中**了文本。
2. 确保当前页面不是 `chrome://` 开头的系统页面或扩展商店页面（Chrome 安全限制）。
3. 尝试刷新页面，确保内容脚本已加载。
4. 检查是否与其他插件快捷键冲突，可在 `chrome://extensions/shortcuts` 查看。

**Q: 为什么我看过的单词没有自动高亮？**
A: 
1. 检查该单词是否已被标记为 "Mastered"（已掌握的单词不会高亮）。
2. 检查插件设置中的**域名白名单**配置。如果配置了白名单，只有列表内的域名才会启用高亮。
3. 确保页面加载完成，高亮脚本需要等待页面 DOM 就绪。

**Q: 同步失败怎么办？**
A: 请检查 GitHub Token 是否过期，以及生成 Token 时是否勾选了 `gist` 权限。可以在 Dashboard 点击 "刷新/同步" 按钮重试。

---
*Happy Learning!*