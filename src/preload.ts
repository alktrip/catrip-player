import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('catrip', {
  ipc: {
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: (...args: unknown[]) => void) => {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => listener(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
  },
});
