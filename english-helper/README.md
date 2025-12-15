# English AI Helper - 语境英语助手

**English AI Helper** 是一款基于语境的智能 Chrome 浏览器插件，旨在帮助用户在阅读英文网页时高效积累词汇。它利用 **DeepSeek AI** 进行精准的语境翻译，并通过 **GitHub Gist** 实现跨设备生词本同步。

## ✨ 主要功能

- **🤖 语境感知翻译**: 利用 AI 分析单词在当前句子中的具体含义（例如区分 *run* 是"跑步"还是"经营"），并自动提取单词原形（Lemma）。
- **📚 智能生词本**: 自动保存查询过的单词及其原始例句、来源 URL 和时间戳。
- **🔄 云端同步**: 支持配置 GitHub Token，将生词本自动同步到私有 Gist，实现多设备共享。
- **📊 可视化仪表盘**: 提供独立的单词管理页面，支持按频率热力图展示、展开查看例句、导入/导出数据。
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

1. **DeepSeek API Key** (必填):
   - 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 申请 API Key。
   - 用于提供智能翻译服务。

2. **GitHub Token** (选填 - 用于同步):
   - 前往 [GitHub Settings > Developer settings > Tokens](https://github.com/settings/tokens) 生成一个新的 Token (Classic)。
   - **权限要求**: 必须勾选 `gist` 权限。
   - 用于将生词本同步到你的 GitHub Gist。

3. **Gist ID**:
   - 配置好 Token 后，插件首次同步时会自动创建一个新的 Gist 并回填 ID。
   - 如果你已有通过此插件创建的 Gist，可以将 ID 填入此处以恢复数据。

## 📖 使用方法

### 1. 查词与保存
- 在网页上选中任意英文单词。
- 按下快捷键 **`Alt+K`** (Mac 用户视系统设置而定，可在 `chrome://extensions/shortcuts` 中自定义)。
- 此时会弹出悬浮卡片显示：
  - 单词原形与音标
  - 结合当前语境的中文释义
  - 记录状态（新增/更新次数）

### 2. 查看生词本 (Dashboard)
- 点击插件图标打开弹窗，点击 **"打开生词本仪表盘"** 按钮。
- 或直接在地址栏输入插件的 dashboard URL。
- **功能**:
  - **热力图**: 根据单词复习（查询）次数，颜色深浅不同。
  - **详情**: 点击单词卡片，查看所有保存的历史例句。
  - **数据管理**: 支持导出 JSON 备份或导入数据。

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

**Q: 为什么按快捷键没反应？**
A: 
1. 确保当前页面不是 `chrome://` 开头的系统页面或扩展商店页面（这些页面出于安全限制无法注入脚本）。
2. 尝试刷新页面。
3. 检查 API Key 是否配置正确。

**Q: 同步失败怎么办？**
A: 请检查 GitHub Token 是否过期，以及是否勾选了 `gist` 权限。

---
*Happy Learning!*