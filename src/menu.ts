import { Menu, shell, BrowserWindow, app } from 'electron';
import * as path from 'path';
import type { Service } from './types';
import { getStreamingUserAgent, setActiveUserAgent } from './user-agent';
import { getLocale, setLocale, getUIStrings, SUPPORTED_LOCALES } from './i18n';

interface MenuParams {
  store: { get: (key: string) => unknown; set: (key: string, value: unknown) => void; delete: (key: string) => void };
  app: typeof import('electron').app;
  services: Service[];
  mainWindow: BrowserWindow | null;
  defaultUserAgent: string;
  getBasePath: () => string;
  loadServiceUrl?: (service: Service) => void;
  resetSettings?: () => void;
  refreshMenu?: () => void;
  /** Traducción: t(key, params?) */
  t: (key: string, params?: Record<string, string>) => string;
  /** Llamar tras cambiar idioma para recargar ventana y aplicar traducciones */
  onLocaleChange?: () => void;
  /** Abrir diálogo de URL personalizada (estilo de la app) */
  openUrlDialog?: (strings: { title: string; label: string; placeholder: string; cancel: string; submit: string }) => void;
  /** Abrir ventana Acerca de (estilo de la app, sin menús) */
  openAboutDialog?: (strings: { title: string; message: string; detail: string; closeLabel: string; githubLabel: string; githubUrl: string }) => void;
  /** Volver al menú principal (grilla de servicios) */
  goToMainMenu?: () => void;
  /** Abrir gestor visual de servicios */
  openServicesManagerDialog?: () => void;
}

function getOpt(store: MenuParams['store'], key: string, def: boolean | string): boolean | string {
  const v = store.get(key);
  return v === undefined ? def : (v as boolean | string);
}

export function buildMenu({
  store,
  app: electronApp,
  services,
  mainWindow,
  defaultUserAgent,
  getBasePath,
  loadServiceUrl,
  resetSettings,
  refreshMenu,
  t,
  onLocaleChange,
  openUrlDialog,
  openAboutDialog,
  goToMainMenu: goToMainMenuExternal,
  openServicesManagerDialog,
}: MenuParams): void {
  const goToMenu = (): void => {
    if (goToMainMenuExternal) {
      goToMainMenuExternal();
      return;
    }
    if (!mainWindow || mainWindow.isDestroyed()) return;
    setActiveUserAgent(defaultUserAgent);
    mainWindow.webContents.userAgent = getStreamingUserAgent();
    mainWindow.loadFile(path.join(getBasePath(), 'src', 'ui', 'index.html')).then(() => {
      mainWindow?.webContents.send('set-services', {
        services,
        lastUsedService: store.get('options.lastUsedService'),
        appVersion: electronApp.getVersion(),
        strings: getUIStrings(store),
      });
    });
  };

  const serviceItems = services.map((service) => ({
    label: service.name,
    visible: !service.hidden,
    click: () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (loadServiceUrl) {
        loadServiceUrl(service);
      } else {
        mainWindow.webContents.userAgent = setActiveUserAgent(service.userAgent || defaultUserAgent);
        mainWindow.loadURL(service.url);
      }
      mainWindow.webContents.send('run-loader', service);
    },
  }));

  const currentLocale = getLocale(store);

  const defaultServiceItems: Electron.MenuItemConstructorOptions[] = [
    { label: t('menu.prefs.mainMenu'), type: 'radio', checked: !getOpt(store, 'options.defaultService', ''), click: () => store.delete('options.defaultService') },
    { label: t('menu.prefs.lastPage'), type: 'radio', checked: getOpt(store, 'options.defaultService', '') === 'lastOpenedPage', click: () => store.set('options.defaultService', 'lastOpenedPage') },
    { type: 'separator' },
    ...services.map((service) => ({
      label: service.name,
      type: 'radio' as const,
      checked: getOpt(store, 'options.defaultService', '') === service.name,
      click: () => store.set('options.defaultService', service.name),
    })),
  ];

  const version = electronApp.getVersion();
  const isFullScreen = !!(mainWindow && !mainWindow.isDestroyed() && mainWindow.isFullScreen());

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: t('menu.appName'),
      submenu: [
        { label: `${t('menu.version')} ${version}`, enabled: false },
        { type: 'separator' },
        { label: t('menu.quit'), accelerator: 'CmdOrCtrl+Q', role: 'quit' as const },
      ],
    },
    {
      label: t('menu.nav.title'),
      submenu: [
        { label: t('menu.nav.mainMenu'), accelerator: 'CmdOrCtrl+H', click: goToMenu },
        { label: t('menu.nav.customUrl'), accelerator: 'CmdOrCtrl+O', click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          openUrlDialog?.({
            title: t('prompt.openUrl.title'),
            label: t('prompt.openUrl.label'),
            placeholder: t('prompt.openUrl.placeholder'),
            cancel: t('prompt.openUrl.cancel'),
            submit: t('prompt.openUrl.submit'),
          });
        }},
        { type: 'separator' },
        ...serviceItems,
      ],
    },
    {
      label: t('menu.play.title'),
      submenu: [
        { label: t('menu.play.backToMenu'), accelerator: 'CmdOrCtrl+H', click: goToMenu },
        { label: t('menu.play.reloadService'), click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.reload() },
        { type: 'separator' },
        {
          label: t('menu.play.alwaysOnTop'),
          type: 'checkbox',
          checked: !!getOpt(store, 'options.alwaysOnTop', false),
          click: (item) => {
            store.set('options.alwaysOnTop', item.checked);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.setAlwaysOnTop(!!item.checked);
            }
          },
        },
        {
          label: t('menu.play.fullscreen'),
          type: 'checkbox',
          checked: isFullScreen,
          click: (item) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.setFullScreen(!!item.checked);
              if (refreshMenu) refreshMenu();
            }
          },
        },
      ],
    },
    {
      label: t('menu.prefs.title'),
      submenu: [
        {
          label: t('menu.prefs.window'),
          submenu: [
            {
              label: t('menu.prefs.rememberSize'),
              type: 'checkbox',
              checked: !!getOpt(store, 'options.rememberWindowDetails', false),
              click: (item) => store.set('options.rememberWindowDetails', item.checked),
            },
            {
              label: t('menu.prefs.launchFullscreen'),
              type: 'checkbox',
              checked: !!getOpt(store, 'options.launchFullscreen', false),
              click: (item) => store.set('options.launchFullscreen', item.checked),
            },
            {
              label: t('menu.prefs.frameless'),
              type: 'checkbox',
              checked: !!getOpt(store, 'options.hideWindowFrame', false),
              click: (item) => {
                store.set('options.hideWindowFrame', item.checked);
                (electronApp as NodeJS.EventEmitter).emit('relaunch');
              },
            },
          ],
        },
        {
          label: t('menu.prefs.language'),
          submenu: SUPPORTED_LOCALES.map((code) => ({
            label: t('menu.prefs.lang.' + code),
            type: 'radio' as const,
            checked: currentLocale === code,
            click: () => {
              setLocale(store, code);
              if (onLocaleChange) onLocaleChange();
            },
          })),
        },
        {
          label: t('menu.prefs.services'),
          submenu: [
            {
              label: t('menu.prefs.visibleServices'),
              submenu: services.map((service) => ({
                label: service.name,
                type: 'checkbox' as const,
                checked: !service.hidden,
                click: (item: { checked: boolean }) => {
                  const curr = (store.get('services') as Partial<Service>[]) || [];
                  const existing = curr.find((s) => s.name === service.name);
                  if (existing) {
                    existing.hidden = !item.checked;
                  } else {
                    curr.push({ name: service.name, hidden: !item.checked });
                  }
                  store.set('services', curr);
                  (electronApp as NodeJS.EventEmitter).emit('refresh-services');
                },
              })),
            },
            {
              label: t('menu.prefs.startupService'),
              submenu: defaultServiceItems,
            },
            {
              label: t('menu.prefs.manageServices'),
              click: () => openServicesManagerDialog?.(),
            },
          ],
        },
        {
          label: t('menu.prefs.privacy'),
          submenu: [
            {
              label: t('menu.prefs.adblock'),
              type: 'checkbox',
              checked: !!getOpt(store, 'options.adblock', false),
              click: (item) => {
                store.set('options.adblock', item.checked);
                (electronApp as NodeJS.EventEmitter).emit('relaunch');
              },
            },
          ],
        },
        { type: 'separator' },
        { label: t('menu.prefs.reloadWindow'), accelerator: 'CmdOrCtrl+R', click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.reload() },
        { label: t('menu.prefs.resetPrefs'), click: () => resetSettings && resetSettings() },
        { label: t('menu.prefs.editConfig'), click: () => {
          const configPath = path.join(electronApp.getPath('userData'), 'config.json');
          shell.openPath(configPath).catch(() => shell.beep());
        }},
      ],
    },
    {
      label: t('menu.help.title'),
      submenu: [
        {
          label: t('menu.help.about'),
          click: () => openAboutDialog?.({
            title: t('about.title'),
            message: t('about.message'),
            detail: t('about.detail', { version }),
            closeLabel: t('about.close'),
            githubLabel: t('about.githubLink'),
            githubUrl: 'https://github.com/alktrip/catrip-player',
          }),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
