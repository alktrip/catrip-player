# Changelog

All notable changes to CatripPlayer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.2.0] - 2026-05-31

### Added

- **Visual services manager** (Preferences → Manage services…): add, edit, hide, reorder and delete custom streaming platforms without editing `config.json` manually. Aura-styled modal dialog; persistence via `services` and `serviceOrder` in electron-store.
- **`services-merge.ts`:** merge logic for default + custom services, validation and persistence from the manager UI.
- **i18n** for the services manager and menu entry `menu.prefs.manageServices` in all locales (es, en, fr, de, pt, zh).
- **`src/widevine.ts`:** Widevine CDM setup via CastLabs `components.whenReady()`, extraction from `component_crx_cache`, fallback import from system browsers (Brave, Chrome, etc.), and Linux restart prompt after first install.
- **`src/user-agent.ts`:** Chrome-like User-Agent without Electron tokens, plus `Sec-CH-UA` client hints for streaming sites.

### Fixed

- **Amazon Prime Video (error 7132):** DRM playback on Linux by upgrading to CastLabs Electron **v42.0.0+wvcus**, installing Widevine when the component updater leaves the CRX in cache only, and granting `mediaKeySystem` (and related) permissions for configured services.

### Changed

- **CastLabs Electron** updated from `v38.7.2+wvcus` to **`v42.0.0+wvcus`** (supported Widevine CDM window on Google Component Updater).
- **Floating island** (frameless): the × control now returns to the **main service grid** (`open-main-menu`) instead of disabling frameless mode; label matches behaviour (“Back to menu”).
- **Frameless on Linux/Windows:** press **F10** to open the application menu as a popup when the window has no frame.
- **`goToMainMenu()`** shared between the native menu (Ctrl+H) and the floating island.
- **Amazon Prime Video** default service: `media` permission enabled.
- Removed `app.disableHardwareAcceleration()` to avoid interfering with video/DRM decode.

---

## [1.1.3] - 2026-03-28

### Added

- **Cursor rule** (`.cursor/rules/git-main-feature-branch.mdc`): when working on `main`, the agent should ask before implementing whether to use a `feature/…` branch.
- **Service grid skeletons** while the menu loads, until the first `set-services` IPC payload.

### Changed

- **Aura UI:** service cards use a **gradient mesh border** tied to each service color; stronger hover glow.
- **Logo morph** (launching a service): subtle **chromatic aberration** during the flight animation (`prefers-reduced-motion` respected).
- **Floating island** (frameless mode): **gradient border and backdrop** with accent from `service.color` (valid hex).

---

## [1.1.2] - 2025-02-08

### Added

- **About window** with app styling: custom dialog (no native menu) opened from Help → About CatripPlayer.
- **Logo** at the top of the About window, followed by app name, version, description, and **GitHub link** (opens in browser).
- **i18n** for About: `about.close` and `about.githubLink` in all locales (es, en, fr, de, pt, zh).

### Changed

- **About** no longer uses the native message box; uses a frameless window (496×420) with the same visual style as the app (card, aura background). Close via button or Escape.

---

## [1.1.1] - 2025-02-06

### Added

- **Screenshots** in README: logo, main window, Custom URL dialog, Amazon Prime Video, and YouTube.
- **License metadata** for Linux (.deb) build so package info shows GPL-3.0 correctly.
- **docs/images/** folder with application logo and window screenshots for documentation.

### Changed

- **License:** project switched from MIT to **GPL-3.0**; added `LICENSE` file with full GNU GPL v3 text.
- **README.md** translated to English and restructured with logo and screenshot section.
- **package.json:** `homepage` set to `https://github.com/alktrip/catrip-player`; `license` set to `GPL-3.0`.
- **build/electron-builder.yml:** maintainer email set to GitHub noreply; explicit `license: GPL-3.0` for Linux packages.
- **docs/electron-vaapi-fix.md** translated to English.

---

## [1.1.0] - 2025-02

### Added

- **Internationalization (i18n):** Spanish (es), English (en), French (fr), Portuguese (pt), German (de), and Chinese (zh).
- **Preferences → Language** submenu to choose UI language; selection is persisted and applied after window reload.
- **Custom URL dialog** with the app’s visual style (replaces native prompt); no menu bar on the dialog window.
- **Locale files** in `src/locales/` (JSON) and `src/i18n.ts` for `getLocale`, `setLocale`, `t()`, and `getUIStrings`.
- **UI strings** sent to the renderer via `set-services` payload so the main menu, empty state, “Last used” badge, version prefix, and loader text are translated.
- **Island (frameless) bar** “Back to menu” label translated via `island.backToMenu`.
- **Prompt strings** for Custom URL dialog: title, label, placeholder, cancel, and submit buttons in all supported languages.

### Changed

- **Menu** refactored to use `t()` for all labels; submenu **Preferences → Language** added with radio options per locale.
- **About** and **Custom URL** use translated strings; on language change, menu is rebuilt and window reloaded.
- **main.ts:** initializes i18n, passes `t` and `onLocaleChange` to `buildMenu`, injects translated overlay and island strings.
- **src/ui/index.js:** uses `payload.strings` for header, empty state, version prefix, “Last used,” and connecting loader text.

### Removed

- **electron-prompt** dependency; Custom URL is handled by an in-app styled dialog.

---

## [1.0.0] - 2025-01

### Added

- **Unified streaming client** for desktop: one window for Netflix, YouTube, Twitch, Amazon Prime Video, HBO Max, Apple TV, Crunchyroll, Disney+, and others.
- **Service menu** with visual grid (Aura evolution: mesh gradient, ambient lighting, parallax, animations).
- **Single window** loading the chosen service website with **Widevine (DRM)** support on Linux (CastLabs Electron).
- **Window options:** always on top, frameless (Floating Island), full screen, remember position and size.
- **Optional ad blocking** (Ghostery).
- **Preferences:** visible services, default/startup service, edit config file; **Navigation** (main menu, custom URL, service shortcuts); **Playback** (back to menu, reload, always on top, full screen).
- **Persistence** of preferences and last-used service (electron-store).
- **Build** for Linux (AppImage, .deb), Windows (NSIS), and macOS (zip).
- **docs/electron-vaapi-fix.md** for libva/i965 vs iHD driver on Intel (e.g. Iris Xe / Tiger Lake).

---

[1.2.0]: https://github.com/alktrip/catrip-player/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/alktrip/catrip-player/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/alktrip/catrip-player/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/alktrip/catrip-player/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/alktrip/catrip-player/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/alktrip/catrip-player/releases/tag/v1.0.0
