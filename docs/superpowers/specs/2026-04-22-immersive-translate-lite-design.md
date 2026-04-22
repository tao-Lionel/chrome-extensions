# Immersive Translate Lite Design

Date: 2026-04-22

## Summary

Build a new standalone Chrome Manifest V3 extension named `Immersive Translate Lite`.
It provides a clean bilingual translation experience for webpages and video subtitles.
The first version is deliberately manual: users trigger translation with a keyboard shortcut
or a popup button. There is no automatic page translation.

The extension is implemented as a native JavaScript MV3 project with no build step,
matching the repository's existing lightweight extensions.

## Goals

- Translate visible webpage content into bilingual blocks while preserving the original page structure.
- Insert webpage translations directly below the source text block.
- Translate YouTube and X/Twitter subtitles and show the translation below the original subtitle.
- Use DeepSeek as the only implemented provider in version one.
- Keep a provider boundary so Google Translate support can be added later without changing content scripts.
- Cache webpage and subtitle translations locally with a bounded cache size and a clear-cache action.
- Keep the UI small: API key, target language, translate button, cache clear button, and status.

## Non-Goals

- No automatic page translation on page load.
- No unofficial Google Translate endpoint in version one.
- No framework, package manager, or build system.
- No cross-extension shared code extraction.
- No PDF, EPUB, image, or document translation.
- No user account sync or cloud storage.
- No custom prompt editor.

## Directory Layout

```text
immersive-translate-lite/
  manifest.json
  background.js
  content/
    pageTranslator.js
    subtitleTranslator.js
  providers/
    deepseek.js
    registry.js
  popup/
    popup.html
    popup.css
    popup.js
  styles/
    page.css
    subtitle.css
  icons/
```

The extension stays independent from `english-helper/` and `video-subtitle-translator/`.
Existing code can be used as implementation reference, but copied logic must be adapted into
the new extension instead of imported across directories.

## Manifest And Permissions

The extension uses Manifest V3.

Required permissions:

- `storage`: save settings and translation cache.
- `activeTab`: allow the popup command to act on the active page after user action.
- `scripting`: inject or message content scripts for the current tab if needed.

Host permissions:

- `https://api.deepseek.com/*` for DeepSeek API calls from the service worker.

Content scripts:

- Run on `<all_urls>` for webpage translation and platform subtitle observation.
- Use `document_idle`.
- Skip restricted pages where Chrome does not allow content scripts, such as Chrome internal pages.

Command:

- `translate-current-page`, default suggested shortcut `Alt+T` on desktop and macOS.
- The command triggers page translation in the active tab.

## Settings

Settings are stored in `chrome.storage.local.settings`.

```json
{
  "provider": "deepseek",
  "deepseekApiKey": "",
  "targetLang": "zh-CN"
}
```

The popup edits only:

- DeepSeek API Key.
- Target language.
- Translate current page.
- Clear translation cache.

The DeepSeek model is fixed to `deepseek-chat` in version one.

## Provider Boundary

Content scripts never call provider APIs directly. They send translation requests to the service worker.

The service worker uses a provider registry:

```js
const providers = {
  deepseek: DeepSeekProvider
};
```

Provider contract:

```js
translateTexts({
  texts,
  targetLang,
  apiKey,
  mode
}) => Promise<string[]>
```

`mode` is either `page` or `subtitle`.

Version one implements only `deepseek`. A future Google provider can implement the same contract and be
selected by settings without rewriting DOM extraction, subtitle extraction, or cache logic.

## Webpage Translation Flow

1. User presses the shortcut or clicks the popup translate button.
2. The service worker sends a `TRANSLATE_PAGE` message to the active tab.
3. The page content script scans visible text blocks.
4. The content script filters out unsupported or unsafe nodes.
5. The content script sends a batch translation request to the service worker.
6. The service worker resolves cached translations first, calls DeepSeek for misses, updates the cache, and returns translations.
7. The content script inserts each translation below its source element.

Pressing the shortcut again should re-run the scan. Already translated elements are skipped unless their source text changed.

## DOM Recognition

The page translator scans common readable elements:

- `p`
- `li`
- `blockquote`
- article/body headings: `h1`, `h2`, `h3`, `h4`
- selected readable `div` nodes only when they look like standalone text blocks

It skips:

- `script`, `style`, `noscript`, `template`, `svg`, `canvas`
- `input`, `textarea`, `select`, `button`
- `pre`, `code`, `kbd`, `samp`
- contenteditable areas
- hidden elements and elements with zero layout boxes
- elements inside previously injected translation nodes
- very short text blocks below 20 visible characters
- elements whose direct child blocks indicate the parent is a large container rather than a readable block

Text extraction uses `textContent`. Translation insertion also uses `textContent`.

## Webpage Injection

Translations are inserted immediately after the source element:

```html
<p>Original paragraph...</p>
<div class="itl-page-translation" data-itl-source-hash="...">译文...</div>
```

CSS uses the `itl-` namespace and avoids global resets.

Default style:

- small top margin and larger bottom margin
- left border accent
- subdued blue text
- transparent or near-transparent background
- font size slightly smaller than source text

The injected node stores the source hash so repeated shortcut presses can skip unchanged blocks.

## Subtitle Translation

Subtitle support covers:

- YouTube
- X/Twitter

The implementation uses platform-specific observers in `content/subtitleTranslator.js` and keeps shared translation/cache messaging common.

YouTube:

- Observe `.ytp-caption-window-container`.
- Read `.ytp-caption-segment` text.
- Handle YouTube SPA navigation by detecting URL changes.

X/Twitter:

- Observe video subtitle containers used by X/Twitter pages.
- Extract visible subtitle text from likely subtitle nodes.
- Reattach observers after route or video changes.

Subtitle display:

- Create one namespaced overlay per video container.
- Show original subtitle and translated subtitle.
- Use `textContent`.
- Debounce repeated subtitle changes.
- Skip duplicate subtitle text.

## Cache

Translations are stored in `chrome.storage.local.translationCache`.

Cache key format:

```text
itl:<provider>:<targetLang>:<mode>:<hash(text)>
```

Cache value:

```json
{
  "source": "Original text",
  "translation": "Translated text",
  "mode": "page",
  "provider": "deepseek",
  "targetLang": "zh-CN",
  "timestamp": 1776869722000
}
```

The cache is bounded. Version one keeps at most 1000 entries and removes the oldest 200 entries when the
limit is exceeded. The popup has a clear-cache button.

## DeepSeek Translation

DeepSeek requests are made from the service worker only.

Endpoint:

```text
https://api.deepseek.com/chat/completions
```

Model:

```text
deepseek-chat
```

For webpage translation, requests are batched in small groups. The prompt asks DeepSeek to return strict JSON:

```json
{
  "translations": ["..."]
}
```

The service worker validates that the returned translation count matches the source text count. If parsing or
count validation fails, the batch is retried once with a smaller batch size. If it still fails, the user sees a
clear error status.

For subtitles, the prompt asks for concise natural subtitle translation and returns plain text for a single line.

## Error Handling

- Missing API key: popup status and page toast say the API key is not configured.
- Unsupported page: page toast says the current page cannot be translated.
- Provider failure: page toast shows a short failure message; details go to console.
- Partial batch failure: translated blocks that succeeded are injected; failed blocks are left unchanged.
- Message listeners that respond asynchronously must return `true`.

Page toasts use namespaced DOM nodes and remove themselves after a short timeout.

## Security And Privacy

- API keys are stored only in `chrome.storage.local`.
- No API key, token, cookie, or account credential is committed to the repository.
- All untrusted page text and API output is inserted with `textContent`.
- Host permissions are limited to DeepSeek API.
- The extension does not sync translation history to any remote service.

## Verification

Manual verification:

- Load `immersive-translate-lite/` as an unpacked extension.
- Save a DeepSeek API key and target language in the popup.
- Press the shortcut on a normal article page and confirm translations appear below readable blocks.
- Press the shortcut again and confirm duplicate translations are not inserted.
- Clear cache from popup and confirm `translationCache` is emptied.
- Open YouTube with captions enabled and confirm the overlay shows original and translated subtitles.
- Open X/Twitter with a captioned video and confirm the overlay updates without duplicate lines.
- Inspect the service worker console for runtime or messaging errors.

Static verification:

- Inspect `manifest.json` for permissions and host permissions.
- Check content script selectors and injected class names use the `itl-` namespace.
- Confirm all async message handlers return `true`.
