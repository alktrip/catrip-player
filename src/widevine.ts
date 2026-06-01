import { app, components, dialog } from 'electron';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const STORE_RESTART_FLAG = 'widevine.pendingLinuxRestart';
const WIDEVINE_CDM_DIR = 'WidevineCdm';
const COMPONENT_CACHE_DIR = 'component_crx_cache';
const INSTALL_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const UPDATER_WARMUP_MS = 800;

interface WidevineStore {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
}

interface ComponentsErrorLike extends Error {
  errors?: Array<{ message?: string; detail?: { status?: string; version?: string | null } }>;
}

interface ComponentCacheMeta {
  hashes?: Record<string, { appid?: string; fp?: string }>;
}

function widevineCacheDir(): string {
  return path.join(app.getPath('userData'), WIDEVINE_CDM_DIR);
}

function linuxCdmLibPath(versionDir: string): string {
  const arch = process.arch === 'arm64' ? 'linux_arm64' : 'linux_x64';
  return path.join(versionDir, '_platform_specific', arch, 'libwidevinecdm.so');
}

function hasValidWidevineOnDisk(): boolean {
  const root = widevineCacheDir();
  if (!fs.existsSync(root)) return false;
  try {
    return fs.readdirSync(root).some((ver) => {
      if (ver.startsWith('latest-')) return false;
      return fs.existsSync(linuxCdmLibPath(path.join(root, ver)));
    });
  } catch {
    return false;
  }
}

/** Elimina caché vacía o sin libwidevinecdm.so (p. ej. tras fallos con Electron antiguo). */
export function clearStaleWidevineCache(): void {
  const root = widevineCacheDir();
  if (!fs.existsSync(root)) return;
  try {
    if (!hasValidWidevineOnDisk()) {
      fs.rmSync(root, { recursive: true, force: true });
      console.log('Widevine: caché local inválida eliminada, se volverá a instalar el CDM.');
    }
  } catch (err) {
    console.warn('Widevine: no se pudo limpiar caché:', err);
  }
}

function getWidevineStatus(): { version: string | null; status: string } {
  const id = components.WIDEVINE_CDM_ID;
  const entry = components.status()[id];
  return {
    version: entry?.version ?? null,
    status: entry?.status ?? 'unknown',
  };
}

function logComponentErrors(err: unknown): void {
  const ce = err as ComponentsErrorLike;
  if (ce.errors?.length) {
    for (const e of ce.errors) {
      console.error('Widevine component error:', e.message ?? e, e.detail ?? '');
    }
  }
}

function readManifestVersionFromCrx(crxPath: string): string | null {
  try {
    const out = execFileSync('unzip', ['-p', crxPath, 'manifest.json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const manifest = JSON.parse(out) as { version?: string };
    return manifest.version ?? null;
  } catch {
    return null;
  }
}

function extractCrxToDir(crxPath: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  try {
    execFileSync('unzip', ['-o', '-q', crxPath, '-d', destDir], { stdio: 'pipe' });
  } catch (err) {
    // CRX v3: unzip a veces devuelve código != 0 aunque extraiga el contenido.
    if (fs.readdirSync(destDir).length === 0) throw err;
  }
}

function writeLatestMarker(version: string): void {
  const marker = path.join(widevineCacheDir(), 'latest-component-updated-widevine-cdm');
  fs.writeFileSync(marker, `${version}\n`, 'utf8');
}

/**
 * El actualizador de Chromium a veces descarga el CRX en component_crx_cache pero no lo
 * desempaqueta en WidevineCdm (estado not-installed). Extraemos manualmente.
 */
function installFromComponentCache(): boolean {
  const cacheDir = path.join(app.getPath('userData'), COMPONENT_CACHE_DIR);
  const metaPath = path.join(cacheDir, 'metadata.json');
  if (!fs.existsSync(metaPath)) return false;

  let meta: ComponentCacheMeta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as ComponentCacheMeta;
  } catch {
    return false;
  }

  const widevineId = components.WIDEVINE_CDM_ID;
  let crxHash: string | null = null;
  for (const [hash, info] of Object.entries(meta.hashes ?? {})) {
    if (info.appid === widevineId) {
      crxHash = hash;
      break;
    }
  }
  if (!crxHash) return false;

  const crxPath = path.join(cacheDir, crxHash);
  if (!fs.existsSync(crxPath)) return false;

  const version = readManifestVersionFromCrx(crxPath);
  if (!version) return false;

  const dest = path.join(widevineCacheDir(), version);
  if (fs.existsSync(linuxCdmLibPath(dest))) return true;

  try {
    extractCrxToDir(crxPath, dest);
    writeLatestMarker(version);
    console.log(`Widevine: CDM ${version} instalado desde component_crx_cache.`);
    return fs.existsSync(linuxCdmLibPath(dest));
  } catch (err) {
    console.warn('Widevine: fallo al extraer CRX local:', err);
    try {
      fs.rmSync(dest, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

function findNewestBrowserWidevineDir(): string | null {
  const home = app.getPath('home');
  const roots = [
    path.join(home, '.config', 'BraveSoftware', 'Brave-Browser', WIDEVINE_CDM_DIR),
    path.join(home, '.config', 'google-chrome', WIDEVINE_CDM_DIR),
    path.join(home, '.config', 'chromium', WIDEVINE_CDM_DIR),
    path.join(home, '.config', 'microsoft-edge', WIDEVINE_CDM_DIR),
    path.join(home, '.config', 'opera', WIDEVINE_CDM_DIR),
    path.join(home, '.var', 'app', 'com.google.Chrome', 'config', 'google-chrome', WIDEVINE_CDM_DIR),
  ];

  let best: { version: string; src: string } | null = null;
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const ver of fs.readdirSync(root)) {
      if (ver.startsWith('latest-')) continue;
      const src = path.join(root, ver);
      if (!fs.existsSync(linuxCdmLibPath(src))) continue;
      if (!best || ver > best.version) best = { version: ver, src };
    }
  }
  return best?.src ?? null;
}

function installFromSystemBrowser(): boolean {
  const srcVersionDir = findNewestBrowserWidevineDir();
  if (!srcVersionDir) return false;

  const version = path.basename(srcVersionDir);
  const dest = path.join(widevineCacheDir(), version);
  if (fs.existsSync(linuxCdmLibPath(dest))) return true;

  try {
    fs.mkdirSync(widevineCacheDir(), { recursive: true });
    fs.cpSync(srcVersionDir, dest, { recursive: true });
    writeLatestMarker(version);
    console.log(`Widevine: CDM ${version} importado desde navegador del sistema.`);
    return fs.existsSync(linuxCdmLibPath(dest));
  } catch (err) {
    console.warn('Widevine: fallo al importar desde navegador:', err);
    return false;
  }
}

function ensureWidevineOnDisk(): boolean {
  if (hasValidWidevineOnDisk()) return true;
  if (installFromComponentCache()) return true;
  if (installFromSystemBrowser()) return true;
  return hasValidWidevineOnDisk();
}

async function promptLinuxRestart(): Promise<boolean> {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'CatripPlayer',
    message: 'Componente Widevine instalado',
    detail:
      'En Linux hace falta reiniciar la aplicación una vez para que Prime Video, Netflix y otros servicios con DRM puedan reproducir vídeo.',
    buttons: ['Reiniciar ahora', 'Más tarde'],
    defaultId: 0,
    cancelId: 1,
  });
  return response === 0;
}

export async function showWidevineFailureDialog(message: string): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    title: 'CatripPlayer — DRM (Widevine)',
    message: 'No se pudo preparar la reproducción protegida',
    detail:
      message +
      '\n\nPrime Video y otros servicios con DRM no funcionarán hasta que Widevine esté disponible. ' +
      'Comprueba que tienes Chrome o Brave instalado (con componentes actualizados), conexión a Internet, y vuelve a ejecutar npm start.',
    buttons: ['Entendido'],
  });
}

async function tryComponentUpdater(): Promise<void> {
  components.updatesEnabled = true;
  await new Promise((r) => setTimeout(r, UPDATER_WARMUP_MS));

  let lastErr: unknown;
  for (let attempt = 1; attempt <= INSTALL_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        console.log(`Widevine: reintento ${attempt}/${INSTALL_RETRIES}…`);
      }
      await components.whenReady([components.WIDEVINE_CDM_ID]);
      if (getWidevineStatus().version || hasValidWidevineOnDisk()) return;
      throw new Error(`CDM sin versión tras instalación (estado: ${getWidevineStatus().status})`);
    } catch (err) {
      lastErr = err;
      logComponentErrors(err);
      ensureWidevineOnDisk();
      if (hasValidWidevineOnDisk()) return;
    }
  }
  if (!hasValidWidevineOnDisk()) throw lastErr;
}

/**
 * Prepara el CDM Widevine: caché CRX local, importación desde navegador o component updater.
 */
export async function ensureWidevineReady(store?: WidevineStore): Promise<void> {
  clearStaleWidevineCache();

  const beforeOnDisk = hasValidWidevineOnDisk();
  ensureWidevineOnDisk();

  if (!hasValidWidevineOnDisk()) {
    await tryComponentUpdater();
    ensureWidevineOnDisk();
  } else {
    try {
      await tryComponentUpdater();
    } catch (err) {
      logComponentErrors(err);
      console.warn('Widevine: updater falló; usando CDM ya presente en disco.');
    }
  }

  if (!hasValidWidevineOnDisk()) {
    const st = getWidevineStatus();
    throw new Error(
      `Widevine CDM no disponible (estado: ${st.status}). Instala o abre Chrome/Brave una vez para que descargue Widevine.`
    );
  }

  const st = getWidevineStatus();
  const versions = fs
    .readdirSync(widevineCacheDir())
    .filter((v) => !v.startsWith('latest-') && fs.existsSync(linuxCdmLibPath(path.join(widevineCacheDir(), v))));
  console.log(
    `Widevine CDM listo en disco: ${versions.join(', ') || 'ok'}${st.version ? ` (componente: ${st.version})` : ''}`
  );

  if (process.platform !== 'linux' || !store) return;

  const pendingRestart = !!store.get(STORE_RESTART_FLAG);
  const firstInstall = !beforeOnDisk && hasValidWidevineOnDisk();

  if (firstInstall && !pendingRestart) {
    store.set(STORE_RESTART_FLAG, true);
    if (await promptLinuxRestart()) {
      app.relaunch();
      app.exit(0);
    }
    return;
  }

  if (pendingRestart && beforeOnDisk) {
    store.delete(STORE_RESTART_FLAG);
  }
}
