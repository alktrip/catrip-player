/**
 * Internacionalización (i18n) para CatripPlayer.
 * Carga traducciones desde src/locales/{locale}.json y expone getLocale, setLocale y t().
 */
import * as path from 'path';
import * as fs from 'fs';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt', 'de', 'zh'] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: LocaleCode = 'es';

/** Mapeo de app.getLocale() (ej. en-US, pt-BR) a nuestro código */
const LOCALE_MAP: Record<string, LocaleCode> = {
  es: 'es',
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  fr: 'fr',
  'fr-fr': 'fr',
  pt: 'pt',
  'pt-br': 'pt',
  'pt-pt': 'pt',
  de: 'de',
  'de-de': 'de',
  zh: 'zh',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
};

let basePath: string = '';

const messageCache: Record<string, Record<string, string>> = {};

export function init(base: string): void {
  basePath = base;
}

function loadMessages(locale: LocaleCode): Record<string, string> {
  if (messageCache[locale]) return messageCache[locale];
  const filePath = path.join(basePath, 'src', 'locales', locale + '.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw) as Record<string, string>;
    messageCache[locale] = data;
    return data;
  } catch {
    if (locale !== FALLBACK_LOCALE) return loadMessages(FALLBACK_LOCALE);
    messageCache[locale] = {};
    return {};
  }
}

export function getLocale(store: { get: (key: string) => unknown }): LocaleCode {
  const saved = store.get('options.locale');
  if (typeof saved === 'string' && SUPPORTED_LOCALES.includes(saved as LocaleCode)) {
    return saved as LocaleCode;
  }
  try {
    const appLocale = require('electron').app.getLocale().toLowerCase().replace('_', '-');
    return LOCALE_MAP[appLocale] ?? FALLBACK_LOCALE;
  } catch {
    return FALLBACK_LOCALE;
  }
}

export function setLocale(store: { set: (key: string, value: unknown) => void }, locale: LocaleCode): void {
  store.set('options.locale', locale);
}

/**
 * Devuelve la traducción de la clave. Sustituye {key} por params[key].
 * Fallback: si la clave no existe en el locale actual, usa español.
 */
export function t(
  store: { get: (key: string) => unknown },
  key: string,
  params?: Record<string, string>
): string {
  if (!basePath) return key;
  const locale = getLocale(store);
  const messages = loadMessages(locale);
  let msg = messages[key];
  if (msg === undefined) msg = loadMessages(FALLBACK_LOCALE)[key];
  if (msg === undefined) return key;
  if (params) {
    Object.keys(params).forEach((k) => {
      msg = (msg as string).replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
    });
  }
  return msg as string;
}

/** Devuelve todas las claves necesarias para la UI del renderer (pantalla de servicios). */
export function getUIStrings(store: { get: (key: string) => unknown }): Record<string, string> {
  const keys = [
    'ui.headerLabel',
    'ui.selectService',
    'ui.subtitle',
    'ui.emptyTitle',
    'ui.emptyHint',
    'ui.connecting',
    'ui.lastUsed',
    'ui.versionPrefix',
  ];
  const out: Record<string, string> = {};
  keys.forEach((k) => {
    out[k] = t(store, k);
  });
  return out;
}

export { SUPPORTED_LOCALES };
