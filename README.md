# Chrome Extensions

这个仓库用于存放多个 Chrome 浏览器扩展项目。每个子目录基本都是一个独立扩展，开发、构建和加载方式请按对应项目处理。

## 项目列表

| 目录 | 说明 | 技术栈 |
| --- | --- | --- |
| `english-helper/` | 语境英语助手：选词/选句翻译、生词本、高亮复习、GitHub Gist 同步 | Manifest V3、原生 JavaScript、DeepSeek API |
| `video-subtitle-translator/` | 视频字幕翻译：支持 YouTube 和 X/Twitter 字幕实时翻译 | Manifest V3、原生 JavaScript、DeepSeek API |
| `TAPDToDingding/` | TAPD 缺陷推送到钉钉机器人 | Manifest V3、JavaScript、jQuery |
| `accountManage/` | 旧版账户管理扩展，用于保存和切换测试账号 | Manifest V3、JavaScript、jQuery |
| `accountManage-vue/` | Vue 版本账户管理扩展 | Manifest V3、Vite、Vue 3、TypeScript |
| `majia2.0/` | Plasmo 版本账户管理扩展 | Plasmo、React、TypeScript、Ant Design |
| `customFont/` | 修改掘金页面字体的小扩展 | Manifest V3、原生 JavaScript |
| `demo/popup-contentScript/` | popup 与 content script 通信示例 | Manifest V3、JavaScript、jQuery |

## 快速开始

### 原生扩展

以下目录不需要构建，可以直接作为 unpacked extension 加载：

- `english-helper/`
- `video-subtitle-translator/`
- `TAPDToDingding/`
- `accountManage/`
- `customFont/`
- `demo/popup-contentScript/`

加载方式：

1. 打开 Chrome 的 `chrome://extensions`。
2. 启用右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择对应扩展目录。
5. 修改代码后，在扩展卡片上点击刷新。

### `accountManage-vue/`

```bash
cd accountManage-vue
pnpm install
pnpm dev
```

开发构建产物输出到 `accountManage-vue/dist/`，在 Chrome 中加载该目录。

生产构建：

```bash
pnpm build
```

### `majia2.0/`

```bash
cd majia2.0
pnpm install
pnpm dev
```

开发时加载 Plasmo 生成的目录：

```text
majia2.0/build/chrome-mv3-dev
```

生产构建：

```bash
pnpm build
```

打包：

```bash
pnpm package
```

## 常用调试方式

- Background Service Worker：在 `chrome://extensions` 对应扩展卡片中点击 “Service worker”。
- Content Script：打开目标网页 DevTools，在页面上下文中查看 console 和 DOM 注入效果。
- Popup / Side Panel：右键扩展弹窗或侧边栏，选择“检查”。
- 修改 `manifest.json` 后通常需要重新加载扩展。

## 注意事项

- 本仓库根目录没有统一构建命令，请进入具体子项目执行命令。
- 不要提交 API Key、Token、Webhook URL、Cookie、账号密码等敏感信息。
- 新增 Chrome 权限时，请尽量收窄 `permissions` 和 `host_permissions` 的范围。
- Content script 会运行在第三方网页中，新增 DOM/CSS 时要避免污染宿主页面。
- 修改消息通信时，需要同时确认发送方和接收方的 `action` 名称与响应结构。
- 修改 storage 数据结构时，应考虑兼容已有用户数据。

## AI 编码助手说明

如果使用 Codex、Claude Code、Gemini CLI 等 AI 编码助手，请先阅读根目录的 `AGENTS.md`。该文件包含更详细的项目结构、编辑约定和验证清单。
