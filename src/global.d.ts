export {};

declare global {
  interface Window {
    catrip?: {
      ipc: {
        send: (channel: string, ...args: unknown[]) => void;
        on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
      };
    };
  }
}
