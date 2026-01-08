# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Manifest V3 的 Chrome 浏览器扩展，帮助用户通过语境学习英语词汇。项目使用原生 JavaScript 开发，无需构建工具。

## 核心架构

### 组件结构

- **background.js** (Service Worker): 核心后端逻辑，处理 DeepSeek API 调用、词汇存储和 GitHub Gist 同步
- **content.js**: 内容脚本，处理页面文本选择、浮动卡片渲染和自动高亮
- **popup/**: 侧边栏设置界面（API Key 配置、域名白名单等）
- **dashboard/**: 独立的生词本管理页面
- **lib/**: API 封装库（deepSeek.js, github.js）

### 数据流

1. 用户选词 → content.js 捕获选择文本
2. 发送消息到 background.js → 调用 DeepSeek API 分析
3. 结果存储到 chrome.storage → 更新 UI
4. 自动同步到 GitHub Gist（可选）

### 关键设计模式

**词汇存储结构**:
- 使用 lemma（单词原形）作为主键
- 自动识别变体（如 running → run）
- 每个词汇包含：lemma, translation, phonetic, count, contexts（数组）, variants, status

**句子翻译存储结构**:
- 使用稳定的句子 hash 作为主键（generateSentenceHash）
- hash 算法忽略标点、大小写、空格差异，提升缓存命中率
- 每个句子包含：id, original, translation, keyWords, sourceUrl, timestamp, lastReview, reviewCount
- 相同句子再次翻译会命中缓存，节省 token
- 在 dashboard 的"句子"标签页可查看所有翻译记录

**性能优化**:
- 使用 requestIdleCallback 进行大规模高亮的分时处理
- 正则表达式按长度排序（最长匹配优先）
- 使用 DOM TreeWalker 高效遍历节点
- 防抖处理存储监听器

## 开发说明

### 加载扩展

无需构建步骤，直接在 Chrome 中加载：

1. 打开 `chrome://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录

### 修改后重新加载

修改任何文件后，在 `chrome://extensions` 页面点击扩展卡片上的刷新按钮即可。

### 调试

- **Service Worker**: 在 `chrome://extensions` 中点击 "Service worker" 链接打开 DevTools
- **Content Script**: 在网页上按 F12 打开 DevTools，切换到 Content Script 上下文
- **Popup/Side Panel**: 右键点击侧边栏，选择"检查"

## 重要约定

### API 配置

- DeepSeek API Key: 用户自行配置，存储在 chrome.storage 中
- GitHub Token: 仅需 gist 权限，用于创建和更新私有 Gist
- 所有 API 调用通过 background.js 统一处理

### 消息传递

- content.js 与 background.js 通过 chrome.runtime.sendMessage 通信
- 使用 chrome.storage.onChanged 监听数据变化实现响应式更新

### 高亮功能

- 仅高亮状态为 "Learning" 的词汇
- "Mastered" 状态的词汇不再高亮
- 域名白名单控制高亮生效范围（空 = 所有网站）

### 单词状态

- **Learning**: 正在学习，会自动高亮
- **Mastered**: 已掌握，不再高亮

### 句子翻译

- 智能判断：≥3个单词 且 ≥15个字符 或 包含标点符号
- 使用 processSentence action 处理
- 支持缓存：相同句子（忽略标点、大小写、空格）会返回缓存结果
- dashboard 中可查看所有翻译记录，点击复制原文+翻译

## 关键文件位置

- 权限和命令配置: `manifest.json`
- 快捷键处理: `content.js` (监听 chrome.commands.onCommand)
- API 调用: `background.js` + `lib/deepSeek.js`
- 同步逻辑: `background.js` + `lib/github.js`
- UI 样式: `styles.css`
