/**
 * Type declarations for the virtual:pwa-register module
 * provided by vite-plugin-pwa.
 */
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    /**
     * Called once the SW is registered.
     * @param swScriptUrl The URL of the registered service worker script.
     * @param registration The ServiceWorkerRegistration object, if available.
     */
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  /**
   * Registers the service worker with the given options.
   * @returns A function that, when called with `reloadPage = true`,
   *          sends `SKIP_WAITING` to the waiting SW and reloads the page.
   */
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
