import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { buildMenu } from './menu';
import { defaultServices } from './default-services';
import * as i18n from './i18n';
import type { Service } from './types';

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('in-process-gpu');
app.disableHardwareAcceleration();

interface AppStore {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
  clear: () => void;
}

let mainWindow: BrowserWindow | null = null;
let urlDialogWindow: BrowserWindow | null = null;
let aboutDialogWindow: BrowserWindow | null = null;
let windowCreated = false;
let defaultUserAgent = '';
let currentServices: Service[] = [];
/** Callback para reconstruir el menú (p. ej. tras cambiar pantalla completa). */
let menuRefreshCallback: (() => void) | null = null;

/** Servicio cuya URL se está cargando: muestra overlay (ripple + logo) hasta did-finish-load */
let loadingOverlayService: { name: string; logo: string; color: string } | null = null;

const store = new Store() as unknown as AppStore;

const getBasePath = (): string =>
  app.isPackaged ? app.getAppPath() : process.cwd();

function getOption<T>(key: string, def: T): T {
  const v = store.get(key);
  return v === undefined ? def : (v as T);
}

function mergeServices(): Service[] {
  const userServices: Partial<Service>[] = (store.get('services') as Partial<Service>[] | undefined) || [];
  const result: Service[] = [];

  for (const d of defaultServices) {
    const user = userServices.find((s) => s.name === d.name);
    if (user) {
      result.push({
        name: user.name ?? d.name,
        logo: user.logo ?? d.logo,
        url: user.url ?? d.url,
        color: user.color ?? d.color,
        style: user.style ?? d.style ?? {},
        userAgent: user.userAgent ?? d.userAgent,
        permissions: user.permissions ?? d.permissions ?? [],
        hidden: user.hidden !== undefined ? user.hidden : d.hidden,
      });
    } else {
      result.push({ ...d, _defaultService: true });
    }
  }
  return result;
}

let headerScript: string = '';

function injectHeaderIfFrameless(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!getOption('options.hideWindowFrame', false)) return;
  if (!headerScript) {
    const headerPath = path.join(getBasePath(), 'src', 'client-header.js');
    try {
      headerScript = fs.readFileSync(headerPath, 'utf8');
    } catch {
      return;
    }
  }
  let serviceName = '';
  let serviceColor = '';
  try {
    const url = mainWindow.webContents.getURL();
    if (!url.startsWith('file:')) {
      const origin = new URL(url).origin;
      const svc = currentServices.find((s) => {
        try {
          return new URL(s.url).origin === origin;
        } catch {
          return false;
        }
      });
      if (svc) {
        serviceName = svc.name;
        serviceColor = svc.color || '';
      }
    }
  } catch {
    // ignore
  }
  const backToMenuLabel = i18n.t(store, 'island.backToMenu');
  mainWindow.webContents
    .executeJavaScript(
      'window.__catripServiceName = ' +
        JSON.stringify(serviceName) +
        '; window.__catripServiceColor = ' +
        JSON.stringify(serviceColor) +
        '; window.__catripIslandBackToMenu = ' +
        JSON.stringify(backToMenuLabel) +
        ';'
    )
    .then(() => mainWindow?.webContents.executeJavaScript(headerScript))
    .catch(() => {});
}

async function initAdblockIfNeeded(): Promise<void> {
  if (!getOption('options.adblock', false)) return;
  const fetch = require('cross-fetch');
  const { ElectronBlocker } = require('@ghostery/adblocker-electron');
  const enginePath = path.join(app.getPath('userData'), 'adblock-engine.bin');
  try {
    const buf = fs.readFileSync(enginePath);
    const blocker = ElectronBlocker.deserialize(buf);
    blocker.enableBlockingInSession(session.defaultSession);
    return;
  } catch {
    // no cache or invalid
  }
  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(session.defaultSession);
    fs.writeFileSync(enginePath, Buffer.from(blocker.serialize()));
  } catch (err) {
    console.error('Adblock init failed:', err);
  }
}

function setupPermissionHandler(): void {
  const handler = (
    webContents: Electron.WebContents,
    permission: string,
    callback: (granted: boolean) => void
  ) => {
    if (permission === 'fullscreen') {
      callback(true);
      return;
    }
    let origin: string;
    try {
      origin = new URL(webContents.getURL()).origin;
    } catch {
      callback(false);
      return;
    }
    const service = currentServices.find((s) => {
      try {
        return new URL(s.url).origin === origin;
      } catch {
        return false;
      }
    });
    const allowed =
      service?.permissions && Array.isArray(service.permissions) && service.permissions.includes(permission);
    callback(!!allowed);
  };
  session.defaultSession.setPermissionRequestHandler(handler as any);
}

function openUrlDialog(strings: { title: string; label: string; placeholder: string; cancel: string; submit: string }): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (urlDialogWindow && !urlDialogWindow.isDestroyed()) {
    urlDialogWindow.focus();
    return;
  }
  const parent = mainWindow;
  urlDialogWindow = new BrowserWindow({
    width: 480,
    height: 400,
    parent,
    modal: true,
    show: false,
    resizable: false,
    fullscreen: false,
    title: strings.title,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  urlDialogWindow.setMenu(null);
  const cleanup = (): void => {
    if (urlDialogWindow) {
      urlDialogWindow.removeAllListeners('closed');
      urlDialogWindow = null;
    }
    ipcMain.removeAllListeners('url-dialog-submit');
    ipcMain.removeAllListeners('url-dialog-cancel');
  };
  ipcMain.once('url-dialog-submit', (_e, url: string) => {
    if (_e.sender !== urlDialogWindow?.webContents) return;
    const u = typeof url === 'string' ? url.trim() : '';
    if (u && mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(u);
    urlDialogWindow?.close();
    cleanup();
  });
  ipcMain.once('url-dialog-cancel', (_e) => {
    if (_e.sender !== urlDialogWindow?.webContents) return;
    urlDialogWindow?.close();
    cleanup();
  });
  urlDialogWindow.once('closed', () => cleanup());
  const dialogPath = path.join(getBasePath(), 'src', 'ui', 'url-dialog.html');
  urlDialogWindow.loadFile(dialogPath).then(() => {
    setImmediate(() => {
      urlDialogWindow?.webContents.send('dialog-strings', strings);
      urlDialogWindow?.show();
    });
  }).catch(() => cleanup());
}

function openAboutDialog(strings: {
  title: string;
  message: string;
  detail: string;
  closeLabel: string;
  githubLabel: string;
  githubUrl: string;
}): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (aboutDialogWindow && !aboutDialogWindow.isDestroyed()) {
    aboutDialogWindow.focus();
    return;
  }
  const parent = mainWindow;
  aboutDialogWindow = new BrowserWindow({
    width: 496,
    height: 420,
    parent,
    modal: true,
    show: false,
    frame: false,
    resizable: false,
    fullscreen: false,
    title: strings.title,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  aboutDialogWindow.setMenu(null);
  const cleanup = (): void => {
    if (aboutDialogWindow) {
      aboutDialogWindow.removeAllListeners('closed');
      aboutDialogWindow = null;
    }
    ipcMain.removeAllListeners('about-dialog-close');
    ipcMain.removeAllListeners('about-dialog-open-external');
  };
  ipcMain.once('about-dialog-close', (_e) => {
    if (_e.sender !== aboutDialogWindow?.webContents) return;
    aboutDialogWindow?.close();
    cleanup();
  });
  ipcMain.once('about-dialog-open-external', (_e, url: string) => {
    if (_e.sender !== aboutDialogWindow?.webContents) return;
    const u = typeof url === 'string' ? url.trim() : '';
    if (u) shell.openExternal(u).catch(() => {});
  });
  aboutDialogWindow.once('closed', () => cleanup());
  const dialogPath = path.join(getBasePath(), 'src', 'ui', 'about-dialog.html');
  aboutDialogWindow.loadFile(dialogPath).then(() => {
    setImmediate(() => {
      aboutDialogWindow?.webContents.send('about-dialog-strings', strings);
      aboutDialogWindow?.show();
    });
  }).catch(() => cleanup());
}

async function createWindow(): Promise<void> {
  if (windowCreated) return;
  windowCreated = true;

  currentServices = mergeServices();
  await initAdblockIfNeeded();

  const hideFrame = getOption('options.hideWindowFrame', false);
  const alwaysOnTop = getOption('options.alwaysOnTop', false);
  const launchFullscreen = getOption('options.launchFullscreen', false);

  mainWindow = new BrowserWindow({
    width: 890,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    frame: !hideFrame,
    alwaysOnTop,
    fullscreen: launchFullscreen,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  defaultUserAgent = mainWindow.webContents.userAgent;
  setupPermissionHandler();
  i18n.init(getBasePath());

  const relaunchDetails = store.get('relaunch.windowDetails') as { position: [number, number]; size: [number, number] } | undefined;
  const savedDetails = store.get('options.windowDetails') as { position: [number, number]; size: [number, number] } | undefined;
  if (relaunchDetails) {
    mainWindow.setSize(relaunchDetails.size[0], relaunchDetails.size[1]);
    mainWindow.setPosition(relaunchDetails.position[0], relaunchDetails.position[1]);
    store.delete('relaunch.windowDetails');
  } else if (getOption('options.rememberWindowDetails', false) && savedDetails) {
    mainWindow.setSize(savedDetails.size[0], savedDetails.size[1]);
    mainWindow.setPosition(savedDetails.position[0], savedDetails.position[1]);
  }

  const onLocaleChange = (): void => {
    menuRefreshCallback?.();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
  };
  menuRefreshCallback = (): void => {
    buildMenu({
      store,
      app,
      services: currentServices,
      mainWindow,
      defaultUserAgent,
      getBasePath,
      loadServiceUrl,
      resetSettings,
      refreshMenu: menuRefreshCallback ?? undefined,
      t: (key, params) => i18n.t(store, key, params),
      onLocaleChange,
      openUrlDialog: (strings) => openUrlDialog(strings),
      openAboutDialog: (strings) => openAboutDialog(strings),
    });
  };
  buildMenu({
    store,
    app,
    services: currentServices,
    mainWindow,
    defaultUserAgent,
    getBasePath,
    loadServiceUrl,
    resetSettings,
    refreshMenu: menuRefreshCallback ?? undefined,
    t: (key, params) => i18n.t(store, key, params),
    onLocaleChange,
    openUrlDialog: (strings) => openUrlDialog(strings),
    openAboutDialog: (strings) => openAboutDialog(strings),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const relaunchToPage = store.get('relaunch.toPage') as string | undefined;
  const defaultService = getOption('options.defaultService', '') as string;
  const lastOpenedPage = (getOption('options.lastOpenedPage', '') as string) || '';
  const indexPath = path.join(getBasePath(), 'src', 'ui', 'index.html');

  if (relaunchToPage) {
    store.delete('relaunch.toPage');
    mainWindow.loadURL(relaunchToPage);
  } else if (String(defaultService) === 'lastOpenedPage' && lastOpenedPage) {
    mainWindow.loadURL(lastOpenedPage);
  } else if (defaultService) {
    const svc = currentServices.find((s) => s.name === defaultService);
    if (svc?.url) {
      mainWindow.webContents.userAgent = svc.userAgent || defaultUserAgent;
      mainWindow.loadURL(svc.url);
    } else {
      mainWindow.loadFile(indexPath).catch((err) => console.error(err));
    }
  } else {
    mainWindow.loadFile(indexPath).catch((err) => console.error(err));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const url = mainWindow.webContents.getURL();
    if (url.startsWith('file:') && url.includes('index.html')) {
      mainWindow.webContents.send('set-services', getServicesPayload());
    }
    if (loadingOverlayService) {
      mainWindow.webContents
        .executeJavaScript(
          "(function(){ var el = document.getElementById('catrip-loader-overlay'); if(el) el.remove(); })();"
        )
        .catch(() => {});
      loadingOverlayService = null;
    } else if (!url.startsWith('file:') && !url.startsWith('about:')) {
      /* §8 Fade-in del contenido nuevo cuando no hubo overlay (p. ej. navegación in-site) */
      mainWindow.webContents
        .executeJavaScript(
          "(function(){ var b = document.body; if (!b) return; b.style.transition = 'opacity 0.15s ease'; b.style.opacity = '0'; requestAnimationFrame(function(){ b.style.opacity = '1'; }); })();"
        )
        .catch(() => {});
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
    injectHeaderIfFrameless();
    if (!loadingOverlayService || !mainWindow?.webContents) return;
    const url = mainWindow.webContents.getURL();
    if (url.startsWith('file:')) return;
    const logoPath = path.join(getBasePath(), 'src', 'ui', loadingOverlayService.logo);
    let dataUrl = '';
    try {
      const buf = fs.readFileSync(logoPath);
      const ext = path.extname(loadingOverlayService.logo).toLowerCase();
      const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
      dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
    } catch {
      dataUrl = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>').toString('base64');
    }
    const name = loadingOverlayService.name || 'servicio';
    const color = loadingOverlayService.color || '#666';
    const connectingText = i18n.t(store, 'ui.connecting', { name });
    const script = `(function(){
      var opts = { dataUrl: ${JSON.stringify(dataUrl)}, color: ${JSON.stringify(color)}, name: ${JSON.stringify(name)}, connectingText: ${JSON.stringify(connectingText)} };
      var el = document.createElement('div');
      el.id = 'catrip-loader-overlay';
      el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:catrip-fadein 0.15s ease-out;';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;';
      var ripple = document.createElement('div');
      ripple.style.cssText = 'position:absolute;width:80px;height:80px;border-radius:50%;background:' + opts.color + ';opacity:0.4;animation:catrip-ripple 1.1s ease-in-out infinite;';
      var img = document.createElement('img');
      img.src = opts.dataUrl;
      img.style.cssText = 'position:relative;z-index:1;width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 6px 12px rgba(0,0,0,0.5));';
      var txt = document.createElement('div');
      txt.textContent = opts.connectingText;
      txt.style.cssText = 'margin-top:12px;font-size:0.85rem;color:rgba(229,229,229,0.85);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      var style = document.createElement('style');
      style.textContent = '@keyframes catrip-ripple { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.12); opacity: 0.2; } } @keyframes catrip-fadein { from { opacity: 0; } to { opacity: 1; } }';
      document.head.appendChild(style);
      wrap.appendChild(ripple); wrap.appendChild(img);
      el.appendChild(wrap); el.appendChild(txt);
      document.body.appendChild(el);
    })();`;
    mainWindow.webContents.executeJavaScript(script).catch(() => {});
  });

  mainWindow.on('close', () => {
    if (!mainWindow) return;
    if (String(getOption('options.defaultService', '')) === 'lastOpenedPage') {
      const url = mainWindow.webContents.getURL();
      if (url && !url.startsWith('file:')) store.set('options.lastOpenedPage', url);
    }
    if (getOption('options.rememberWindowDetails', false)) {
      const pos = mainWindow.getPosition();
      const size = mainWindow.getSize();
      store.set('options.windowDetails', { position: pos, size });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    windowCreated = false;
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1000);
}

function loadServiceUrl(service: Service): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  store.set('options.lastUsedService', service.name);
  loadingOverlayService = {
    name: service.name,
    logo: service.logo,
    color: service.color || '#666',
  };
  mainWindow.webContents.userAgent = service.userAgent || defaultUserAgent;
  mainWindow.loadURL(service.url);
}

function getServicesPayload(): {
  services: Service[];
  lastUsedService: string | undefined;
  appVersion: string;
  strings: Record<string, string>;
} {
  return {
    services: currentServices,
    lastUsedService: store.get('options.lastUsedService') as string | undefined,
    appVersion: app.getVersion(),
    strings: i18n.getUIStrings(store),
  };
}

function resetSettings(): void {
  store.clear();
  store.set('version', app.getVersion());
  store.set('services', []);
  const adblockPath = path.join(app.getPath('userData'), 'adblock-engine.bin');
  try {
    if (fs.existsSync(adblockPath)) fs.unlinkSync(adblockPath);
  } catch {
    // ignore
  }
  (app as NodeJS.EventEmitter).emit('relaunch');
}

ipcMain.on('open-url', (_event, service: Service) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  loadServiceUrl(service);
});

ipcMain.on('exit-fullscreen', () => {
  store.delete('options.hideWindowFrame');
  (app as NodeJS.EventEmitter).emit('relaunch');
});

(app as NodeJS.EventEmitter).on('relaunch', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const url = mainWindow.webContents.getURL();
  if (url && !url.startsWith('about:')) store.set('relaunch.toPage', url);
  store.set('relaunch.windowDetails', {
    position: mainWindow.getPosition(),
    size: mainWindow.getSize(),
  });
  mainWindow.webContents.removeAllListeners('dom-ready');
  mainWindow.removeAllListeners('close');
  mainWindow.removeAllListeners('closed');
  mainWindow.close();
  mainWindow = null;
  windowCreated = false;
  void createWindow();
});

(app as NodeJS.EventEmitter).on('refresh-services', () => {
  currentServices = mergeServices();
  buildMenu({
    store,
    app,
    services: currentServices,
    mainWindow,
    defaultUserAgent,
    getBasePath,
    loadServiceUrl,
    resetSettings,
    refreshMenu: menuRefreshCallback ?? undefined,
    t: (key, params) => i18n.t(store, key, params),
    onLocaleChange: () => {
      menuRefreshCallback?.();
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
    },
    openUrlDialog: (strings) => openUrlDialog(strings),
    openAboutDialog: (strings) => openAboutDialog(strings),
  });
  if (mainWindow && !mainWindow.isDestroyed()) {
    const u = mainWindow.webContents.getURL();
    if (u.startsWith('file:') && u.includes('index.html')) {
      mainWindow.webContents.send('set-services', getServicesPayload());
    }
  }
});

function ensureWindow(): void {
  if (!windowCreated) void createWindow();
}

(app as NodeJS.EventEmitter).on('widevine-ready', ensureWindow);
(app as NodeJS.EventEmitter).on('widevine-error', (error: Error) => {
  console.error('Widevine CDM no disponible:', error.message);
  ensureWindow();
});

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (msg.includes('No component') || msg.includes('Widevine') || msg.includes('404')) {
    ensureWindow();
  }
});

app.whenReady().then(() => {
  if (!store.get('version')) {
    store.set('version', app.getVersion());
    store.set('services', []);
  }
  setTimeout(ensureWindow, 2500);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
