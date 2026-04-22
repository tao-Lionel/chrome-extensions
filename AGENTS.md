# AGENTS.md

这个文件用于给 AI 编码助手提供本仓库的项目背景、开发方式和协作约定。

## 仓库概览

这是一个由多个独立 Chrome 扩展组成的仓库。根目录没有统一的构建系统，也没有共享的包管理配置。修改代码时应进入目标扩展目录处理，不要把不同扩展强行耦合在一起，除非用户明确要求。

顶层项目说明：

- `english-helper/`：Manifest V3 原生 JavaScript 扩展，用于基于语境学习英语。它使用 DeepSeek 做翻译和词形分析，使用 `chrome.storage` 保存本地数据，并可选支持 GitHub Gist 同步。详细架构见 `english-helper/CLAUDE.md`。
- `video-subtitle-translator/`：Manifest V3 原生 JavaScript 扩展，用于 YouTube 和 X/Twitter 视频字幕实时翻译，翻译能力来自 DeepSeek。内容脚本拆分为通用覆盖层/翻译逻辑和平台专用检测逻辑。
- `TAPDToDingding/`：Manifest V3 原生 JavaScript/jQuery 扩展，用于把 TAPD 缺陷信息推送到钉钉机器人。
- `accountManage/`：旧版原生 JavaScript/jQuery 账户管理扩展，用于在本地和测试域名下保存、切换测试账号。
- `accountManage-vue/`：Vite + Vue 3 + TypeScript 版本的账户管理扩展，构建后输出静态扩展资源到 `dist/`。
- `majia2.0/`：Plasmo + React + TypeScript + Ant Design 账户管理扩展。
- `customFont/`：非常小的 Manifest V3 内容脚本扩展，用于修改掘金字体。
- `demo/popup-contentScript/`：演示 popup 与 content script 通信的示例扩展。

## 开发命令

命令应在对应子项目目录下执行，不要在仓库根目录执行。

### 原生 MV3 扩展

以下项目没有构建步骤：

- `english-helper/`
- `video-subtitle-translator/`
- `TAPDToDingding/`
- `accountManage/`
- `customFont/`
- `demo/popup-contentScript/`

在 Chrome 中直接加载对应目录：

1. 打开 `chrome://extensions`。
2. 启用“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择对应扩展目录。
5. 修改文件后，在扩展卡片上点击刷新。

### `accountManage-vue/`

包管理器：pnpm，以 `pnpm-lock.yaml` 为准。

常用命令：

```bash
pnpm install
pnpm dev
pnpm build
```

`pnpm dev` 会以 dev mode 执行 Vite build；Vite 配置会把扩展入口文件输出到 `dist/`。

### `majia2.0/`

包管理器：pnpm，以 `pnpm-lock.yaml` 为准。

常用命令：

```bash
pnpm install
pnpm dev
pnpm build
pnpm package
```

开发时加载 Plasmo 生成的 Chrome MV3 dev 构建目录：`majia2.0/build/chrome-mv3-dev`。

## Chrome 扩展约定

- 每个扩展都应视为独立项目。除非用户明确要求，不要跨扩展目录移动或抽取共享代码。
- 注意 Manifest V3 的限制：后台脚本是 service worker，不能依赖长期存在的内存状态。
- 如果 `chrome.runtime.onMessage` 的监听器会异步调用 `sendResponse`，监听器必须 `return true`。
- 用户配置和运行时数据默认使用 `chrome.storage.local`，除非目标项目已有其它既定存储方式。
- 不要提交 API Key、Token、Webhook URL、Cookie 或账号密码。现有集成都应通过扩展 UI 或本地 storage 让用户自行配置密钥。
- 新增权限时要同时谨慎检查 `permissions` 和 `host_permissions`，权限范围尽量收窄。
- Content script 会运行在第三方页面中。DOM 注入要可重复执行，类名和 ID 要有命名空间，避免全局 CSS 污染宿主页面。
- 对页面内容或 API 返回等不可信文本，优先使用 `textContent`。只有内容完全可控或已清洗时才使用 HTML 插入。
- 保持 popup、dashboard、side panel、content script、background/service worker 的职责边界清晰。

## 子项目注意事项

### `english-helper/`

- 主要文件：`background.js`、`content.js`、`popup/`、`dashboard/`、`lib/deepSeek.js`、`lib/github.js`。
- `background.js` 负责 DeepSeek 调用、GitHub Gist 同步、右键菜单设置和 storage 更新。
- `content.js` 负责文本选择、悬浮卡片、句子/单词判断和页面高亮。
- 生词数据以 lemma（单词原形）为核心存储，状态包括 `Learning` 和 `Mastered`。
- 句子翻译通过稳定 hash 缓存，避免重复消耗 token。
- 保留现有性能优化方式，尤其是空闲时间分片高亮和 storage 监听防抖。

### `video-subtitle-translator/`

- 主要文件：`background.js`、`content/common.js`、`content/youtube.js`、`content/twitter.js`、`popup/`、`lib/deepSeek.js`。
- `content/common.js` 包含共享的 `SubtitleTranslator` 和 `SubtitleOverlay` 逻辑。
- 平台检测逻辑应保留在对应平台的 content script 中。
- 翻译缓存保存在 `chrome.storage.local.translationCache`，不要让缓存无限增长。

### `TAPDToDingding/`

- 主要文件：`serviceWorker.js`、`js/contentScripts.js`、`js/popup.js`、`js/contacts.json`、`html/index.html`。
- 扩展目标站点是 `https://www.tapd.cn/*`，content/popup 脚本中使用 jQuery。
- 修改 service worker 时要注意钉钉机器人消息格式和浏览器通知逻辑。

### `accountManage/` 和 `accountManage-vue/`

- 两者都用于在本地和测试 Youliao 域名下管理多个测试账号。
- 旧版使用 jQuery 和 `html/`、`css/`、`js/` 下的静态文件。
- Vue 版本把 `src/contentScript/index.ts` 和 `src/popup/index.ts` 构建为独立扩展入口。
- Cookie/storage 行为应保持和域名绑定；不要在未检查 `manifest.json` 或 `public/manifest.json` 的情况下扩大匹配范围。

### `majia2.0/`

- Plasmo 项目，核心文件位于项目根目录：`popup.tsx`、`background.ts`、`styles.css`。
- UI 使用 React 和 Ant Design。
- 现有 storage 以当前标签页域名作为 key。除非需求是数据模型迁移，否则应保留这个行为。

## 验证清单

完成修改前检查：

- 对原生扩展，尽量在 Chrome 中重新加载 unpacked extension，并检查相关页面 console 或 service worker 错误。
- 修改 `accountManage-vue/` 的 Vue、TypeScript 或构建配置时，从 `accountManage-vue/` 运行 `pnpm build`。
- 修改 `majia2.0/` 的 Plasmo、React、TypeScript 或构建配置时，从 `majia2.0/` 运行 `pnpm build`。
- 检查被修改的 `manifest.json`：权限、content script 匹配规则、图标、web accessible resources 是否正确。
- 修改消息通信时，同时核对发送方和接收方的 action 名称以及响应数据结构。
- 修改 storage schema 时，要兼容已有用户数据，或提供迁移逻辑。

## 编辑风格

- 匹配目标项目原有风格：原生扩展使用原生 JavaScript，`accountManage-vue/` 使用 Vue SFC/TypeScript，`majia2.0/` 使用 React/TypeScript。
- 变更范围尽量小，只修改与当前需求相关的扩展。
- 优先复用现有 helper 函数和命名方式，不要轻易引入新抽象。
- 小需求不要给原生扩展添加重量级依赖。
- 避免无关格式化，尤其不要动生成文件、第三方文件或资源文件，例如 `jquery-3.5.1.min.js`、lockfile 和图片资源。
